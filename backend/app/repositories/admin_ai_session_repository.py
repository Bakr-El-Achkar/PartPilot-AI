from bson import (
    ObjectId,
)

from bson.errors import (
    InvalidId,
)

from app.core.database import (
    database,
)


class AdminAISessionRepository:
    def __init__(
        self,
        *,
        sessions,
        users,
        vehicles,
    ):
        self.sessions = sessions
        self.users = users
        self.vehicles = vehicles


    def list_sessions(
        self,
    ) -> list[dict]:
        return list(
            self.sessions
            .find(
                {}
            )
            .sort(
                "updated_at",
                -1,
            )
        )


    def find_session_by_id(
        self,
        session_id: str,
    ):
        return (
            self.sessions
            .find_one(
                {
                    "_id":
                        self._parse_id(
                            session_id
                        ),
                }
            )
        )


    def find_user_by_id(
        self,
        user_id: str,
    ):
        parsed = (
            self._parse_id(
                user_id
            )
        )


        user = (
            self.users
            .find_one(
                {
                    "_id":
                        parsed,
                }
            )
        )


        if (
            user is None
            and parsed != user_id
        ):
            user = (
                self.users
                .find_one(
                    {
                        "_id":
                            user_id,
                    }
                )
            )


        return user


    def find_vehicle_by_id(
        self,
        vehicle_id: str,
    ):
        parsed = (
            self._parse_id(
                vehicle_id
            )
        )


        vehicle = (
            self.vehicles
            .find_one(
                {
                    "_id":
                        parsed,
                }
            )
        )


        if (
            vehicle is None
            and parsed != vehicle_id
        ):
            vehicle = (
                self.vehicles
                .find_one(
                    {
                        "_id":
                            vehicle_id,
                    }
                )
            )


        return vehicle


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


admin_ai_session_repository = (
    AdminAISessionRepository(
        sessions=
            database[
                "ai_mechanic_sessions"
            ],

        users=
            database[
                "users"
            ],

        vehicles=
            database[
                "vehicles"
            ],
    )
)
