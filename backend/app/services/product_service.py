from datetime import (
    datetime,
    timezone,
)

from app.repositories.catalog_repository import (
    BrandRepository,
    CategoryRepository,
    brand_repository,
    category_repository,
)
from app.repositories.product_repository import (
    ProductRepository,
    product_repository,
)
from app.schemas.catalog import (
    ProductCreate,
    ProductUpdate,
)
from app.services.catalog_service import (
    slugify,
)


class ProductAlreadyExistsError(
    Exception
):
    pass


class ProductReferenceError(
    Exception
):
    pass


class ProductValidationError(
    Exception
):
    pass


class ProductService:
    def __init__(
        self,
        product_repository: ProductRepository,
        category_repository: CategoryRepository,
        brand_repository: BrandRepository,
    ):
        self.product_repository = (
            product_repository
        )

        self.category_repository = (
            category_repository
        )

        self.brand_repository = (
            brand_repository
        )

    # =========================================================
    # CREATE PRODUCT
    # =========================================================

    def create_product(
        self,
        product: ProductCreate,
    ) -> dict:
        normalized_sku = (
            product.sku.strip().upper()
        )

        existing_sku = (
            self.product_repository.find_by_sku(
                normalized_sku
            )
        )

        if existing_sku is not None:
            raise ProductAlreadyExistsError(
                "Product SKU already exists"
            )

        self._validate_references(
            brand_id=product.brand_id,
            category_id=(
                product.category_id
            ),
            subcategory_slug=(
                product.subcategory_slug
            ),
        )

        slug = self._build_unique_slug(
            product.name,
            normalized_sku,
        )

        now = datetime.now(
            timezone.utc
        )

        product_data = {
            "name": product.name.strip(),
            "slug": slug,
            "sku": normalized_sku,
            "part_number": (
                product.part_number.strip()
            ),
            "brand_id": (
                product.brand_id
            ),
            "category_id": (
                product.category_id
            ),
            "subcategory_slug": (
                product.subcategory_slug
            ),
            "description": (
                product.description.strip()
            ),
            "price": product.price,
            "sale_price": (
                product.sale_price
            ),
            "stock_quantity": (
                product.stock_quantity
            ),
            "images": list(
                product.images
            ),
            "specifications": dict(
                product.specifications
            ),
            "warranty": (
                product.warranty
            ),
            "rating_average": 0,
            "review_count": 0,
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        }

        created = (
            self.product_repository.create(
                product_data
            )
        )

        return self._serialize_product(
            created
        )

    # =========================================================
    # LIST PRODUCTS
    #
    # Public marketplace listing.
    #
    # Supports:
    # - category
    # - brand
    # - subcategory
    # - search
    # - price range
    # - availability
    # - sorting
    # =========================================================

    def list_products(
        self,
        *,
        category_id: str | None = None,
        brand_id: str | None = None,
        subcategory_slug: str | None = None,
        search: str | None = None,
        min_price: float | None = None,
        max_price: float | None = None,
        in_stock: bool | None = None,
        sort: str = "recommended",
    ) -> list[dict]:

        repository_filters: dict = {
            "category_id": category_id,
            "brand_id": brand_id,
            "subcategory_slug": (
                subcategory_slug
            ),
        }

        # -----------------------------------------------------
        # SEARCH
        #
        # Only forward when a search value exists.
        # This preserves compatibility with existing repository
        # fakes/tests that only know the original filters.
        # -----------------------------------------------------

        if (
            search is not None
            and search.strip()
        ):
            repository_filters[
                "search"
            ] = search.strip()

        # -----------------------------------------------------
        # MIN PRICE
        # -----------------------------------------------------

        if min_price is not None:
            repository_filters[
                "min_price"
            ] = min_price

        # -----------------------------------------------------
        # MAX PRICE
        # -----------------------------------------------------

        if max_price is not None:
            repository_filters[
                "max_price"
            ] = max_price

        # -----------------------------------------------------
        # STOCK
        #
        # None means no availability filter.
        # False is intentionally forwarded if explicitly used.
        # -----------------------------------------------------

        if in_stock is not None:
            repository_filters[
                "in_stock"
            ] = in_stock

        # -----------------------------------------------------
        # SORT
        #
        # The repository already defaults to "recommended".
        # Only forward a non-default sort.
        # -----------------------------------------------------

        if sort != "recommended":
            repository_filters[
                "sort"
            ] = sort

        products = (
            self.product_repository.list_active(
                **repository_filters
            )
        )

        return [
            self._serialize_product(
                product
            )
            for product in products
        ]

    # =========================================================
    # GET PRODUCT
    # =========================================================

    def get_product(
        self,
        product_id: str,
    ):
        product = (
            self.product_repository.find_by_id(
                product_id
            )
        )

        if product is None:
            return None

        return self._serialize_product(
            product
        )




    # =========================================================
    # GET PRODUCT BY SLUG
    # =========================================================

    def get_product_by_slug(
        self,
        slug: str,
    ):
        product = (
            self.product_repository.find_by_slug(
                slug
            )
        )

        if product is None:
            return None

        if not product.get(
            "is_active",
            True,
        ):
            return None

        return self._serialize_product(
            product
        )

    # =========================================================
    # UPDATE PRODUCT
    # =========================================================

    def update_product(
        self,
        product_id: str,
        update: ProductUpdate,
    ):
        existing = (
            self.product_repository.find_by_id(
                product_id
            )
        )

        if existing is None:
            return None

        updates = update.model_dump(
            exclude_unset=True
        )

        if not updates:
            return self._serialize_product(
                existing
            )

        brand_id = updates.get(
            "brand_id",
            existing["brand_id"],
        )

        category_id = updates.get(
            "category_id",
            existing["category_id"],
        )

        subcategory_slug = updates.get(
            "subcategory_slug",
            existing[
                "subcategory_slug"
            ],
        )

        self._validate_references(
            brand_id=brand_id,
            category_id=category_id,
            subcategory_slug=(
                subcategory_slug
            ),
        )

        final_price = updates.get(
            "price",
            existing["price"],
        )

        final_sale_price = updates.get(
            "sale_price",
            existing.get(
                "sale_price"
            ),
        )

        if (
            final_sale_price is not None
            and final_sale_price
            > final_price
        ):
            raise ProductValidationError(
                "Sale price cannot be greater "
                "than regular price"
            )

        if "name" in updates:
            updates["name"] = (
                updates["name"].strip()
            )

            updates["slug"] = (
                self._build_unique_slug(
                    updates["name"],
                    existing["sku"],
                    exclude_product_id=(
                        product_id
                    ),
                )
            )

        if "part_number" in updates:
            updates["part_number"] = (
                updates[
                    "part_number"
                ].strip()
            )

        if "description" in updates:
            updates["description"] = (
                updates[
                    "description"
                ].strip()
            )

        updates["updated_at"] = (
            datetime.now(
                timezone.utc
            )
        )

        updated = (
            self.product_repository.update(
                product_id,
                updates,
            )
        )

        if updated is None:
            return None

        return self._serialize_product(
            updated
        )

    # =========================================================
    # VALIDATE REFERENCES
    # =========================================================

    def _validate_references(
        self,
        *,
        brand_id: str,
        category_id: str,
        subcategory_slug: str,
    ) -> None:
        brand = (
            self.brand_repository.find_by_id(
                brand_id
            )
        )

        if (
            brand is None
            or not brand.get(
                "is_active",
                True,
            )
        ):
            raise ProductReferenceError(
                "Brand not found"
            )

        category = (
            self.category_repository.find_by_id(
                category_id
            )
        )

        if (
            category is None
            or not category.get(
                "is_active",
                True,
            )
        ):
            raise ProductReferenceError(
                "Category not found"
            )

        valid_subcategory = any(
            subcategory.get(
                "slug"
            )
            == subcategory_slug
            for subcategory
            in category.get(
                "subcategories",
                [],
            )
        )

        if not valid_subcategory:
            raise ProductReferenceError(
                "Subcategory does not belong "
                "to selected category"
            )

    # =========================================================
    # BUILD UNIQUE SLUG
    # =========================================================

    def _build_unique_slug(
        self,
        name: str,
        sku: str,
        exclude_product_id: str
        | None = None,
    ) -> str:
        base_slug = slugify(
            name
        )

        existing = (
            self.product_repository.find_by_slug(
                base_slug
            )
        )

        if (
            existing is None
            or (
                exclude_product_id
                is not None
                and str(
                    existing["_id"]
                )
                == str(
                    exclude_product_id
                )
            )
        ):
            return base_slug

        sku_slug = slugify(
            sku
        )

        candidate = (
            f"{base_slug}-{sku_slug}"
        )

        existing_candidate = (
            self.product_repository.find_by_slug(
                candidate
            )
        )

        if (
            existing_candidate
            is None
            or (
                exclude_product_id
                is not None
                and str(
                    existing_candidate[
                        "_id"
                    ]
                )
                == str(
                    exclude_product_id
                )
            )
        ):
            return candidate

        raise ProductAlreadyExistsError(
            "Product slug already exists"
        )

    # =========================================================
    # SERIALIZE PRODUCT
    # =========================================================

    @staticmethod
    def _serialize_product(
        product: dict,
    ) -> dict:
        return {
            "id": str(
                product["_id"]
            ),
            "name": product[
                "name"
            ],
            "slug": product[
                "slug"
            ],
            "sku": product[
                "sku"
            ],
            "part_number": (
                product[
                    "part_number"
                ]
            ),
            "brand_id": str(
                product[
                    "brand_id"
                ]
            ),
            "category_id": str(
                product[
                    "category_id"
                ]
            ),
            "subcategory_slug": (
                product[
                    "subcategory_slug"
                ]
            ),
            "description": (
                product[
                    "description"
                ]
            ),
            "price": product[
                "price"
            ],
            "sale_price": (
                product.get(
                    "sale_price"
                )
            ),
            "stock_quantity": (
                product[
                    "stock_quantity"
                ]
            ),
            "images": product.get(
                "images",
                [],
            ),
            "specifications": (
                product.get(
                    "specifications",
                    {},
                )
            ),
            "warranty": (
                product.get(
                    "warranty"
                )
            ),
            "rating_average": (
                product.get(
                    "rating_average",
                    0,
                )
            ),
            "review_count": (
                product.get(
                    "review_count",
                    0,
                )
            ),
            "is_active": (
                product.get(
                    "is_active",
                    True,
                )
            ),
            "created_at": (
                product[
                    "created_at"
                ]
            ),
            "updated_at": (
                product[
                    "updated_at"
                ]
            ),
        }


# =============================================================
# DEFAULT PRODUCT SERVICE
# =============================================================

product_service = ProductService(
    product_repository=(
        product_repository
    ),
    category_repository=(
        category_repository
    ),
    brand_repository=(
        brand_repository
    ),
)