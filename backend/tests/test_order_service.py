from app.schemas.order import (
    OrderCreate,
)
from app.services.order_service import (
    OrderService,
    OrderStockError,
    OrderVehicleNotFoundError,
)


KEY = "a8e4bd48-21c6-4d07-a8f4-5dc0184f0c49"


class FakeTransaction:
    def __init__(self):
        self.stock_changes = {}
        self.orders = []


class FakeOrderRepository:
    def __init__(self, products):
        self.orders = []
        self.counter = 1
        self.products = products

    def ensure_idempotency_index(self):
        pass

    def find_by_idempotency_key(self, user_id, key, *, session=None):
        return next(
            (order for order in self.orders
             if order["user_id"] == user_id
             and order["idempotency_key"] == key),
            None,
        )

    def run_transaction(self, callback):
        session = FakeTransaction()
        result = callback(session)
        for product_id, change in session.stock_changes.items():
            self.products.products[product_id]["stock_quantity"] += change
        self.orders.extend(session.orders)
        return result

    def create(
        self,
        document,
        *,
        session=None,
    ):
        created = {
            **document,
            "_id":
                f"order-{self.counter}",
        }

        self.counter += 1

        if session is None:
            self.orders.append(created)
        else:
            session.orders.append(created)

        return created


    def find_by_user_id(
        self,
        user_id,
    ):
        return [
            order
            for order in self.orders
            if order[
                "user_id"
            ] == user_id
        ]

    def find_by_id_for_user(
        self,
        order_id,
        user_id,
    ):
        for order in self.orders:
            if (
                str(
                    order["_id"]
                )
                == order_id
                and order[
                    "user_id"
                ]
                == user_id
            ):
                return order

        return None


class FakeProductRepository:
    def __init__(self):
        self.products = {
            "product-1": {
                "_id":
                    "product-1",
                "name":
                    "Brake Pads",
                "slug":
                    "brake-pads",
                "sku":
                    "PAD-001",
                "price":
                    59.99,
                "sale_price":
                    49.99,
                "stock_quantity":
                    5,
                "images": [],
                "is_active":
                    True,
            },

            "product-2": {
                "_id":
                    "product-2",
                "name":
                    "Brake Rotor",
                "slug":
                    "brake-rotor",
                "sku":
                    "ROT-001",
                "price":
                    79.00,
                "sale_price":
                    None,
                "stock_quantity":
                    2,
                "images": [],
                "is_active":
                    True,
            },
        }

    def find_by_id(
        self,
        product_id,
    ):
        return self.products.get(
            product_id
        )

    def decrement_stock(
        self,
        product_id,
        quantity,
        *,
        session=None,
    ):
        product = (
            self.products.get(
                product_id
            )
        )

        if (
            product is None
            or product["stock_quantity"]
            + (session.stock_changes.get(product_id, 0) if session else 0)
            < quantity
        ):
            return False

        if session is None:
            product["stock_quantity"] -= quantity
        else:
            session.stock_changes[product_id] = (
                session.stock_changes.get(product_id, 0) - quantity
            )

        return True

    def increment_stock(
        self,
        product_id,
        quantity,
    ):
        product = (
            self.products.get(
                product_id
            )
        )

        if product is None:
            return False

        product[
            "stock_quantity"
        ] += quantity

        return True


class FakeVehicleRepository:
    def find_by_id_for_user(
        self,
        vehicle_id,
        user_id,
    ):
        if (
            vehicle_id
            == "vehicle-1"
            and user_id
            == "user-1"
        ):
            return {
                "_id":
                    "vehicle-1",
                "user_id":
                    "user-1",
            }

        return None


def make_service():
    products = FakeProductRepository()
    return (
        OrderService(
            order_repository=(
                FakeOrderRepository(products)
            ),
            product_repository=(
                products
            ),
            vehicle_repository=(
                FakeVehicleRepository()
            ),
        )
    )


def test_create_order_uses_server_prices():
    service = make_service()

    result = service.create_order(
        "user-1",
        OrderCreate(
            items=[
                {
                    "product_id":
                        "product-1",
                    "quantity": 2,
                }
            ],
            vehicle_id=(
                "vehicle-1"
            ),
            shipping_address=(
                "Tripoli, Lebanon"
            ),
        ),
        KEY,
    )

    assert (
        result["subtotal"]
        == 99.98
    )

    assert (
        result["delivery_fee"]
        == 5.0
    )

    assert (
        result["total"]
        == 104.98
    )

    assert (
        result["items"][0][
            "unit_price"
        ]
        == 49.99
    )


def test_create_order_decrements_stock():
    service = make_service()

    service.create_order(
        "user-1",
        OrderCreate(
            items=[
                {
                    "product_id":
                        "product-1",
                    "quantity": 2,
                }
            ],
            shipping_address=(
                "Tripoli, Lebanon"
            ),
        ),
        KEY,
    )

    assert (
        service
        .product_repository
        .products[
            "product-1"
        ][
            "stock_quantity"
        ]
        == 3
    )


def test_create_order_rejects_insufficient_stock():
    service = make_service()

    try:
        service.create_order(
            "user-1",
            OrderCreate(
                items=[
                    {
                        "product_id":
                            "product-2",
                        "quantity": 3,
                    }
                ],
                shipping_address=(
                    "Tripoli, Lebanon"
                ),
            ),
            KEY,
        )

    except OrderStockError:
        pass

    else:
        raise AssertionError(
            "Expected OrderStockError"
        )

    assert (
        service
        .order_repository
        .orders
        == []
    )


def test_order_vehicle_must_belong_to_user():
    service = make_service()

    try:
        service.create_order(
            "user-2",
            OrderCreate(
                items=[
                    {
                        "product_id":
                            "product-1",
                        "quantity": 1,
                    }
                ],
                vehicle_id=(
                    "vehicle-1"
                ),
                shipping_address=(
                    "Tripoli, Lebanon"
                ),
            ),
            KEY,
        )

    except (
        OrderVehicleNotFoundError
    ):
        pass

    else:
        raise AssertionError(
            "Expected "
            "OrderVehicleNotFoundError"
        )


def test_list_orders_is_user_scoped():
    service = make_service()

    service.create_order(
        "user-1",
        OrderCreate(
            items=[
                {
                    "product_id":
                        "product-1",
                    "quantity": 1,
                }
            ],
            shipping_address=(
                "Tripoli, Lebanon"
            ),
        ),
        KEY,
    )

    assert len(
        service.list_orders(
            "user-1"
        )
    ) == 1

    assert (
        service.list_orders(
            "other-user"
        )
        == []
    )
