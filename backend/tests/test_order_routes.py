from datetime import (
    datetime,
    timezone,
)

from bson import ObjectId
from fastapi.testclient import (
    TestClient,
)

from app.dependencies.auth import (
    get_current_user,
)
from app.main import app
from app.services.order_service import (
    OrderIdempotencyConflictError,
    OrderStockError,
)

import app.routes.orders as order_routes


client = TestClient(
    app
)

USER_ID = ObjectId()
KEY = "a8e4bd48-21c6-4d07-a8f4-5dc0184f0c49"
HEADERS = {"Idempotency-Key": KEY}


def fake_current_user():
    return {
        "_id":
            USER_ID,

        "first_name":
            "Bakr",

        "last_name":
            "User",

        "email":
            "bakr@example.com",

        "role":
            "customer",

        "is_active":
            True,
    }


def sample_order():
    now = datetime.now(
        timezone.utc
    )

    return {
        "id":
            "order-1",

        "order_number":
            "VHX-TEST0001",

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


class FakeOrderService:
    def __init__(self):
        self.orders = [
            sample_order()
        ]
        self.last_idempotency_key = None

    def create_order(
        self,
        user_id,
        payload,
        idempotency_key,
    ):
        self.last_idempotency_key = idempotency_key
        order = (
            sample_order()
        )

        order["id"] = (
            "order-2"
        )

        order[
            "shipping_address"
        ] = (
            payload
            .shipping_address
        )

        self.orders.append(
            order
        )

        return order

    def list_orders(
        self,
        user_id,
    ):
        return self.orders

    def get_order(
        self,
        order_id,
        user_id,
    ):
        for order in self.orders:
            if (
                order["id"]
                == order_id
            ):
                return order

        return None


def setup_function():
    app.dependency_overrides[
        get_current_user
    ] = fake_current_user

    order_routes.order_service = (
        FakeOrderService()
    )


def teardown_function():
    app.dependency_overrides.clear()


def test_create_order_route():
    response = client.post(
        "/api/orders",
        headers=HEADERS,
        json={
            "items": [
                {
                    "product_id":
                        "product-1",

                    "quantity": 1,
                }
            ],

            "vehicle_id":
                "vehicle-1",

            "shipping_address":
                "Tripoli, Lebanon",

            "payment_method":
                "cash_on_delivery",
        },
    )

    assert (
        response.status_code
        == 201
    )

    data = response.json()

    assert (
        data[
            "order_number"
        ]
        == "VHX-TEST0001"
    )

    assert (
        data[
            "total"
        ]
        == 54.99
    )
    assert order_routes.order_service.last_idempotency_key == KEY


def test_create_order_requires_idempotency_key():
    response = client.post(
        "/api/orders",
        json={
            "items": [{"product_id": "product-1", "quantity": 1}],
            "shipping_address": "Tripoli, Lebanon",
        },
    )

    assert response.status_code == 422


def test_create_order_rejects_non_uuid_idempotency_key():
    response = client.post(
        "/api/orders",
        headers={"Idempotency-Key": "customer-email@example.com"},
        json={
            "items": [{"product_id": "product-1", "quantity": 1}],
            "shipping_address": "Tripoli, Lebanon",
        },
    )

    assert response.status_code == 422


def test_idempotency_conflict_maps_to_409():
    class ConflictService(FakeOrderService):
        def create_order(self, user_id, payload, idempotency_key):
            raise OrderIdempotencyConflictError("Key belongs to another request")

    order_routes.order_service = ConflictService()
    response = client.post(
        "/api/orders",
        headers=HEADERS,
        json={
            "items": [{"product_id": "product-1", "quantity": 1}],
            "shipping_address": "Tripoli, Lebanon",
        },
    )

    assert response.status_code == 409


def test_list_orders_route():
    response = client.get(
        "/api/orders"
    )

    assert (
        response.status_code
        == 200
    )

    assert len(
        response.json()
    ) == 1


def test_get_order_route():
    response = client.get(
        "/api/orders/order-1"
    )

    assert (
        response.status_code
        == 200
    )

    assert (
        response.json()[
            "id"
        ]
        == "order-1"
    )


def test_get_missing_order_returns_404():
    response = client.get(
        "/api/orders/missing"
    )

    assert (
        response.status_code
        == 404
    )


def test_stock_error_maps_to_409():
    class StockFailureService(
        FakeOrderService
    ):
        def create_order(
            self,
            user_id,
            payload,
            idempotency_key,
        ):
            raise OrderStockError(
                "Insufficient stock"
            )

    order_routes.order_service = (
        StockFailureService()
    )

    response = client.post(
        "/api/orders",
        headers=HEADERS,
        json={
            "items": [
                {
                    "product_id":
                        "product-1",

                    "quantity": 1,
                }
            ],

            "shipping_address":
                "Tripoli, Lebanon",
        },
    )

    assert (
        response.status_code
        == 409
    )
