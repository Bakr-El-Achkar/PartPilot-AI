from datetime import datetime

from bson import ObjectId
from bson.errors import InvalidId

from app.core.database import database


class AIMechanicSessionRepository:
    def __init__(
        self,
        collection,
    ):
        self.collection = collection

    # ========================================================
    # HELPERS
    # ========================================================

    @staticmethod
    def _to_object_id(
        value: str,
    ) -> ObjectId | None:
        try:
            return ObjectId(
                value
            )
        except (
            InvalidId,
            TypeError,
        ):
            return None

    # ========================================================
    # CREATE
    # ========================================================

    def create(
        self,
        document: dict,
    ) -> dict:
        document_to_insert = dict(
            document
        )

        result = (
            self.collection.insert_one(
                document_to_insert
            )
        )

        return {
            "_id": result.inserted_id,
            **document_to_insert,
        }

    # ========================================================
    # FIND OWNED SESSION
    # ========================================================

    def find_owned_by_id(
        self,
        session_id: str,
        user_id,
    ) -> dict | None:
        object_id = (
            self._to_object_id(
                session_id
            )
        )

        if object_id is None:
            return None

        return (
            self.collection.find_one(
                {
                    "_id": object_id,
                    "user_id": user_id,
                }
            )
        )

    # ========================================================
    # LIST USER SESSIONS
    # ========================================================

    def list_by_user(
        self,
        user_id,
    ) -> list[dict]:
        cursor = (
            self.collection.find(
                {
                    "user_id": user_id,
                }
            )
        )

        if hasattr(
            cursor,
            "sort",
        ):
            cursor = cursor.sort(
                "updated_at",
                -1,
            )

        return list(
            cursor
        )

    # ========================================================
    # UPDATE TURN
    # ========================================================

    def update_turn(
        self,
        *,
        session_id: str,
        user_id,
        messages: list[dict],
        latest_turn: dict,
        status: str,
        updated_at: datetime,
    ) -> bool:
        object_id = (
            self._to_object_id(
                session_id
            )
        )

        if object_id is None:
            return False

        result = (
            self.collection.update_one(
                {
                    "_id": object_id,
                    "user_id": user_id,
                },
                {
                    "$set": {
                        "messages": messages,
                        "latest_turn": latest_turn,
                        "status": status,
                        "updated_at": updated_at,
                    }
                },
            )
        )

        return (
            result.matched_count
            > 0
        )

    # ========================================================
    # CLOSE SESSION
    # ========================================================

    def close(
        self,
        *,
        session_id: str,
        user_id,
        updated_at: datetime,
    ) -> bool:
        object_id = (
            self._to_object_id(
                session_id
            )
        )

        if object_id is None:
            return False

        result = (
            self.collection.update_one(
                {
                    "_id": object_id,
                    "user_id": user_id,
                },
                {
                    "$set": {
                        "status": "closed",
                        "updated_at": updated_at,
                    }
                },
            )
        )

        return (
            result.matched_count
            > 0
        )


ai_mechanic_session_repository = (
    AIMechanicSessionRepository(
        database[
            "ai_mechanic_sessions"
        ]
    )
)