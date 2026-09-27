from datetime import (
    datetime,
    timezone,
)

import pytest

from app.schemas.admin import (
    AdminBrandUpdate,
    AdminCategoryUpdate,
)

from app.services.admin_service import (
    AdminCatalogAlreadyExistsError,
    AdminCatalogService,
)


class FakeRepository:
    def __init__(
        self,
    ):
        now = datetime.now(
            timezone.utc
        )


        self.categories = {
            "category-1": {
                "_id":
                    "category-1",

                "name":
                    "Brakes",

                "slug":
                    "brakes",

                "description":
                    "Brake components",

                "icon":
                    None,

                "subcategories": [
                    {
                        "name":
                            "Brake Pads",

                        "slug":
                            "brake-pads",
                    }
                ],

                "is_active":
                    True,

                "created_at":
                    now,

                "updated_at":
                    now,
            }
        }


        self.brands = {
            "brand-1": {
                "_id":
                    "brand-1",

                "name":
                    "Bosch",

                "slug":
                    "bosch",

                "description":
                    None,

                "country":
                    "Germany",

                "website":
                    None,

                "logo_url":
                    None,

                "is_active":
                    True,

                "created_at":
                    now,

                "updated_at":
                    now,
            }
        }


    def list_categories(
        self,
    ):
        return list(
            self.categories
            .values()
        )


    def find_category_by_id(
        self,
        category_id,
    ):
        return (
            self.categories.get(
                category_id
            )
        )


    def find_category_by_slug(
        self,
        slug,
    ):
        return next(
            (
                item
                for item
                in self.categories
                .values()
                if item[
                    "slug"
                ] == slug
            ),
            None,
        )


    def update_category(
        self,
        category_id,
        updates,
    ):
        item = (
            self.categories.get(
                category_id
            )
        )


        if item is None:
            return None


        item.update(
            updates
        )

        return item


    def list_brands(
        self,
    ):
        return list(
            self.brands
            .values()
        )


    def find_brand_by_id(
        self,
        brand_id,
    ):
        return (
            self.brands.get(
                brand_id
            )
        )


    def find_brand_by_slug(
        self,
        slug,
    ):
        return next(
            (
                item
                for item
                in self.brands
                .values()
                if item[
                    "slug"
                ] == slug
            ),
            None,
        )


    def update_brand(
        self,
        brand_id,
        updates,
    ):
        item = (
            self.brands.get(
                brand_id
            )
        )


        if item is None:
            return None


        item.update(
            updates
        )

        return item


def make_service():
    return (
        AdminCatalogService(
            repository=
                FakeRepository(),
        )
    )


def test_admin_lists_categories_and_brands():
    service = (
        make_service()
    )


    assert (
        len(
            service.list_categories()
        )
        == 1
    )


    assert (
        len(
            service.list_brands()
        )
        == 1
    )


def test_admin_updates_category_and_subcategories():
    service = (
        make_service()
    )


    result = (
        service.update_category(
            "category-1",
            AdminCategoryUpdate(
                name=
                    "Brake System",

                subcategories=[
                    {
                        "name":
                            "Brake Pads"
                    },

                    {
                        "name":
                            "Brake Rotors"
                    },
                ],
            ),
        )
    )


    assert (
        result[
            "slug"
        ]
        == "brake-system"
    )


    assert (
        result[
            "subcategories"
        ][
            1
        ][
            "slug"
        ]
        == "brake-rotors"
    )


def test_admin_can_deactivate_category():
    service = (
        make_service()
    )


    result = (
        service.update_category(
            "category-1",
            AdminCategoryUpdate(
                is_active=
                    False
            ),
        )
    )


    assert (
        result[
            "is_active"
        ]
        is False
    )


def test_admin_updates_brand():
    service = (
        make_service()
    )


    result = (
        service.update_brand(
            "brand-1",
            AdminBrandUpdate(
                name=
                    "Bosch Automotive",

                country=
                    "Germany",
            ),
        )
    )


    assert (
        result[
            "slug"
        ]
        == "bosch-automotive"
    )


def test_admin_rejects_duplicate_category_slug():
    service = (
        make_service()
    )


    repository = (
        service.repository
    )


    now = datetime.now(
        timezone.utc
    )


    repository.categories[
        "category-2"
    ] = {
        "_id":
            "category-2",

        "name":
            "Engine",

        "slug":
            "engine",

        "description":
            None,

        "icon":
            None,

        "subcategories":
            [],

        "is_active":
            True,

        "created_at":
            now,

        "updated_at":
            now,
    }


    with pytest.raises(
        AdminCatalogAlreadyExistsError
    ):
        service.update_category(
            "category-1",
            AdminCategoryUpdate(
                name=
                    "Engine"
            ),
        )
