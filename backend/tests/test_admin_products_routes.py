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


class FakeAdminProductService:
    def list_products(
        self,
    ):
        return [
            {
                "id":
                    "product-1",

                "name":
                    "Brake Pads",

                "slug":
                    "brake-pads",

                "sku":
                    "PAD-001",

                "part_number":
                    "P001",

                "brand_id":
                    "brand-1",

                "category_id":
                    "category-1",

                "subcategory_slug":
                    "brake-pads",

                "description":
                    "Test product",

                "price":
                    50.0,

                "sale_price":
                    None,

                "stock_quantity":
                    5,

                "images":
                    [],

                "specifications":
                    {},

                "warranty":
                    None,

                "rating_average":
                    0,

                "review_count":
                    0,

                "is_active":
                    False,

                "created_at":
                    NOW,

                "updated_at":
                    NOW,
            }
        ]


ORIGINAL_SERVICE = (
    admin_routes
    .admin_product_service
)


def admin_user():
    return {
        "_id":
            "admin-1",

        "email":
            "admin@example.com",

        "role":
            "admin",

        "is_active":
            True,
    }


def customer_user():
    return {
        "_id":
            "customer-1",

        "email":
            "customer@example.com",

        "role":
            "customer",

        "is_active":
            True,
    }


def setup_function():
    admin_routes.admin_product_service = (
        FakeAdminProductService()
    )


def teardown_function():
    app.dependency_overrides.pop(
        get_current_user,
        None,
    )


    admin_routes.admin_product_service = (
        ORIGINAL_SERVICE
    )


def test_admin_can_list_all_products():
    app.dependency_overrides[
        get_current_user
    ] = admin_user


    response = client.get(
        "/api/admin/products"
    )


    assert (
        response.status_code
        == 200
    )


    assert (
        len(
            response.json()
        )
        == 1
    )


    assert (
        response.json()[
            0
        ][
            "is_active"
        ]
        is False
    )


def test_customer_cannot_list_admin_products():
    app.dependency_overrides[
        get_current_user
    ] = customer_user


    response = client.get(
        "/api/admin/products"
    )


    assert (
        response.status_code
        == 403
    )
