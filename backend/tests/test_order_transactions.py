from types import SimpleNamespace

import pytest

from app.repositories.order_repository import OrderRepository
from app.repositories.product_repository import ProductRepository
from app.schemas.order import OrderCreate
from app.services.order_service import OrderService, OrderStockError


KEY = "a8e4bd48-21c6-4d07-a8f4-5dc0184f0c49"


class TransactionState:
    def __init__(self):
        self.stock_changes = {}
        self.orders = []


class ProductStore:
    def __init__(self):
        self.products = {
            "product-1": {
                "_id": "product-1", "name": "Brake Pads", "slug": "brake-pads",
                "sku": "PAD-001", "price": 59.99, "sale_price": 49.99,
                "stock_quantity": 5, "images": [], "is_active": True,
            },
            "product-2": {
                "_id": "product-2", "name": "Brake Rotor", "slug": "brake-rotor",
                "sku": "ROT-001", "price": 79.00, "sale_price": None,
                "stock_quantity": 2, "images": [], "is_active": True,
            },
        }
        self.fail_product_id = None

    def find_by_id(self, product_id):
        return self.products.get(product_id)

    def decrement_stock(self, product_id, quantity, *, session=None):
        if product_id == self.fail_product_id:
            return False
        product = self.products[product_id]
        staged = session.stock_changes.get(product_id, 0) if session else 0
        if product["stock_quantity"] + staged < quantity:
            return False
        if session is None:
            product["stock_quantity"] -= quantity
        else:
            session.stock_changes[product_id] = staged - quantity
        return True

    def increment_stock(self, product_id, quantity):
        self.products[product_id]["stock_quantity"] += quantity
        return True


class OrderStore:
    def __init__(self, products):
        self.products = products
        self.orders = []
        self.fail_before_insert = False
        self.ambiguous_insert = False
        self.ambiguous_commit = False
        self.retry_callback_once = False
        self.callback_documents = []

    def ensure_idempotency_index(self):
        pass

    def find_by_idempotency_key(self, user_id, key, *, session=None):
        return next(
            (order for order in self.orders
             if order["user_id"] == user_id
             and order["idempotency_key"] == key),
            None,
        )

    def create(self, document, *, session=None):
        if self.fail_before_insert:
            raise RuntimeError("insert rejected")
        created = {**document, "_id": "order-1"}
        self.callback_documents.append(created["order_number"])
        if session is None:
            self.orders.append(created)
            if self.ambiguous_commit:
                raise RuntimeError("insert acknowledgement lost")
        else:
            session.orders.append(created)
            if self.ambiguous_insert:
                raise RuntimeError("insert acknowledgement lost")
        return created

    def run_transaction(self, callback):
        if self.retry_callback_once:
            callback(TransactionState())  # A transient error discards this attempt.
        transaction = TransactionState()
        result = callback(transaction)
        for product_id, change in transaction.stock_changes.items():
            self.products.products[product_id]["stock_quantity"] += change
        self.orders.extend(transaction.orders)
        if self.ambiguous_commit:
            raise RuntimeError("commit acknowledgement lost")
        return result


class VehicleStore:
    def find_by_id_for_user(self, vehicle_id, user_id):
        return None


def make_service():
    products = ProductStore()
    orders = OrderStore(products)
    return OrderService(orders, products, VehicleStore()), orders, products


def payload(*product_ids):
    return OrderCreate(
        items=[{"product_id": product_id, "quantity": 1} for product_id in product_ids],
        shipping_address="Tripoli, Lebanon",
    )


def test_success_commits_order_and_stock_together():
    service, orders, products = make_service()

    result = service.create_order("user-1", payload("product-1"), KEY)

    assert result["total"] == 54.99
    assert len(orders.orders) == 1
    assert products.products["product-1"]["stock_quantity"] == 4


def test_insert_failure_discards_reserved_stock():
    service, orders, products = make_service()
    orders.fail_before_insert = True

    with pytest.raises(RuntimeError, match="insert rejected"):
        service.create_order("user-1", payload("product-1"), KEY)

    assert orders.orders == []
    assert products.products["product-1"]["stock_quantity"] == 5


def test_late_reservation_failure_discards_earlier_reservation():
    service, orders, products = make_service()
    products.fail_product_id = "product-2"

    with pytest.raises(OrderStockError):
        service.create_order("user-1", payload("product-1", "product-2"), KEY)

    assert orders.orders == []
    assert products.products["product-1"]["stock_quantity"] == 5
    assert products.products["product-2"]["stock_quantity"] == 2


def test_ambiguous_insert_aborts_order_and_reservation_together():
    service, orders, products = make_service()
    orders.ambiguous_insert = True

    with pytest.raises(RuntimeError, match="insert acknowledgement lost"):
        service.create_order("user-1", payload("product-1"), KEY)

    assert orders.orders == []
    assert products.products["product-1"]["stock_quantity"] == 5


def test_ambiguous_commit_keeps_persisted_order_and_stock_decrement_together():
    service, orders, products = make_service()
    orders.ambiguous_commit = True

    with pytest.raises(RuntimeError, match="acknowledgement lost"):
        service.create_order("user-1", payload("product-1"), KEY)

    assert len(orders.orders) == 1
    assert products.products["product-1"]["stock_quantity"] == 4


def test_transaction_callback_retry_commits_once():
    service, orders, products = make_service()
    orders.retry_callback_once = True

    service.create_order("user-1", payload("product-1"), KEY)

    assert len(orders.callback_documents) == 2
    assert orders.callback_documents[0] == orders.callback_documents[1]
    assert len(orders.orders) == 1
    assert products.products["product-1"]["stock_quantity"] == 4


class CollectionSpy:
    def __init__(self):
        self.last_session = None
        self.database = SimpleNamespace(client=None)

    def insert_one(self, document, *, session=None):
        self.last_session = session
        return SimpleNamespace(inserted_id="order-1")

    def update_one(self, query, update, *, session=None):
        self.last_session = session
        assert query["stock_quantity"] == {"$gte": 1}
        assert update["$inc"] == {"stock_quantity": -1}
        return SimpleNamespace(modified_count=1)


def test_repositories_pass_the_same_session_to_mongo_writes():
    order_collection = CollectionSpy()
    product_collection = CollectionSpy()
    session = object()

    OrderRepository(order_collection).create({"order_number": "VHX-1"}, session=session)
    ProductRepository(product_collection).decrement_stock("product-1", 1, session=session)

    assert order_collection.last_session is session
    assert product_collection.last_session is session


def test_order_repository_uses_client_transaction_callback():
    collection = CollectionSpy()

    class Session:
        def __enter__(self):
            return self

        def __exit__(self, *args):
            return False

        def with_transaction(self, callback, **kwargs):
            return callback(self)

    session = Session()
    collection.database.client = SimpleNamespace(start_session=lambda: session)

    result = OrderRepository(collection).run_transaction(lambda active: active)

    assert result is session
