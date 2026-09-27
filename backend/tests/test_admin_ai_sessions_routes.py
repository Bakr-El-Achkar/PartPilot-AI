from datetime import (
    datetime,
    timezone,
)

from fastapi.testclient import (
    TestClient,
)

from app.dependencies.auth import (
    get_current_user,
)

from app.main import (
    app,
)

import app.routes.admin as admin_routes


client = TestClient(
    app
)


NOW = datetime.now(
    timezone.utc
)


def sample_session(
    session_id=
        "session-1",
):
    return {
        "id":
            session_id,

        "user_id":
            "customer-1",

        "customer_name":
            "Test Customer",

        "customer_email":
            "customer@example.com",

        "vehicle_id":
            "vehicle-1",

        "vehicle_year":
            2026,

        "vehicle_make":
            "Volkswagen",

        "vehicle_model":
            "Tiguan",

        "vehicle_engine":
            "2.0L",

        "vehicle_transmission":
            "Automatic",

        "vehicle_nickname":
            "Daily",

        "status":
            "waiting_for_user",

        "messages":
            [],

        "latest_turn":
            None,

        "message_count":
            0,

        "safety_level":
            None,

        "created_at":
            NOW,

        "updated_at":
            NOW,
    }


class FakeAdminAISessionService:
    def list_sessions(
        self,
    ):
        return [
            sample_session()
        ]


    def get_session(
        self,
        session_id,
    ):
        if (
            session_id
            == "missing"
        ):
            return None


        return sample_session(
            session_id
        )


ORIGINAL_SERVICE = (
    admin_routes
    .admin_ai_session_service
)


def admin_user():
    return {
        "_id":
            "admin-1",

        "email":
            "admin@example.com",

        "role":
            "admin",

        "is_active":
            True,
    }


def customer_user():
    return {
        "_id":
            "customer-1",

        "email":
            "customer@example.com",

        "role":
            "customer",

        "is_active":
            True,
    }


def setup_function():
    admin_routes.admin_ai_session_service = (
        FakeAdminAISessionService()
    )


def teardown_function():
    app.dependency_overrides.pop(
        get_current_user,
        None,
    )


    admin_routes.admin_ai_session_service = (
        ORIGINAL_SERVICE
    )


def test_admin_lists_ai_sessions():
    app.dependency_overrides[
        get_current_user
    ] = admin_user


    response = client.get(
        "/api/admin/ai-sessions"
    )


    assert (
        response.status_code
        == 200
    )


    assert (
        len(
            response.json()
        )
        == 1
    )


def test_admin_gets_ai_session():
    app.dependency_overrides[
        get_current_user
    ] = admin_user


    response = client.get(
        "/api/admin/ai-sessions/session-1"
    )


    assert (
        response.status_code
        == 200
    )


    assert (
        response.json()[
            "vehicle_make"
        ]
        == "Volkswagen"
    )


def test_missing_ai_session_returns_404():
    app.dependency_overrides[
        get_current_user
    ] = admin_user


    response = client.get(
        "/api/admin/ai-sessions/missing"
    )


    assert (
        response.status_code
        == 404
    )


def test_customer_cannot_access_admin_ai_sessions():
    app.dependency_overrides[
        get_current_user
    ] = customer_user


    response = client.get(
        "/api/admin/ai-sessions"
    )


    assert (
        response.status_code
        == 403
    )
