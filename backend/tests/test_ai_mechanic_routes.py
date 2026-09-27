from datetime import (
    datetime,
    timezone,
)

from bson import ObjectId
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.dependencies.auth import (
    get_current_user,
)
from app.routes import (
    ai_mechanic as route_module,
)
from app.schemas.ai_mechanic import (
    AIComponentSuggestion,
    AIMechanicSessionPublic,
    AIMechanicTurn,
    AIPossibleCause,
    AISafety,
)
from app.services.ai_mechanic_service import (
    AIMechanicSessionClosedError,
    AIMechanicSessionNotFoundError,
    AIMechanicVehicleNotFoundError,
)
from app.services.ollama_ai_mechanic_engine import (
    AIMechanicEngineError,
)


# ============================================================
# TEST APP
# ============================================================

app = FastAPI()

app.include_router(
    route_module.router
)

client = TestClient(
    app
)


# ============================================================
# CURRENT USER
# ============================================================

USER_ID = ObjectId()


def current_user():
    return {
        "_id": USER_ID,
        "email": "driver@example.com",
        "role": "customer",
        "is_active": True,
    }


# ============================================================
# SAMPLE SESSION
# ============================================================

def sample_session():
    now = datetime.now(
        timezone.utc
    )

    return AIMechanicSessionPublic(
        id=str(
            ObjectId()
        ),
        vehicle_id=str(
            ObjectId()
        ),
        status="analysis_ready",
        messages=[],
        latest_turn=AIMechanicTurn(
            response_type="analysis",
            assistant_message=(
                "The symptoms may be "
                "consistent with a front "
                "braking issue."
            ),
            follow_up_question=None,
            possible_causes=[
                AIPossibleCause(
                    cause=(
                        "Brake rotor variation"
                    ),
                    explanation=(
                        "Rotor variation may "
                        "contribute to vibration "
                        "while braking."
                    ),
                    relevance="high",
                )
            ],
            components=[
                AIComponentSuggestion(
                    component_key=(
                        "brake_rotor"
                    ),
                    label=(
                        "Front Brake Rotors"
                    ),
                    catalog_key=(
                        "brake-rotors"
                    ),
                    hotspot_key=(
                        "front_brakes"
                    ),
                    relevance="high",
                    explanation=(
                        "The front brake area "
                        "is a likely place "
                        "to inspect first."
                    ),
                )
            ],
            safety=AISafety(
                level="normal",
                message=(
                    "Guidance only — not a "
                    "definitive diagnosis."
                ),
            ),
        ),
        created_at=now,
        updated_at=now,
    )


# ============================================================
# FAKE SERVICE
# ============================================================

class FakeAIMechanicService:
    def __init__(
        self,
        *,
        start_result=None,
        continue_result=None,
        get_result=None,
        start_error=None,
        continue_error=None,
        get_error=None,
    ):
        self.start_result = (
            start_result
        )

        self.continue_result = (
            continue_result
        )

        self.get_result = (
            get_result
        )

        self.start_error = (
            start_error
        )

        self.continue_error = (
            continue_error
        )

        self.get_error = (
            get_error
        )

        self.calls = []

    def start_session(
        self,
        current_user,
        payload,
    ):
        self.calls.append(
            (
                "start",
                current_user,
                payload,
            )
        )

        if (
            self.start_error
            is not None
        ):
            raise self.start_error

        return self.start_result

    def continue_session(
        self,
        current_user,
        session_id,
        payload,
    ):
        self.calls.append(
            (
                "continue",
                current_user,
                session_id,
                payload,
            )
        )

        if (
            self.continue_error
            is not None
        ):
            raise self.continue_error

        return self.continue_result

    def get_session(
        self,
        current_user,
        session_id,
    ):
        self.calls.append(
            (
                "get",
                current_user,
                session_id,
            )
        )

        if (
            self.get_error
            is not None
        ):
            raise self.get_error

        return self.get_result


# ============================================================
# HELPERS
# ============================================================

def authenticate():
    app.dependency_overrides[
        get_current_user
    ] = current_user


def clear_auth():
    app.dependency_overrides.clear()


# ============================================================
# START SESSION
# ============================================================

def test_authenticated_user_can_start_session(
    monkeypatch,
):
    authenticate()

    session = sample_session()

    fake_service = (
        FakeAIMechanicService(
            start_result=session
        )
    )

    monkeypatch.setattr(
        route_module,
        "ai_mechanic_service",
        fake_service,
    )

    response = client.post(
        "/api/ai-mechanic/sessions",
        json={
            "vehicle_id": (
                session.vehicle_id
            ),
            "message": (
                "My steering wheel shakes "
                "when I brake."
            ),
        },
    )

    clear_auth()

    assert (
        response.status_code
        == 201
    )

    body = response.json()

    assert (
        body["id"]
        == session.id
    )

    assert (
        body["status"]
        == "analysis_ready"
    )

    assert (
        body["latest_turn"]
        ["components"][0]
        ["hotspot_key"]
        == "front_brakes"
    )

    assert (
        fake_service.calls[0][0]
        == "start"
    )


def test_start_session_missing_vehicle_returns_404(
    monkeypatch,
):
    authenticate()

    fake_service = (
        FakeAIMechanicService(
            start_error=(
                AIMechanicVehicleNotFoundError(
                    "Vehicle not found."
                )
            )
        )
    )

    monkeypatch.setattr(
        route_module,
        "ai_mechanic_service",
        fake_service,
    )

    response = client.post(
        "/api/ai-mechanic/sessions",
        json={
            "vehicle_id": str(
                ObjectId()
            ),
            "message": (
                "The vehicle vibrates."
            ),
        },
    )

    clear_auth()

    assert (
        response.status_code
        == 404
    )

    assert (
        response.json()["detail"]
        == "Vehicle not found."
    )


# ============================================================
# CONTINUE SESSION
# ============================================================

def test_authenticated_user_can_continue_session(
    monkeypatch,
):
    authenticate()

    session = sample_session()

    fake_service = (
        FakeAIMechanicService(
            continue_result=session
        )
    )

    monkeypatch.setattr(
        route_module,
        "ai_mechanic_service",
        fake_service,
    )

    response = client.post(
        (
            "/api/ai-mechanic/sessions/"
            f"{session.id}/messages"
        ),
        json={
            "message": (
                "Mostly through the "
                "steering wheel."
            )
        },
    )

    clear_auth()

    assert (
        response.status_code
        == 200
    )

    assert (
        response.json()["id"]
        == session.id
    )

    assert (
        fake_service.calls[0][0]
        == "continue"
    )

    assert (
        fake_service.calls[0][2]
        == session.id
    )


def test_continue_missing_session_returns_404(
    monkeypatch,
):
    authenticate()

    fake_service = (
        FakeAIMechanicService(
            continue_error=(
                AIMechanicSessionNotFoundError(
                    "AI Mechanic session "
                    "not found."
                )
            )
        )
    )

    monkeypatch.setattr(
        route_module,
        "ai_mechanic_service",
        fake_service,
    )

    response = client.post(
        (
            "/api/ai-mechanic/sessions/"
            f"{ObjectId()}/messages"
        ),
        json={
            "message": (
                "Mostly through the "
                "steering wheel."
            )
        },
    )

    clear_auth()

    assert (
        response.status_code
        == 404
    )


def test_continue_closed_session_returns_409(
    monkeypatch,
):
    authenticate()

    fake_service = (
        FakeAIMechanicService(
            continue_error=(
                AIMechanicSessionClosedError(
                    "AI Mechanic session "
                    "is closed."
                )
            )
        )
    )

    monkeypatch.setattr(
        route_module,
        "ai_mechanic_service",
        fake_service,
    )

    response = client.post(
        (
            "/api/ai-mechanic/sessions/"
            f"{ObjectId()}/messages"
        ),
        json={
            "message": (
                "Another symptom."
            )
        },
    )

    clear_auth()

    assert (
        response.status_code
        == 409
    )


# ============================================================
# GET SESSION
# ============================================================

def test_authenticated_user_can_get_session(
    monkeypatch,
):
    authenticate()

    session = sample_session()

    fake_service = (
        FakeAIMechanicService(
            get_result=session
        )
    )

    monkeypatch.setattr(
        route_module,
        "ai_mechanic_service",
        fake_service,
    )

    response = client.get(
        (
            "/api/ai-mechanic/sessions/"
            f"{session.id}"
        )
    )

    clear_auth()

    assert (
        response.status_code
        == 200
    )

    assert (
        response.json()["id"]
        == session.id
    )

    assert (
        response.json()
        ["latest_turn"]
        ["components"][0]
        ["hotspot_key"]
        == "front_brakes"
    )


def test_get_missing_session_returns_404(
    monkeypatch,
):
    authenticate()

    fake_service = (
        FakeAIMechanicService(
            get_error=(
                AIMechanicSessionNotFoundError(
                    "AI Mechanic session "
                    "not found."
                )
            )
        )
    )

    monkeypatch.setattr(
        route_module,
        "ai_mechanic_service",
        fake_service,
    )

    response = client.get(
        (
            "/api/ai-mechanic/sessions/"
            f"{ObjectId()}"
        )
    )

    clear_auth()

    assert (
        response.status_code
        == 404
    )


# ============================================================
# AI PROVIDER FAILURE
# ============================================================

def test_ai_engine_failure_returns_503(
    monkeypatch,
):
    authenticate()

    fake_service = (
        FakeAIMechanicService(
            start_error=(
                AIMechanicEngineError(
                    "AI engine unavailable."
                )
            )
        )
    )

    monkeypatch.setattr(
        route_module,
        "ai_mechanic_service",
        fake_service,
    )

    response = client.post(
        "/api/ai-mechanic/sessions",
        json={
            "vehicle_id": str(
                ObjectId()
            ),
            "message": (
                "My engine is making "
                "a strange noise."
            ),
        },
    )

    clear_auth()

    assert (
        response.status_code
        == 503
    )

    assert (
        response.json()["detail"]
        == (
            "AI Mechanic is temporarily "
            "unavailable."
        )
    )


# ============================================================
# AUTHENTICATION
# ============================================================

def test_ai_mechanic_requires_authentication():
    clear_auth()

    response = client.post(
        "/api/ai-mechanic/sessions",
        json={
            "vehicle_id": str(
                ObjectId()
            ),
            "message": (
                "The vehicle vibrates."
            ),
        },
    )

    assert response.status_code in {
        401,
        403,
    }