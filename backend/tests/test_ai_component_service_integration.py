import pytest

from app.schemas.ai_mechanic import (
    AIComponentSuggestion,
    AIMechanicTurn,
    AIPossibleCause,
    AISafety,
)
from app.services.ai_mechanic_service import (
    AIMechanicService,
)
from app.services.ollama_ai_mechanic_engine import (
    AIMechanicEngineError,
)


# ============================================================
# FAKE ENGINE
# ============================================================

class FakeAIEngine:
    def __init__(
        self,
        turn,
    ):
        self.turn = turn

    def analyze(
        self,
        *,
        vehicle,
        messages,
    ):
        return self.turn


# ============================================================
# HELPERS
# ============================================================

def make_component(
    *,
    component_key,
    label,
    catalog_key,
    hotspot_key,
    relevance="high",
):
    return AIComponentSuggestion(
        component_key=(
            component_key
        ),
        label=label,
        catalog_key=(
            catalog_key
        ),
        hotspot_key=(
            hotspot_key
        ),
        relevance=relevance,
        explanation=(
            "Component may be related "
            "to the reported symptom."
        ),
    )


def make_analysis_turn(
    components,
):
    return AIMechanicTurn(
        response_type="analysis",
        assistant_message=(
            "Possible braking components "
            "should be inspected."
        ),
        follow_up_question=None,
        possible_causes=[
            AIPossibleCause(
                cause=(
                    "Brake-related vibration"
                ),
                explanation=(
                    "The symptom may be related "
                    "to the braking system."
                ),
                relevance="high",
            )
        ],
        components=components,
        safety=AISafety(
            level="caution",
            message=(
                "Have the vehicle inspected."
            ),
        ),
    )


def make_service(
    turn,
):
    return AIMechanicService(
        session_repository=None,
        vehicle_repository=None,
        ai_engine=FakeAIEngine(
            turn
        ),
    )


# ============================================================
# TRUSTED REGISTRY OVERRIDES AI VALUES
# ============================================================

def test_registry_overrides_qwen_mapping():
    turn = make_analysis_turn(
        [
            make_component(
                component_key=(
                    "brake_rotor"
                ),
                label=(
                    "Qwen Invented Rotor Label"
                ),
                catalog_key=(
                    "qwen-invented-category"
                ),
                hotspot_key=(
                    "engine_bay"
                ),
            )
        ]
    )

    service = make_service(
        turn
    )

    result = service._analyze(
        vehicle={},
        messages=[],
    )

    component = (
        result.components[0]
    )

    assert (
        component.component_key
        == "brake_rotor"
    )

    assert (
        component.label
        == "Brake Rotors"
    )

    assert (
        component.catalog_key
        == "brake-rotors"
    )

    assert (
        component.hotspot_key
        == "front_brakes"
    )

    assert (
        component.relevance
        == "high"
    )


# ============================================================
# UNKNOWN COMPONENTS ARE DROPPED
# ============================================================

def test_unknown_component_is_filtered():
    turn = make_analysis_turn(
        [
            make_component(
                component_key=(
                    "qwen_fake_part"
                ),
                label="Fake",
                catalog_key=(
                    "fake-category"
                ),
                hotspot_key=(
                    "fake_hotspot"
                ),
            ),
            make_component(
                component_key=(
                    "brake_pad"
                ),
                label="Wrong Label",
                catalog_key=(
                    "wrong-category"
                ),
                hotspot_key=(
                    "engine_bay"
                ),
                relevance="medium",
            ),
        ]
    )

    service = make_service(
        turn
    )

    result = service._analyze(
        vehicle={},
        messages=[],
    )

    assert (
        len(
            result.components
        )
        == 1
    )

    component = (
        result.components[0]
    )

    assert (
        component.component_key
        == "brake_pad"
    )

    assert (
        component.label
        == "Brake Pads"
    )

    assert (
        component.catalog_key
        == "brake-pads"
    )

    assert (
        component.hotspot_key
        == "front_brakes"
    )


# ============================================================
# ALL-UNKNOWN ANALYSIS MUST FAIL
# ============================================================

def test_analysis_with_only_unknown_components_fails():
    turn = make_analysis_turn(
        [
            make_component(
                component_key=(
                    "qwen_fake_part"
                ),
                label="Fake Part",
                catalog_key=(
                    "fake-parts"
                ),
                hotspot_key=(
                    "fake_hotspot"
                ),
            )
        ]
    )

    service = make_service(
        turn
    )

    with pytest.raises(
        AIMechanicEngineError
    ):
        service._analyze(
            vehicle={},
            messages=[],
        )


# ============================================================
# DUPLICATES ARE REMOVED
# ============================================================

def test_duplicate_registered_components_are_removed():
    turn = make_analysis_turn(
        [
            make_component(
                component_key=(
                    "brake_rotor"
                ),
                label="First",
                catalog_key="first",
                hotspot_key="first",
                relevance="high",
            ),
            make_component(
                component_key=(
                    "brake_rotor"
                ),
                label="Second",
                catalog_key="second",
                hotspot_key="second",
                relevance="medium",
            ),
        ]
    )

    service = make_service(
        turn
    )

    result = service._analyze(
        vehicle={},
        messages=[],
    )

    assert (
        len(
            result.components
        )
        == 1
    )

    assert (
        result.components[0]
        .component_key
        == "brake_rotor"
    )


# ============================================================
# FOLLOW-UP REMAINS VALID
# ============================================================

def test_follow_up_turn_is_not_forced_through_registry():
    turn = AIMechanicTurn(
        response_type="follow_up",
        assistant_message=(
            "I need one more detail."
        ),
        follow_up_question=(
            "Do you feel brake pedal pulsation?"
        ),
        possible_causes=[],
        components=[],
        safety=AISafety(
            level="normal",
            message=(
                "Provide more information "
                "before further guidance."
            ),
        ),
    )

    service = make_service(
        turn
    )

    result = service._analyze(
        vehicle={},
        messages=[],
    )

    assert (
        result.response_type
        == "follow_up"
    )

    assert (
        result.components
        == []
    )
