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

from app.services.admin_service import (
    AdminOrderStatusTransitionError,
)

import app.routes.admin as admin_routes


client = TestClient(
    app
)


def sample_order():
    now = datetime.now(
        timezone.utc
    )


    return {
        "id":
            "order-1",

        "order_number":
            "VHX-ADMIN001",

        "user_id":
            "user-1",

        "customer_name":
            "Test Customer",

        "customer_email":
            "customer@example.com",

        "customer_phone":
            None,

        "vehicle_id":
            "vehicle-1",

        "items": [
            {
                "product_id":
                    "product-1",

                "name":
                    "Brake Pads",

                "slug":
                    "brake-pads",

                "sku":
                    "PAD-001",

                "image_url":
                    None,

                "unit_price":
                    49.99,

                "quantity":
                    1,

                "line_total":
                    49.99,
            }
        ],

        "subtotal":
            49.99,

        "delivery_fee":
            5.0,

        "discount":
            0.0,

        "total":
            54.99,

        "payment_method":
            "cash_on_delivery",

        "payment_status":
            "pending",

        "shipping_address":
            "Tripoli, Lebanon",

        "status":
            "processing",

        "created_at":
            now,

        "updated_at":
            now,
    }


class FakeAdminOrderService:
    def __init__(
        self,
    ):
        self.order = (
            sample_order()
        )


    def list_orders(
        self,
    ):
        return [
            self.order
        ]


    def get_order(
        self,
        order_id,
    ):
        if (
            order_id
            != "order-1"
        ):
            return None


        return self.order


    def update_status(
        self,
        order_id,
        new_status,
    ):
        if (
            order_id
            == "missing"
        ):
            return None


        if (
            new_status
            == "cancelled"
            and self.order[
                "status"
            ] == "delivered"
        ):
            raise (
                AdminOrderStatusTransitionError(
                    "Order status cannot change "
                    "from delivered to cancelled"
                )
            )


        self.order[
            "status"
        ] = new_status


        return self.order


ORIGINAL_SERVICE = (
    admin_routes
    .admin_order_service
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
    admin_routes.admin_order_service = (
        FakeAdminOrderService()
    )


def teardown_function():
    app.dependency_overrides.pop(
        get_current_user,
        None,
    )


    admin_routes.admin_order_service = (
        ORIGINAL_SERVICE
    )


def test_admin_can_list_orders():
    app.dependency_overrides[
        get_current_user
    ] = admin_user


    response = client.get(
        "/api/admin/orders"
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


def test_customer_cannot_list_admin_orders():
    app.dependency_overrides[
        get_current_user
    ] = customer_user


    response = client.get(
        "/api/admin/orders"
    )


    assert (
        response.status_code
        == 403
    )


def test_admin_can_update_order_status():
    app.dependency_overrides[
        get_current_user
    ] = admin_user


    response = client.patch(
        "/api/admin/orders/order-1/status",
        json={
            "status":
                "shipped",
        },
    )


    assert (
        response.status_code
        == 200
    )

    assert (
        response.json()[
            "status"
        ]
        == "shipped"
    )


def test_missing_admin_order_returns_404():
    app.dependency_overrides[
        get_current_user
    ] = admin_user


    response = client.get(
        "/api/admin/orders/missing"
    )


    assert (
        response.status_code
        == 404
    )
