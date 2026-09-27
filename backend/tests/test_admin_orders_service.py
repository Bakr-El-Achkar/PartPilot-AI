from datetime import (
    datetime,
    timezone,
)

import pytest

from app.services.admin_service import (
    AdminOrderInventoryError,
    AdminOrderService,
    AdminOrderStatusTransitionError,
)


class FakeAdminRepository:
    def __init__(
        self,
    ):
        now = datetime.now(
            timezone.utc
        )


        self.orders = [
            {
                "_id":
                    "order-1",

                "order_number":
                    "VHX-ADMIN001",

                "user_id":
                    "user-1",

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
                            2,

                        "line_total":
                            99.98,
                    }
                ],

                "subtotal":
                    99.98,

                "delivery_fee":
                    5.0,

                "discount":
                    0.0,

                "total":
                    104.98,

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
        ]


        self.users = {
            "user-1": {
                "_id":
                    "user-1",

                "first_name":
                    "Test",

                "last_name":
                    "Customer",

                "email":
                    "customer@example.com",

                "phone":
                    "+96170000000",
            }
        }

        self.competing_cancel = None


    def list_orders(
        self,
    ):
        return (
            self.orders
        )


    def find_order_by_id(
        self,
        order_id,
    ):
        return next(
            (
                order
                for order
                in self.orders
                if order[
                    "_id"
                ] == order_id
            ),
            None,
        )


    def update_order_status(
        self,
        order_id,
        new_status,
        expected_status=None,
    ):
        order = (
            self.find_order_by_id(
                order_id
            )
        )


        if order is None:
            return None

        if self.competing_cancel is not None:
            self.competing_cancel()
            self.competing_cancel = None

        if expected_status is not None and order["status"] != expected_status:
            return None


        order[
            "status"
        ] = new_status


        return order


    def find_user_by_id(
        self,
        user_id,
    ):
        return (
            self.users.get(
                user_id
            )
        )


class FakeProductRepository:
    def __init__(
        self,
    ):
        self.stock = {
            "product-1":
                3,
        }


    def increment_stock(
        self,
        product_id,
        quantity,
    ):
        if (
            product_id
            not in self.stock
        ):
            return False


        self.stock[
            product_id
        ] += quantity


        return True


    def decrement_stock(
        self,
        product_id,
        quantity,
    ):
        if (
            product_id
            not in self.stock
            or self.stock[
                product_id
            ] < quantity
        ):
            return False


        self.stock[
            product_id
        ] -= quantity


        return True


def make_service():
    repository = (
        FakeAdminRepository()
    )

    products = (
        FakeProductRepository()
    )


    service = (
        AdminOrderService(
            repository=
                repository,

            product_repository=
                products,
        )
    )


    return (
        service,
        repository,
        products,
    )


def test_admin_lists_all_orders_with_customer():
    service, _, _ = (
        make_service()
    )


    orders = (
        service.list_orders()
    )


    assert (
        len(
            orders
        )
        == 1
    )

    assert (
        orders[0][
            "customer_name"
        ]
        == "Test Customer"
    )

    assert (
        orders[0][
            "customer_email"
        ]
        == "customer@example.com"
    )


def test_admin_changes_processing_to_shipped():
    service, repository, _ = (
        make_service()
    )


    result = (
        service.update_status(
            "order-1",
            "shipped",
        )
    )


    assert (
        result[
            "status"
        ]
        == "shipped"
    )

    assert (
        repository.orders[
            0
        ][
            "status"
        ]
        == "shipped"
    )


def test_cancelling_processing_order_restores_stock():
    service, _, products = (
        make_service()
    )


    result = (
        service.update_status(
            "order-1",
            "cancelled",
        )
    )


    assert (
        result[
            "status"
        ]
        == "cancelled"
    )

    assert (
        products.stock[
            "product-1"
        ]
        == 5
    )


def test_competing_cancellation_does_not_restore_stock_twice():
    service, repository, products = make_service()

    def cancel_in_competing_request():
        repository.orders[0]["status"] = "cancelled"
        products.increment_stock("product-1", 2)

    repository.competing_cancel = cancel_in_competing_request

    with pytest.raises(AdminOrderStatusTransitionError):
        service.update_status("order-1", "cancelled")

    assert products.stock["product-1"] == 5
    assert repository.orders[0]["status"] == "cancelled"


def test_failed_stock_restore_reopens_order_for_retry():
    service, repository, products = make_service()
    products.stock.clear()

    with pytest.raises(AdminOrderInventoryError):
        service.update_status("order-1", "cancelled")

    assert repository.orders[0]["status"] == "processing"


def test_delivered_order_cannot_return_to_processing():
    service, repository, _ = (
        make_service()
    )


    repository.orders[
        0
    ][
        "status"
    ] = "delivered"


    with pytest.raises(
        AdminOrderStatusTransitionError
    ):
        service.update_status(
            "order-1",
            "processing",
        )
