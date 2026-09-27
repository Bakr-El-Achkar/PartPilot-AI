from datetime import (
    datetime,
    timezone,
)

import pytest
from pydantic import ValidationError

from app.schemas.ai_mechanic import (
    AIMechanicContinueRequest,
    AIMechanicMessage,
    AIMechanicSessionPublic,
    AIMechanicStartRequest,
    AIMechanicTurn,
    AIComponentSuggestion,
    AIPossibleCause,
    AISafety,
)


def test_start_request_accepts_vehicle_and_symptom():
    request = AIMechanicStartRequest(
        vehicle_id="vehicle-123",
        message=(
            "The steering wheel shakes when I brake "
            "at highway speed."
        ),
    )

    assert request.vehicle_id == "vehicle-123"
    assert (
        request.message
        == (
            "The steering wheel shakes when I brake "
            "at highway speed."
        )
    )


def test_start_request_rejects_blank_vehicle_id():
    with pytest.raises(ValidationError):
        AIMechanicStartRequest(
            vehicle_id="   ",
            message="The car vibrates while braking.",
        )


def test_start_request_rejects_blank_message():
    with pytest.raises(ValidationError):
        AIMechanicStartRequest(
            vehicle_id="vehicle-123",
            message="   ",
        )


def test_continue_request_accepts_follow_up_answer():
    request = AIMechanicContinueRequest(
        message=(
            "Mostly through the steering wheel."
        ),
    )

    assert (
        request.message
        == "Mostly through the steering wheel."
    )


def test_ai_message_supports_user_and_assistant_roles():
    now = datetime.now(
        timezone.utc
    )

    user_message = AIMechanicMessage(
        role="user",
        content="The brakes vibrate.",
        created_at=now,
    )

    assistant_message = AIMechanicMessage(
        role="assistant",
        content=(
            "Do you feel the vibration in the "
            "steering wheel?"
        ),
        created_at=now,
    )

    assert user_message.role == "user"
    assert assistant_message.role == "assistant"


def test_invalid_message_role_is_rejected():
    with pytest.raises(ValidationError):
        AIMechanicMessage(
            role="system",
            content="Hidden prompt.",
            created_at=datetime.now(
                timezone.utc
            ),
        )


def test_session_public_can_include_latest_analysis():
    now = datetime.now(
        timezone.utc
    )

    turn = AIMechanicTurn(
        response_type="analysis",
        assistant_message=(
            "The symptoms may involve the front "
            "braking system."
        ),
        follow_up_question=None,
        possible_causes=[
            AIPossibleCause(
                cause="Brake rotor variation",
                explanation=(
                    "Uneven rotor surfaces may cause "
                    "vibration during braking."
                ),
                relevance="high",
            ),
        ],
        components=[
            AIComponentSuggestion(
                component_key="brake_rotor",
                label="Front Brake Rotors",
                catalog_key="brake-rotors",
                hotspot_key="front_brakes",
                relevance="high",
                explanation=(
                    "The front brake area is a likely "
                    "place to inspect."
                ),
            ),
        ],
        safety=AISafety(
            level="normal",
            message=(
                "Guidance only — not a definitive diagnosis."
            ),
        ),
    )

    session = AIMechanicSessionPublic(
        id="session-123",
        vehicle_id="vehicle-123",
        status="analysis_ready",
        messages=[
            AIMechanicMessage(
                role="user",
                content=(
                    "The steering wheel shakes "
                    "when I brake."
                ),
                created_at=now,
            ),
            AIMechanicMessage(
                role="assistant",
                content=(
                    "The symptoms may involve "
                    "the front braking system."
                ),
                created_at=now,
            ),
        ],
        latest_turn=turn,
        created_at=now,
        updated_at=now,
    )

    assert session.id == "session-123"
    assert session.vehicle_id == "vehicle-123"
    assert session.status == "analysis_ready"

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


def test_invalid_session_status_is_rejected():
    now = datetime.now(
        timezone.utc
    )

    with pytest.raises(
        ValidationError
    ):
        AIMechanicSessionPublic(
            id="session-123",
            vehicle_id="vehicle-123",
            status="finished_forever",
            messages=[],
            latest_turn=None,
            created_at=now,
            updated_at=now,
        )