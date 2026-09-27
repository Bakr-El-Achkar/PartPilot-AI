from bson import ObjectId
from bson.errors import InvalidId
from pymongo.collection import Collection

from app.core.database import database


class AddressRepository:
    def __init__(
        self,
        collection: Collection,
    ):
        self.collection = collection

    def create(
        self,
        document: dict,
    ) -> dict:
        stored = document.copy()

        result = self.collection.insert_one(
            stored
        )

        stored["_id"] = (
            result.inserted_id
        )

        return stored

    def find_by_user_id(
        self,
        user_id: str,
    ) -> list[dict]:
        cursor = self.collection.find(
            {
                "user_id": user_id,
            }
        )

        try:
            cursor = cursor.sort(
                [
                    (
                        "is_default",
                        -1,
                    ),
                    (
                        "created_at",
                        -1,
                    ),
                ]
            )
        except TypeError:
            pass

        return list(
            cursor
        )

    def count_by_user(
        self,
        user_id: str,
    ) -> int:
        return int(
            self.collection.count_documents(
                {
                    "user_id": user_id,
                }
            )
        )

    def find_by_id_for_user(
        self,
        address_id: str,
        user_id: str,
    ):
        return self.collection.find_one(
            {
                "_id":
                    self._parse_id(
                        address_id
                    ),

                "user_id":
                    user_id,
            }
        )

    def update(
        self,
        address_id: str,
        user_id: str,
        fields: dict,
    ):
        query_id = self._parse_id(
            address_id
        )

        result = self.collection.update_one(
            {
                "_id":
                    query_id,

                "user_id":
                    user_id,
            },
            {
                "$set":
                    fields,
            },
        )

        if (
            result.matched_count
            == 0
        ):
            return None

        return self.collection.find_one(
            {
                "_id":
                    query_id,

                "user_id":
                    user_id,
            }
        )

    def delete(
        self,
        address_id: str,
        user_id: str,
    ) -> bool:
        result = self.collection.delete_one(
            {
                "_id":
                    self._parse_id(
                        address_id
                    ),

                "user_id":
                    user_id,
            }
        )

        return (
            result.deleted_count
            == 1
        )

    def clear_default(
        self,
        user_id: str,
    ) -> None:
        self.collection.update_many(
            {
                "user_id":
                    user_id,

                "is_default":
                    True,
            },
            {
                "$set": {
                    "is_default":
                        False,
                }
            },
        )

    def set_default(
        self,
        address_id: str,
        user_id: str,
    ):
        existing = (
            self.find_by_id_for_user(
                address_id,
                user_id,
            )
        )

        if existing is None:
            return None

        self.clear_default(
            user_id
        )

        return self.update(
            address_id,
            user_id,
            {
                "is_default":
                    True,
            },
        )

    @staticmethod
    def _parse_id(
        address_id: str,
    ):
        try:
            return ObjectId(
                address_id
            )

        except (
            InvalidId,
            TypeError,
        ):
            return address_id


address_repository = (
    AddressRepository(
        database[
            "addresses"
        ]
    )
)
