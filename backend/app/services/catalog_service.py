import re
import unicodedata
from datetime import datetime, timezone

from app.repositories.catalog_repository import (
    BrandRepository,
    CategoryRepository,
    brand_repository,
    category_repository,
)
from app.schemas.catalog import (
    BrandCreate,
    CategoryCreate,
)


class CatalogAlreadyExistsError(
    Exception
):
    pass


def slugify(value: str) -> str:
    normalized = unicodedata.normalize(
        "NFKD",
        value,
    )

    ascii_value = normalized.encode(
        "ascii",
        "ignore",
    ).decode("ascii")

    ascii_value = ascii_value.lower()

    ascii_value = re.sub(
        r"[^a-z0-9]+",
        "-",
        ascii_value,
    )

    return ascii_value.strip("-")


class CategoryService:
    def __init__(
        self,
        repository: CategoryRepository,
    ):
        self.repository = repository

    def create_category(
        self,
        category: CategoryCreate,
    ) -> dict:
        slug = slugify(
            category.name
        )

        existing = (
            self.repository.find_by_slug(
                slug
            )
        )

        if existing is not None:
            raise CatalogAlreadyExistsError(
                "Category already exists"
            )

        now = datetime.now(
            timezone.utc
        )

        subcategories = []

        for subcategory in (
            category.subcategories
        ):
            subcategories.append(
                {
                    "name": (
                        subcategory.name
                    ),
                    "slug": slugify(
                        subcategory.name
                    ),
                }
            )

        category_data = {
            "name": category.name,
            "slug": slug,
            "description": (
                category.description
            ),
            "icon": category.icon,
            "subcategories": (
                subcategories
            ),
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        }

        created = (
            self.repository.create(
                category_data
            )
        )

        return self._serialize_category(
            created
        )

    def list_categories(
        self,
    ) -> list[dict]:
        categories = (
            self.repository.list_active()
        )

        return [
            self._serialize_category(
                category
            )
            for category in categories
        ]

    @staticmethod
    def _serialize_category(
        category: dict,
    ) -> dict:
        return {
            "id": str(
                category["_id"]
            ),
            "name": category["name"],
            "slug": category["slug"],
            "description": (
                category.get(
                    "description"
                )
            ),
            "icon": category.get(
                "icon"
            ),
            "subcategories": (
                category.get(
                    "subcategories",
                    [],
                )
            ),
            "is_active": (
                category.get(
                    "is_active",
                    True,
                )
            ),
            "created_at": (
                category[
                    "created_at"
                ]
            ),
            "updated_at": (
                category[
                    "updated_at"
                ]
            ),
        }


class BrandService:
    def __init__(
        self,
        repository: BrandRepository,
    ):
        self.repository = repository

    def create_brand(
        self,
        brand: BrandCreate,
    ) -> dict:
        slug = slugify(
            brand.name
        )

        existing = (
            self.repository.find_by_slug(
                slug
            )
        )

        if existing is not None:
            raise CatalogAlreadyExistsError(
                "Brand already exists"
            )

        now = datetime.now(
            timezone.utc
        )

        brand_data = {
            "name": brand.name,
            "slug": slug,
            "description": (
                brand.description
            ),
            "country": (
                brand.country
            ),
            "website": (
                str(brand.website)
                if brand.website
                else None
            ),
            "logo_url": (
                str(brand.logo_url)
                if brand.logo_url
                else None
            ),
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        }

        created = (
            self.repository.create(
                brand_data
            )
        )

        return self._serialize_brand(
            created
        )

    def list_brands(
        self,
    ) -> list[dict]:
        brands = (
            self.repository.list_active()
        )

        return [
            self._serialize_brand(
                brand
            )
            for brand in brands
        ]

    @staticmethod
    def _serialize_brand(
        brand: dict,
    ) -> dict:
        return {
            "id": str(
                brand["_id"]
            ),
            "name": brand["name"],
            "slug": brand["slug"],
            "description": (
                brand.get(
                    "description"
                )
            ),
            "country": (
                brand.get(
                    "country"
                )
            ),
            "website": (
                brand.get(
                    "website"
                )
            ),
            "logo_url": (
                brand.get(
                    "logo_url"
                )
            ),
            "is_active": (
                brand.get(
                    "is_active",
                    True,
                )
            ),
            "created_at": (
                brand[
                    "created_at"
                ]
            ),
            "updated_at": (
                brand[
                    "updated_at"
                ]
            ),
        }


category_service = CategoryService(
    category_repository
)

brand_service = BrandService(
    brand_repository
)