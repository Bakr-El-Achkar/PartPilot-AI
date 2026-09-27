from types import SimpleNamespace

from app.repositories.admin_repository import AdminDashboardRepository


class OrderCollection:
    def __init__(self):
        self.order = {"_id": "order-1", "status": "cancelled"}

    def update_one(self, query, update):
        matched = all(self.order.get(key) == value for key, value in query.items())
        if matched:
            self.order.update(update["$set"])
        return SimpleNamespace(matched_count=int(matched))

    def find_one(self, query):
        return self.order if self.order["_id"] == query["_id"] else None


def test_status_update_refuses_stale_transition():
    collection = OrderCollection()
    repository = object.__new__(AdminDashboardRepository)
    repository.orders = collection

    result = repository.update_order_status(
        "order-1", "cancelled", expected_status="processing"
    )

    assert result is None
    assert collection.order["status"] == "cancelled"
