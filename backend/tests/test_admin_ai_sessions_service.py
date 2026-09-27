from datetime import (
    datetime,
    timezone,
)

from app.services.admin_service import (
    AdminAISessionService,
)


NOW = datetime.now(
    timezone.utc
)


class FakeRepository:
    def __init__(
        self,
    ):
        self.sessions = {
            "session-1": {
                "_id":
                    "session-1",

                "user_id":
                    "customer-1",

                "vehicle_id":
                    "vehicle-1",

                "status":
                    "analysis_ready",

                "messages": [
                    {
                        "role":
                            "user",

                        "content":
                            "Steering wheel shakes while braking.",

                        "created_at":
                            NOW,
                    },

                    {
                        "role":
                            "assistant",

                        "content":
                            "The front brake system should be inspected.",

                        "created_at":
                            NOW,
                    },
                ],

                "latest_turn": {
                    "response_type":
                        "analysis",

                    "assistant_message":
                        "The front brake system should be inspected.",

                    "follow_up_question":
                        None,

                    "possible_causes": [
                        {
                            "cause":
                                "Brake rotor variation",

                            "explanation":
                                "Rotor variation can cause vibration during braking.",

                            "relevance":
                                "high",
                        }
                    ],

                    "components": [
                        {
                            "component_key":
                                "brake_rotor",

                            "label":
                                "Brake Rotor",

                            "catalog_key":
                                "brake-rotors",

                            "hotspot_key":
                                "front_wheel",

                            "relevance":
                                "high",

                            "explanation":
                                "Inspect the front rotors.",
                        }
                    ],

                    "safety": {
                        "level":
                            "caution",

                        "message":
                            "Have the braking system inspected.",
                    },
                },

                "created_at":
                    NOW,

                "updated_at":
                    NOW,
            }
        }


    def list_sessions(
        self,
    ):
        return list(
            self.sessions
            .values()
        )


    def find_session_by_id(
        self,
        session_id,
    ):
        return (
            self.sessions.get(
                session_id
            )
        )


    def find_user_by_id(
        self,
        user_id,
    ):
        if (
            user_id
            == "missing-user"
        ):
            return None


        return {
            "_id":
                user_id,

            "first_name":
                "Test",

            "last_name":
                "Customer",

            "email":
                "customer@example.com",
        }


    def find_vehicle_by_id(
        self,
        vehicle_id,
    ):
        if (
            vehicle_id
            == "missing-vehicle"
        ):
            return None


        return {
            "_id":
                vehicle_id,

            "year":
                2026,

            "make":
                "Volkswagen",

            "model":
                "Tiguan",

            "engine":
                "2.0L",

            "transmission":
                "Automatic",

            "nickname":
                "Daily",
        }


def make_service():
    return (
        AdminAISessionService(
            repository=
                FakeRepository(),
        )
    )


def test_admin_lists_ai_sessions_with_context():
    service = (
        make_service()
    )


    result = (
        service.list_sessions()
    )


    assert (
        len(
            result
        )
        == 1
    )


    session = (
        result[
            0
        ]
    )


    assert (
        session[
            "customer_name"
        ]
        == "Test Customer"
    )


    assert (
        session[
            "customer_email"
        ]
        == "customer@example.com"
    )


    assert (
        session[
            "vehicle_make"
        ]
        == "Volkswagen"
    )


    assert (
        session[
            "vehicle_model"
        ]
        == "Tiguan"
    )


    assert (
        session[
            "message_count"
        ]
        == 2
    )


    assert (
        session[
            "safety_level"
        ]
        == "caution"
    )


def test_admin_gets_ai_session():
    service = (
        make_service()
    )


    result = (
        service.get_session(
            "session-1"
        )
    )


    assert (
        result is not None
    )


    assert (
        result[
            "status"
        ]
        == "analysis_ready"
    )


def test_missing_ai_session_returns_none():
    service = (
        make_service()
    )


    assert (
        service.get_session(
            "missing"
        )
        is None
    )


def test_deleted_customer_and_vehicle_have_safe_fallbacks():
    repository = (
        FakeRepository()
    )


    repository.sessions[
        "session-1"
    ][
        "user_id"
    ] = "missing-user"


    repository.sessions[
        "session-1"
    ][
        "vehicle_id"
    ] = "missing-vehicle"


    service = (
        AdminAISessionService(
            repository=
                repository,
        )
    )


    result = (
        service.get_session(
            "session-1"
        )
    )


    assert (
        result[
            "customer_name"
        ]
        == "Unknown customer"
    )


    assert (
        result[
            "vehicle_make"
        ]
        == "Unknown"
    )


    assert (
        result[
            "vehicle_model"
        ]
        == "vehicle"
    )
