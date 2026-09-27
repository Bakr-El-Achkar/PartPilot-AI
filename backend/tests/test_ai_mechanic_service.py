from bson import ObjectId
import pytest

from datetime import (
    datetime,
    timezone,
)

from app.schemas.ai_mechanic import (
    AIMechanicContinueRequest,
    AIMechanicStartRequest,
    AIMechanicTurn,
    AIComponentSuggestion,
    AIPossibleCause,
    AISafety,
)
from app.services.ai_mechanic_service import (
    AIMechanicService,
    AIMechanicSessionNotFoundError,
    AIMechanicVehicleNotFoundError,
)


# ============================================================
# FAKE VEHICLE REPOSITORY
# ============================================================

class FakeVehicleRepository:
    def __init__(
        self,
        vehicle=None,
    ):
        self.vehicle = vehicle
        self.calls = []

    def find_owned_by_id(
        self,
        vehicle_id,
        user_id,
    ):
        self.calls.append(
            (
                vehicle_id,
                user_id,
            )
        )

        return self.vehicle


# ============================================================
# FAKE SESSION REPOSITORY
# ============================================================

class FakeSessionRepository:
    def __init__(self):
        self.created = []
        self.sessions = {}
        self.updated = []

    def create(
        self,
        document,
    ):
        created = {
            "_id": ObjectId(),
            **document,
        }

        self.created.append(
            created
        )

        self.sessions[
            str(created["_id"])
        ] = created

        return created

    def find_owned_by_id(
        self,
        session_id,
        user_id,
    ):
        session = self.sessions.get(
            session_id
        )

        if session is None:
            return None

        if (
            session["user_id"]
            != user_id
        ):
            return None

        return session

    def update_turn(
        self,
        *,
        session_id,
        user_id,
        messages,
        latest_turn,
        status,
        updated_at,
    ):
        session = self.sessions.get(
            session_id
        )

        if session is None:
            return False

        if (
            session["user_id"]
            != user_id
        ):
            return False

        session[
            "messages"
        ] = messages

        session[
            "latest_turn"
        ] = latest_turn

        session[
            "status"
        ] = status

        session[
            "updated_at"
        ] = updated_at

        self.updated.append(
            session_id
        )

        return True


# ============================================================
# FAKE AI ENGINE
# ============================================================

class FakeAIEngine:
    def __init__(
        self,
        turn,
    ):
        self.turn = turn
        self.calls = []

    def analyze(
        self,
        *,
        vehicle,
        messages,
    ):
        self.calls.append(
            {
                "vehicle": vehicle,
                "messages": messages,
            }
        )

        return self.turn


# ============================================================
# HELPERS
# ============================================================

def make_vehicle(
    user_id,
):
    return {
        "_id": ObjectId(),

        # Real Vehnexa vehicle documents store
        # the owning user id as a string.
        "user_id": str(
            user_id
        ),

        "year": 2026,
        "make": "Volkswagen",
        "model": "Tiguan",
        "engine": "2.0L TSI",
        "transmission": (
            "Automatic"
        ),
        "is_active": True,
    }


def make_follow_up_turn():
    return AIMechanicTurn(
        response_type="follow_up",
        assistant_message=(
            "I need one more detail "
            "to narrow this down."
        ),
        follow_up_question=(
            "Do you feel the vibration "
            "mainly in the steering wheel "
            "or through the brake pedal?"
        ),
        possible_causes=[],
        components=[],
        safety=AISafety(
            level="normal",
            message=(
                "Guidance only — not a "
                "definitive diagnosis."
            ),
        ),
    )


def make_analysis_turn():
    return AIMechanicTurn(
        response_type="analysis",
        assistant_message=(
            "The symptoms may be "
            "consistent with an issue "
            "in the front braking system."
        ),
        follow_up_question=None,
        possible_causes=[
            AIPossibleCause(
                cause=(
                    "Brake rotor variation"
                ),
                explanation=(
                    "Uneven rotor surfaces "
                    "may contribute to "
                    "vibration during braking."
                ),
                relevance="high",
            ),
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
                    "is a likely place to "
                    "inspect first."
                ),
            ),
        ],
        safety=AISafety(
            level="normal",
            message=(
                "Guidance only — not a "
                "definitive diagnosis."
            ),
        ),
    )


# ============================================================
# START SESSION
# ============================================================

def test_start_session_verifies_vehicle_ownership():
    user_id = ObjectId()

    vehicle = make_vehicle(
        user_id
    )

    vehicle_repository = (
        FakeVehicleRepository(
            vehicle
        )
    )

    session_repository = (
        FakeSessionRepository()
    )

    ai_engine = FakeAIEngine(
        make_follow_up_turn()
    )

    service = AIMechanicService(
        session_repository=(
            session_repository
        ),
        vehicle_repository=(
            vehicle_repository
        ),
        ai_engine=ai_engine,
    )

    service.start_session(
        {
            "_id": user_id,
        },
        AIMechanicStartRequest(
            vehicle_id=str(
                vehicle["_id"]
            ),
            message=(
                "My steering wheel shakes "
                "when I brake."
            ),
        ),
    )

    # Vehicle ownership lookup must use
    # the string form stored in My Garage.
    assert (
        vehicle_repository.calls[0]
        == (
            str(
                vehicle["_id"]
            ),
            str(
                user_id
            ),
        )
    )

    assert isinstance(
        vehicle_repository.calls[0][1],
        str,
    )

    # AI session ownership must still use
    # the original MongoDB ObjectId.
    assert (
        session_repository.created[0][
            "user_id"
        ]
        == user_id
    )

    assert isinstance(
        session_repository.created[0][
            "user_id"
        ],
        ObjectId,
    )


def test_start_session_rejects_missing_vehicle():
    user_id = ObjectId()

    service = AIMechanicService(
        session_repository=(
            FakeSessionRepository()
        ),
        vehicle_repository=(
            FakeVehicleRepository(
                None
            )
        ),
        ai_engine=FakeAIEngine(
            make_follow_up_turn()
        ),
    )

    with pytest.raises(
        AIMechanicVehicleNotFoundError
    ):
        service.start_session(
            {
                "_id": user_id,
            },
            AIMechanicStartRequest(
                vehicle_id=str(
                    ObjectId()
                ),
                message=(
                    "The car vibrates."
                ),
            ),
        )


def test_follow_up_turn_creates_waiting_session():
    user_id = ObjectId()

    vehicle = make_vehicle(
        user_id
    )

    session_repository = (
        FakeSessionRepository()
    )

    service = AIMechanicService(
        session_repository=(
            session_repository
        ),
        vehicle_repository=(
            FakeVehicleRepository(
                vehicle
            )
        ),
        ai_engine=FakeAIEngine(
            make_follow_up_turn()
        ),
    )

    session = (
        service.start_session(
            {
                "_id": user_id,
            },
            AIMechanicStartRequest(
                vehicle_id=str(
                    vehicle["_id"]
                ),
                message=(
                    "The steering wheel "
                    "shakes while braking."
                ),
            ),
        )
    )

    assert (
        session.status
        == "waiting_for_user"
    )

    assert (
        len(
            session.messages
        )
        == 2
    )

    assert (
        session.messages[0].role
        == "user"
    )

    assert (
        session.messages[1].role
        == "assistant"
    )

    assert (
        session.latest_turn
        is not None
    )

    assert (
        session.latest_turn
        .response_type
        == "follow_up"
    )


def test_analysis_turn_creates_analysis_ready_session():
    user_id = ObjectId()

    vehicle = make_vehicle(
        user_id
    )

    service = AIMechanicService(
        session_repository=(
            FakeSessionRepository()
        ),
        vehicle_repository=(
            FakeVehicleRepository(
                vehicle
            )
        ),
        ai_engine=FakeAIEngine(
            make_analysis_turn()
        ),
    )

    session = (
        service.start_session(
            {
                "_id": user_id,
            },
            AIMechanicStartRequest(
                vehicle_id=str(
                    vehicle["_id"]
                ),
                message=(
                    "My steering wheel "
                    "shakes under braking."
                ),
            ),
        )
    )

    assert (
        session.status
        == "analysis_ready"
    )

    assert (
        session.latest_turn
        is not None
    )

    assert (
        session.latest_turn
        .components[0]
        .hotspot_key
        == "front_brakes"
    )


# ============================================================
# CONTINUE SESSION
# ============================================================

def test_continue_session_appends_messages():
    user_id = ObjectId()

    vehicle = make_vehicle(
        user_id
    )

    session_repository = (
        FakeSessionRepository()
    )

    vehicle_repository = (
        FakeVehicleRepository(
            vehicle
        )
    )

    first_engine = FakeAIEngine(
        make_follow_up_turn()
    )

    service = AIMechanicService(
        session_repository=(
            session_repository
        ),
        vehicle_repository=(
            vehicle_repository
        ),
        ai_engine=first_engine,
    )

    first_session = (
        service.start_session(
            {
                "_id": user_id,
            },
            AIMechanicStartRequest(
                vehicle_id=str(
                    vehicle["_id"]
                ),
                message=(
                    "My steering wheel "
                    "shakes under braking."
                ),
            ),
        )
    )

    service.ai_engine = (
        FakeAIEngine(
            make_analysis_turn()
        )
    )

    updated_session = (
        service.continue_session(
            {
                "_id": user_id,
            },
            first_session.id,
            AIMechanicContinueRequest(
                message=(
                    "Mostly through the "
                    "steering wheel."
                ),
            ),
        )
    )

    assert (
        len(
            updated_session.messages
        )
        == 4
    )

    assert (
        updated_session.messages[2]
        .content
        == (
            "Mostly through the "
            "steering wheel."
        )
    )

    assert (
        updated_session.messages[3]
        .role
        == "assistant"
    )

    assert (
        updated_session.status
        == "analysis_ready"
    )

    # First call comes from start_session.
    # Second call comes from continue_session.
    assert (
        vehicle_repository.calls[1]
        == (
            str(
                vehicle["_id"]
            ),
            str(
                user_id
            ),
        )
    )

    assert isinstance(
        vehicle_repository.calls[1][1],
        str,
    )


def test_continue_missing_session_raises():
    user_id = ObjectId()

    service = AIMechanicService(
        session_repository=(
            FakeSessionRepository()
        ),
        vehicle_repository=(
            FakeVehicleRepository()
        ),
        ai_engine=FakeAIEngine(
            make_analysis_turn()
        ),
    )

    with pytest.raises(
        AIMechanicSessionNotFoundError
    ):
        service.continue_session(
            {
                "_id": user_id,
            },
            str(
                ObjectId()
            ),
            AIMechanicContinueRequest(
                message=(
                    "Mostly through the "
                    "steering wheel."
                ),
            ),
        )


# ============================================================
# GET SESSION
# ============================================================

def test_get_session_returns_owned_session():
    user_id = ObjectId()

    session_repository = (
        FakeSessionRepository()
    )

    now = datetime.now(
        timezone.utc
    )

    created = (
        session_repository.create(
            {
                "user_id": user_id,
                "vehicle_id": ObjectId(),
                "status": (
                    "analysis_ready"
                ),
                "messages": [],
                "latest_turn": (
                    make_analysis_turn()
                    .model_dump(
                        mode="python"
                    )
                ),
                "created_at": now,
                "updated_at": now,
            }
        )
    )

    service = AIMechanicService(
        session_repository=(
            session_repository
        ),
        vehicle_repository=(
            FakeVehicleRepository()
        ),
        ai_engine=FakeAIEngine(
            make_analysis_turn()
        ),
    )

    session = service.get_session(
        {
            "_id": user_id,
        },
        str(
            created["_id"]
        ),
    )

    assert (
        session.id
        == str(
            created["_id"]
        )
    )

    assert (
        session.status
        == "analysis_ready"
    )

    assert (
        session.latest_turn
        is not None
    )

    assert (
        session.latest_turn
        .components[0]
        .hotspot_key
        == "front_brakes"
    )


def test_get_missing_session_raises():
    service = AIMechanicService(
        session_repository=(
            FakeSessionRepository()
        ),
        vehicle_repository=(
            FakeVehicleRepository()
        ),
        ai_engine=FakeAIEngine(
            make_analysis_turn()
        ),
    )

    with pytest.raises(
        AIMechanicSessionNotFoundError
    ):
        service.get_session(
            {
                "_id": ObjectId(),
            },
            str(
                ObjectId()
            ),
        )