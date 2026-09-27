from bson import ObjectId
from bson.errors import InvalidId
from threading import Lock
from pymongo import ASCENDING
from pymongo.collection import Collection
from pymongo.write_concern import WriteConcern

from app.core.database import database


class OrderRepository:
    def __init__(
        self,
        collection: Collection,
    ):
        self.collection = collection
        self._idempotency_index_ready = False
        self._index_lock = Lock()

    def ensure_idempotency_index(self):
        if self._idempotency_index_ready:
            return
        with self._index_lock:
            if self._idempotency_index_ready:
                return
            self.collection.create_index(
                [("user_id", ASCENDING), ("idempotency_key", ASCENDING)],
                name="uniq_order_user_idempotency_key",
                unique=True,
                partialFilterExpression={
                    "idempotency_key": {"$type": "string"},
                },
            )
            self._idempotency_index_ready = True

    def run_transaction(self, callback):
        with self.collection.database.client.start_session() as session:
            return session.with_transaction(
                callback,
                write_concern=WriteConcern("majority"),
            )

    def create(
        self,
        order_data: dict,
        *,
        session=None,
    ) -> dict:
        document = (
            order_data.copy()
        )

        result = (
            self.collection.insert_one(
                document,
                session=session,
            )
        )

        document["_id"] = (
            result.inserted_id
        )

        return document

    def find_by_idempotency_key(
        self,
        user_id: str,
        key: str,
        *,
        session=None,
    ):
        return self.collection.find_one(
            {"user_id": user_id, "idempotency_key": key},
            session=session,
        )

    def find_by_user_id(
        self,
        user_id: str,
    ) -> list[dict]:
        cursor = (
            self.collection.find(
                {
                    "user_id": user_id,
                }
            )
        )

        cursor = cursor.sort(
            "created_at",
            -1,
        )

        return list(
            cursor
        )

    def find_by_id_for_user(
        self,
        order_id: str,
        user_id: str,
    ):
        query_id = (
            self._parse_order_id(
                order_id
            )
        )

        return (
            self.collection.find_one(
                {
                    "_id": query_id,
                    "user_id": user_id,
                }
            )
        )

    @staticmethod
    def _parse_order_id(
        order_id: str,
    ):
        try:
            return ObjectId(
                order_id
            )

        except (
            InvalidId,
            TypeError,
        ):
            return order_id


order_repository = (
    OrderRepository(
        database["orders"]
    )
)
