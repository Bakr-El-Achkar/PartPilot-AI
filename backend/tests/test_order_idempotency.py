from threading import Barrier, Lock, Thread

import pytest
from pymongo.errors import DuplicateKeyError, OperationFailure

from app.repositories.order_repository import OrderRepository
from app.schemas.order import OrderCreate
import app.services.order_service as order_module
from app.services.order_service import OrderService


KEY = "a8e4bd48-21c6-4d07-a8f4-5dc0184f0c49"


class Session:
    def __init__(self):
        self.stock_changes = {}
        self.orders = []


class Products:
    def __init__(self):
        self.rows = {
            "pad": {"_id": "pad", "name": "Pads", "slug": "pads", "sku": "PAD",
                    "price": 20.0, "sale_price": None, "stock_quantity": 5,
                    "images": [], "is_active": True},
            "rotor": {"_id": "rotor", "name": "Rotor", "slug": "rotor", "sku": "ROT",
                      "price": 30.0, "sale_price": None, "stock_quantity": 5,
                      "images": [], "is_active": True},
        }
        self.decrements = 0

    def find_by_id(self, product_id):
        return self.rows.get(product_id)

    def decrement_stock(self, product_id, quantity, *, session):
        self.decrements += 1
        available = self.rows[product_id]["stock_quantity"]
        available += session.stock_changes.get(product_id, 0)
        if available < quantity:
            return False
        session.stock_changes[product_id] = (
            session.stock_changes.get(product_id, 0) - quantity
        )
        return True


class Orders:
    def __init__(self, products):
        self.products = products
        self.rows = []
        self.lock = Lock()
        self.fail_insert_once = False
        self.ambiguous_commit_once = False
        self.retry_callback_once = False
        self.commit_barrier = None
        self.index_ready = False
        self.insert_calls = 0

    def ensure_idempotency_index(self):
        self.index_ready = True

    def find_by_idempotency_key(self, user_id, key, *, session=None):
        with self.lock:
            return next(
                (row for row in self.rows
                 if row["user_id"] == user_id and row["idempotency_key"] == key),
                None,
            )

    def create(self, document, *, session):
        self.insert_calls += 1
        if self.fail_insert_once:
            self.fail_insert_once = False
            raise RuntimeError("insert failed before commit")
        created = {**document, "_id": "order-1"}
        session.orders.append(created)
        return created

    def run_transaction(self, callback):
        assert self.index_ready
        if self.retry_callback_once:
            self.retry_callback_once = False
            callback(Session())  # Aborted attempt is discarded.
        session = Session()
        result = callback(session)
        if self.commit_barrier:
            self.commit_barrier.wait(timeout=5)
        with self.lock:
            for row in session.orders:
                if any(
                    prior["user_id"] == row["user_id"]
                    and prior["idempotency_key"] == row["idempotency_key"]
                    for prior in self.rows
                ):
                    raise DuplicateKeyError("duplicate idempotency key")
            for product_id, amount in session.stock_changes.items():
                self.products.rows[product_id]["stock_quantity"] += amount
            self.rows.extend(session.orders)
        if self.ambiguous_commit_once:
            self.ambiguous_commit_once = False
            raise OperationFailure("commit acknowledgement lost")
        return result


class Vehicles:
    def find_by_id_for_user(self, vehicle_id, user_id):
        return {"_id": vehicle_id} if vehicle_id == "vehicle-1" else None


def make_service():
    products = Products()
    orders = Orders(products)
    return OrderService(orders, products, Vehicles()), orders, products


def request(product_id="pad", address="Tripoli, Lebanon", vehicle_id=None):
    return OrderCreate(
        items=[{"product_id": product_id, "quantity": 1}],
        shipping_address=address,
        vehicle_id=vehicle_id,
    )


def test_first_order_stores_key_and_server_priced_order():
    service, orders, products = make_service()
    result = service.create_order("user-1", request(), KEY)

    assert result["total"] == 25.0
    assert len(orders.rows) == 1
    assert orders.rows[0]["idempotency_key"] == KEY
    assert len(orders.rows[0]["request_fingerprint"]) == 64
    assert products.rows["pad"]["stock_quantity"] == 4


def test_same_key_and_request_returns_prior_order_without_new_writes():
    service, orders, products = make_service()
    first = service.create_order("user-1", request(), KEY)
    products.rows["pad"]["stock_quantity"] = 0  # Replay must skip stock preflight.
    before_decrements = products.decrements
    before_inserts = orders.insert_calls

    replay = service.create_order("user-1", request(), KEY)

    assert replay == first
    assert len(orders.rows) == 1
    assert products.rows["pad"]["stock_quantity"] == 0
    assert products.decrements == before_decrements
    assert orders.insert_calls == before_inserts


@pytest.mark.parametrize("changed", [
    request(product_id="rotor"),
    request(address="Beirut, Lebanon"),
    request(vehicle_id="vehicle-1"),
])
def test_same_key_with_materially_different_request_is_rejected(changed):
    service, orders, products = make_service()
    service.create_order("user-1", request(), KEY)

    with pytest.raises(order_module.OrderIdempotencyConflictError):
        service.create_order("user-1", changed, KEY)

    assert len(orders.rows) == 1
    assert products.rows["pad"]["stock_quantity"] == 4
    assert products.rows["rotor"]["stock_quantity"] == 5


def test_ambiguous_commit_can_be_retried_without_duplicate_writes():
    service, orders, products = make_service()
    orders.ambiguous_commit_once = True

    first = service.create_order("user-1", request(), KEY)
    replay = service.create_order("user-1", request(), KEY)

    assert replay == first
    assert len(orders.rows) == 1
    assert products.rows["pad"]["stock_quantity"] == 4


def test_transaction_callback_retry_still_creates_one_order():
    service, orders, products = make_service()
    orders.retry_callback_once = True

    service.create_order("user-1", request(), KEY)

    assert len(orders.rows) == 1
    assert orders.insert_calls == 2
    assert products.rows["pad"]["stock_quantity"] == 4


def test_failed_attempt_before_commit_can_reuse_key():
    service, orders, products = make_service()
    orders.fail_insert_once = True

    with pytest.raises(RuntimeError, match="before commit"):
        service.create_order("user-1", request(), KEY)
    result = service.create_order("user-1", request(), KEY)

    assert result["total"] == 25.0
    assert len(orders.rows) == 1
    assert products.rows["pad"]["stock_quantity"] == 4


def test_concurrent_same_key_submissions_commit_once():
    service, orders, products = make_service()
    orders.commit_barrier = Barrier(2)
    outcomes = []

    def submit():
        try:
            outcomes.append(service.create_order("user-1", request(), KEY))
        except Exception as exc:
            outcomes.append(exc)

    threads = [Thread(target=submit), Thread(target=submit)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join(timeout=7)

    assert all(not thread.is_alive() for thread in threads)
    assert len(outcomes) == 2
    assert all(isinstance(outcome, dict) for outcome in outcomes)
    assert outcomes[0] == outcomes[1]
    assert len(orders.rows) == 1
    assert products.rows["pad"]["stock_quantity"] == 4


def test_order_repository_creates_scoped_unique_partial_index_once():
    class Collection:
        def __init__(self):
            self.index_calls = []
            self.query = None

        def create_index(self, fields, **options):
            self.index_calls.append((fields, options))

        def find_one(self, query, *, session=None):
            self.query = query
            return None

    collection = Collection()
    repository = OrderRepository(collection)
    repository.ensure_idempotency_index()
    repository.ensure_idempotency_index()
    repository.find_by_idempotency_key("user-1", KEY)

    assert len(collection.index_calls) == 1
    fields, options = collection.index_calls[0]
    assert fields == [("user_id", 1), ("idempotency_key", 1)]
    assert options["unique"] is True
    assert options["partialFilterExpression"] == {
        "idempotency_key": {"$type": "string"},
    }
    assert collection.query == {"user_id": "user-1", "idempotency_key": KEY}
