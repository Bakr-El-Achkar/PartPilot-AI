from datetime import datetime

import pytest

from app.schemas.catalog import (
    ProductCreate,
    ProductUpdate,
)
from app.services.product_service import (
    ProductAlreadyExistsError,
    ProductReferenceError,
    ProductService,
    ProductValidationError,
)


class FakeProductRepository:
    def __init__(self):
        self.documents = []

    def find_by_sku(
        self,
        sku: str,
    ):
        for document in self.documents:
            if document["sku"] == sku:
                return document.copy()

        return None

    def find_by_slug(
        self,
        slug: str,
    ):
        for document in self.documents:
            if document["slug"] == slug:
                return document.copy()

        return None

    def find_by_id(
        self,
        product_id: str,
    ):
        for document in self.documents:
            if (
                str(document["_id"])
                == str(product_id)
            ):
                return document.copy()

        return None

    def create(
        self,
        product_data: dict,
    ):
        document = product_data.copy()

        document["_id"] = (
            f"product-{len(self.documents) + 1}"
        )

        self.documents.append(
            document
        )

        return document.copy()

    def list_active(
        self,
        *,
        category_id=None,
        brand_id=None,
        subcategory_slug=None,
    ):
        result = []

        for document in self.documents:
            if not document.get(
                "is_active"
            ):
                continue

            if (
                category_id is not None
                and document.get(
                    "category_id"
                )
                != category_id
            ):
                continue

            if (
                brand_id is not None
                and document.get(
                    "brand_id"
                )
                != brand_id
            ):
                continue

            if (
                subcategory_slug
                is not None
                and document.get(
                    "subcategory_slug"
                )
                != subcategory_slug
            ):
                continue

            result.append(
                document.copy()
            )

        return result

    def update(
        self,
        product_id: str,
        updates: dict,
    ):
        for index, document in enumerate(
            self.documents
        ):
            if (
                str(document["_id"])
                == str(product_id)
            ):
                updated = {
                    **document,
                    **updates,
                }

                self.documents[
                    index
                ] = updated

                return updated.copy()

        return None


class FakeCategoryRepository:
    def __init__(self):
        self.categories = {
            "category-1": {
                "_id": "category-1",
                "name": "Brakes",
                "slug": "brakes",
                "subcategories": [
                    {
                        "name": "Brake Pads",
                        "slug": "brake-pads",
                    },
                    {
                        "name": "Brake Rotors",
                        "slug": "brake-rotors",
                    },
                ],
                "is_active": True,
            }
        }

    def find_by_id(
        self,
        category_id: str,
    ):
        return self.categories.get(
            category_id
        )


class FakeBrandRepository:
    def __init__(self):
        self.brands = {
            "brand-1": {
                "_id": "brand-1",
                "name": "Bosch",
                "slug": "bosch",
                "is_active": True,
            }
        }

    def find_by_id(
        self,
        brand_id: str,
    ):
        return self.brands.get(
            brand_id
        )


def make_service():
    return ProductService(
        product_repository=(
            FakeProductRepository()
        ),
        category_repository=(
            FakeCategoryRepository()
        ),
        brand_repository=(
            FakeBrandRepository()
        ),
    )


def make_product(
    *,
    sku="BOSCH-BC1212",
    name="QuietCast Ceramic Brake Pads",
):
    return ProductCreate(
        name=name,
        sku=sku,
        part_number="BC1212",
        brand_id="brand-1",
        category_id="category-1",
        subcategory_slug=(
            "brake-pads"
        ),
        description=(
            "Premium ceramic front brake pads."
        ),
        price=49.99,
        sale_price=44.99,
        stock_quantity=24,
        images=[
            "https://example.com/brakes.jpg"
        ],
        specifications={
            "material": "Ceramic",
            "position": "Front",
        },
        warranty="12 months",
    )


def test_create_product_adds_catalog_defaults():
    service = make_service()

    product = service.create_product(
        make_product()
    )

    assert (
        product["id"]
        == "product-1"
    )

    assert product["slug"] == (
        "quietcast-ceramic-brake-pads"
    )

    assert (
        product["sku"]
        == "BOSCH-BC1212"
    )

    assert (
        product["rating_average"]
        == 0
    )

    assert (
        product["review_count"]
        == 0
    )

    assert (
        product["is_active"]
        is True
    )

    assert isinstance(
        product["created_at"],
        datetime,
    )

    assert isinstance(
        product["updated_at"],
        datetime,
    )


def test_create_product_rejects_duplicate_sku():
    service = make_service()

    service.create_product(
        make_product()
    )

    with pytest.raises(
        ProductAlreadyExistsError
    ):
        service.create_product(
            make_product()
        )


def test_create_product_rejects_unknown_brand():
    service = make_service()

    payload = make_product()

    payload.brand_id = (
        "unknown-brand"
    )

    with pytest.raises(
        ProductReferenceError
    ):
        service.create_product(
            payload
        )


def test_create_product_rejects_unknown_category():
    service = make_service()

    payload = make_product()

    payload.category_id = (
        "unknown-category"
    )

    with pytest.raises(
        ProductReferenceError
    ):
        service.create_product(
            payload
        )


def test_create_product_rejects_unknown_subcategory():
    service = make_service()

    payload = make_product()

    payload.subcategory_slug = (
        "not-real"
    )

    with pytest.raises(
        ProductReferenceError
    ):
        service.create_product(
            payload
        )


def test_duplicate_name_gets_unique_slug():
    service = make_service()

    first = service.create_product(
        make_product(
            sku="BOSCH-001",
        )
    )

    second = service.create_product(
        make_product(
            sku="BOSCH-002",
        )
    )

    assert first["slug"] == (
        "quietcast-ceramic-brake-pads"
    )

    assert second["slug"] == (
        "quietcast-ceramic-brake-pads-bosch-002"
    )


def test_list_products_supports_filters():
    service = make_service()

    service.create_product(
        make_product()
    )

    products = (
        service.list_products(
            category_id=(
                "category-1"
            ),
            brand_id="brand-1",
            subcategory_slug=(
                "brake-pads"
            ),
        )
    )

    assert len(products) == 1

    assert (
        products[0]["sku"]
        == "BOSCH-BC1212"
    )


def test_update_product_changes_price_and_stock():
    service = make_service()

    created = (
        service.create_product(
            make_product()
        )
    )

    updated = (
        service.update_product(
            created["id"],
            ProductUpdate(
                price=46.99,
                stock_quantity=12,
            ),
        )
    )

    assert updated is not None

    assert (
        updated["price"]
        == 46.99
    )

    assert (
        updated[
            "stock_quantity"
        ]
        == 12
    )

    # The existing sale price remains valid.
    assert (
        updated["sale_price"]
        == 44.99
    )


def test_update_rejects_sale_price_above_price():
    service = make_service()

    created = (
        service.create_product(
            make_product()
        )
    )

    with pytest.raises(
        ProductValidationError
    ):
        service.update_product(
            created["id"],
            ProductUpdate(
                price=30,
                sale_price=40,
            ),
        )