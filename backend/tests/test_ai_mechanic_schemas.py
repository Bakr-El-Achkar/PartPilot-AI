import pytest
from pydantic import ValidationError

from app.schemas.ai_mechanic import (
    AIComponentSuggestion,
    AIMechanicTurn,
    AIPossibleCause,
    AISafety,
)


def test_follow_up_response_is_valid():
    result = AIMechanicTurn(
        response_type="follow_up",
        assistant_message=(
            "I need one more detail before narrowing down "
            "the possible source."
        ),
        follow_up_question=(
            "Do you feel the vibration mainly in the "
            "steering wheel or through the brake pedal?"
        ),
        possible_causes=[],
        components=[],
        safety=AISafety(
            level="normal",
            message=(
                "Guidance only — not a definitive diagnosis."
            ),
        ),
    )

    assert result.response_type == "follow_up"
    assert result.follow_up_question is not None
    assert result.components == []


def test_analysis_response_supports_3d_hotspots():
    result = AIMechanicTurn(
        response_type="analysis",
        assistant_message=(
            "The symptoms may be consistent with an issue "
            "in the front braking system."
        ),
        follow_up_question=None,
        possible_causes=[
            AIPossibleCause(
                cause="Brake rotor variation",
                explanation=(
                    "Uneven rotor surfaces can contribute "
                    "to vibration during braking."
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
                    "The front brake area is a likely place "
                    "to inspect based on the reported symptom."
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

    component = result.components[0]

    assert component.component_key == "brake_rotor"
    assert component.catalog_key == "brake-rotors"
    assert component.hotspot_key == "front_brakes"
    assert component.relevance == "high"


def test_analysis_requires_at_least_one_component():
    with pytest.raises(ValidationError):
        AIMechanicTurn(
            response_type="analysis",
            assistant_message=(
                "The symptom may involve several vehicle systems."
            ),
            follow_up_question=None,
            possible_causes=[],
            components=[],
            safety=AISafety(
                level="normal",
                message=(
                    "Guidance only — not a definitive diagnosis."
                ),
            ),
        )


def test_follow_up_requires_a_question():
    with pytest.raises(ValidationError):
        AIMechanicTurn(
            response_type="follow_up",
            assistant_message=(
                "I need more information."
            ),
            follow_up_question=None,
            possible_causes=[],
            components=[],
            safety=AISafety(
                level="normal",
                message=(
                    "Guidance only — not a definitive diagnosis."
                ),
            ),
        )


def test_invalid_relevance_is_rejected():
    with pytest.raises(ValidationError):
        AIComponentSuggestion(
            component_key="brake_rotor",
            label="Front Brake Rotor",
            catalog_key="brake-rotors",
            hotspot_key="front_brakes",
            relevance="certain",
            explanation="Possible source of vibration.",
        )


def test_supported_safety_levels():
    normal = AISafety(
        level="normal",
        message="Normal diagnostic guidance.",
    )

    caution = AISafety(
        level="caution",
        message="Have the vehicle inspected soon.",
    )

    urgent = AISafety(
        level="urgent",
        message=(
            "Continuing to drive may be unsafe."
        ),
    )

    assert normal.level == "normal"
    assert caution.level == "caution"
    assert urgent.level == "urgent"


def test_invalid_safety_level_is_rejected():
    with pytest.raises(ValidationError):
        AISafety(
            level="dangerous",
            message="Invalid safety state.",
        )