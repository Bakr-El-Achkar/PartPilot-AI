from datetime import datetime

from bson import (
    ObjectId,
)

from bson.errors import (
    InvalidId,
)

from app.core.database import (
    database,
)


class NotificationRepository:
    def __init__(
        self,
        collection,
    ):
        self.collection = (
            collection
        )


    def create(
        self,
        document: dict,
    ) -> dict:
        document_to_insert = dict(
            document
        )


        result = (
            self.collection
            .insert_one(
                document_to_insert
            )
        )


        return {
            "_id":
                result.inserted_id,

            **document_to_insert,
        }


    def list_by_user(
        self,
        user_id: str,
    ) -> list[dict]:
        return list(
            self.collection
            .find(
                {
                    "user_id":
                        str(
                            user_id
                        ),
                }
            )
            .sort(
                "created_at",
                -1,
            )
        )


    def list_all(
        self,
    ) -> list[dict]:
        return list(
            self.collection
            .find(
                {}
            )
            .sort(
                "created_at",
                -1,
            )
        )


    def find_by_id(
        self,
        notification_id: str,
    ):
        return (
            self.collection
            .find_one(
                {
                    "_id":
                        self._parse_id(
                            notification_id
                        ),
                }
            )
        )


    def mark_read(
        self,
        *,
        notification_id: str,
        user_id: str,
        read_at: datetime,
    ):
        query_id = (
            self._parse_id(
                notification_id
            )
        )


        result = (
            self.collection
            .update_one(
                {
                    "_id":
                        query_id,

                    "user_id":
                        str(
                            user_id
                        ),
                },
                {
                    "$set": {
                        "is_read":
                            True,

                        "read_at":
                            read_at,
                    }
                },
            )
        )


        if (
            result.matched_count
            == 0
        ):
            return None


        return (
            self.collection
            .find_one(
                {
                    "_id":
                        query_id,

                    "user_id":
                        str(
                            user_id
                        ),
                }
            )
        )


    def mark_all_read(
        self,
        *,
        user_id: str,
        read_at: datetime,
    ) -> int:
        result = (
            self.collection
            .update_many(
                {
                    "user_id":
                        str(
                            user_id
                        ),

                    "is_read":
                        False,
                },
                {
                    "$set": {
                        "is_read":
                            True,

                        "read_at":
                            read_at,
                    }
                },
            )
        )


        return int(
            result.modified_count
        )


    @staticmethod
    def _parse_id(
        value: str | ObjectId,
    ) -> ObjectId | str:
        if isinstance(
            value,
            ObjectId,
        ):
            return value


        try:
            return ObjectId(
                value
            )

        except (
            InvalidId,
            TypeError,
        ):
            return value


notification_repository = (
    NotificationRepository(
        database[
            "notifications"
        ]
    )
)
