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


class FakeAdminDashboardService:
    def get_overview(
        self,
    ):
        return {
            "products":
                500,

            "fitments":
                500,

            "orders":
                128,

            "orders_this_month":
                34,

            "processing_orders":
                12,

            "users":
                246,

            "categories":
                16,

            "brands":
                20,

            "low_stock_items":
                8,

            "revenue":
                15320.75,
        }


ORIGINAL_ADMIN_SERVICE = (
    admin_routes
    .admin_dashboard_service
)


def admin_user():
    return {
        "_id":
            "admin-1",

        "email":
            "admin@vehnexa.test",

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
            "customer@vehnexa.test",

        "role":
            "customer",

        "is_active":
            True,
    }


def setup_function():
    admin_routes.admin_dashboard_service = (
        FakeAdminDashboardService()
    )


def teardown_function():
    app.dependency_overrides.pop(
        get_current_user,
        None,
    )


    admin_routes.admin_dashboard_service = (
        ORIGINAL_ADMIN_SERVICE
    )


def test_admin_can_get_overview():
    app.dependency_overrides[
        get_current_user
    ] = admin_user


    response = client.get(
        "/api/admin/overview"
    )


    assert (
        response.status_code
        == 200
    )


    data = (
        response.json()
    )


    assert (
        data["products"]
        == 500
    )

    assert (
        data["orders"]
        == 128
    )

    assert (
        data["users"]
        == 246
    )

    assert (
        data["revenue"]
        == 15320.75
    )


def test_customer_cannot_get_admin_overview():
    app.dependency_overrides[
        get_current_user
    ] = customer_user


    response = client.get(
        "/api/admin/overview"
    )


    assert (
        response.status_code
        == 403
    )


    assert response.json() == {
        "detail":
            "Admin access required"
    }
