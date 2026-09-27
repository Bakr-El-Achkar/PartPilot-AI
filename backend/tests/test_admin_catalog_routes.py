from datetime import (
    datetime,
    timezone,
)

from fastapi.testclient import (
    TestClient,
)

from app.dependencies.auth import (
    get_current_user,
)

from app.main import (
    app,
)

import app.routes.admin as admin_routes


client = TestClient(
    app
)


NOW = datetime.now(
    timezone.utc
)


class FakeCatalogService:
    def list_categories(
        self,
    ):
        return [
            {
                "id":
                    "category-1",

                "name":
                    "Brakes",

                "slug":
                    "brakes",

                "description":
                    None,

                "icon":
                    None,

                "subcategories":
                    [],

                "is_active":
                    False,

                "created_at":
                    NOW,

                "updated_at":
                    NOW,
            }
        ]


    def update_category(
        self,
        category_id,
        payload,
    ):
        if (
            category_id
            == "missing"
        ):
            return None


        category = (
            self.list_categories()[
                0
            ]
        )


        updates = (
            payload.model_dump(
                exclude_unset=True,
                mode="json",
            )
        )


        category.update(
            updates
        )

        return category


    def list_brands(
        self,
    ):
        return [
            {
                "id":
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
                    False,

                "created_at":
                    NOW,

                "updated_at":
                    NOW,
            }
        ]


    def update_brand(
        self,
        brand_id,
        payload,
    ):
        if (
            brand_id
            == "missing"
        ):
            return None


        brand = (
            self.list_brands()[
                0
            ]
        )


        updates = (
            payload.model_dump(
                exclude_unset=True,
                mode="json",
            )
        )


        brand.update(
            updates
        )

        return brand


ORIGINAL_SERVICE = (
    admin_routes
    .admin_catalog_service
)


def admin_user():
    return {
        "_id":
            "admin-1",

        "role":
            "admin",

        "is_active":
            True,
    }


def customer_user():
    return {
        "_id":
            "customer-1",

        "role":
            "customer",

        "is_active":
            True,
    }


def setup_function():
    admin_routes.admin_catalog_service = (
        FakeCatalogService()
    )


def teardown_function():
    app.dependency_overrides.pop(
        get_current_user,
        None,
    )


    admin_routes.admin_catalog_service = (
        ORIGINAL_SERVICE
    )


def test_admin_lists_categories_including_inactive():
    app.dependency_overrides[
        get_current_user
    ] = admin_user


    response = client.get(
        "/api/admin/categories"
    )


    assert (
        response.status_code
        == 200
    )


    assert (
        response.json()[
            0
        ][
            "is_active"
        ]
        is False
    )


def test_admin_updates_category():
    app.dependency_overrides[
        get_current_user
    ] = admin_user


    response = client.patch(
        "/api/admin/categories/category-1",
        json={
            "is_active":
                True,
        },
    )


    assert (
        response.status_code
        == 200
    )


    assert (
        response.json()[
            "is_active"
        ]
        is True
    )


def test_admin_lists_brands_including_inactive():
    app.dependency_overrides[
        get_current_user
    ] = admin_user


    response = client.get(
        "/api/admin/brands"
    )


    assert (
        response.status_code
        == 200
    )


def test_admin_updates_brand():
    app.dependency_overrides[
        get_current_user
    ] = admin_user


    response = client.patch(
        "/api/admin/brands/brand-1",
        json={
            "is_active":
                True,
        },
    )


    assert (
        response.status_code
        == 200
    )


def test_customer_cannot_manage_catalog():
    app.dependency_overrides[
        get_current_user
    ] = customer_user


    categories = client.get(
        "/api/admin/categories"
    )


    brands = client.get(
        "/api/admin/brands"
    )


    assert (
        categories.status_code
        == 403
    )


    assert (
        brands.status_code
        == 403
    )
