from app.schemas.ai_mechanic import (
    AIComponentSuggestion,
    AIMechanicTurn,
    AIPossibleCause,
    AISafety,
)
from app.services.ai_mechanic_service import (
    AIMechanicService,
)


# ============================================================
# FAKE AI ENGINE
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

def make_follow_up_turn(
    *,
    safety_level="normal",
    safety_message="General guidance.",
):
    return AIMechanicTurn(
        response_type="follow_up",
        assistant_message=(
            "I need one more detail."
        ),
        follow_up_question=(
            "When does the symptom occur?"
        ),
        possible_causes=[],
        components=[],
        safety=AISafety(
            level=safety_level,
            message=safety_message,
        ),
    )


def make_analysis_turn(
    *,
    safety_level="normal",
    safety_message="General guidance.",
):
    return AIMechanicTurn(
        response_type="analysis",
        assistant_message=(
            "The braking system may "
            "need inspection."
        ),
        follow_up_question=None,
        possible_causes=[
            AIPossibleCause(
                cause=(
                    "Brake rotor variation"
                ),
                explanation=(
                    "Rotor variation may "
                    "cause vibration."
                ),
                relevance="high",
            )
        ],
        components=[
            AIComponentSuggestion(
                component_key=(
                    "brake_rotor"
                ),
                label="Wrong AI Label",
                catalog_key=(
                    "wrong-category"
                ),
                hotspot_key=(
                    "wrong-hotspot"
                ),
                relevance="high",
                explanation=(
                    "Inspect this area."
                ),
            )
        ],
        safety=AISafety(
            level=safety_level,
            message=safety_message,
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
# NORMAL -> URGENT
# ============================================================

def test_brake_failure_upgrades_normal_to_urgent():
    service = make_service(
        make_follow_up_turn()
    )

    result = service._analyze(
        vehicle={},
        messages=[
            {
                "role": "user",
                "content": (
                    "My brakes are not working "
                    "and I cannot stop the car."
                ),
            }
        ],
    )

    assert (
        result.safety.level
        == "urgent"
    )


# ============================================================
# NORMAL -> CAUTION
# ============================================================

def test_overheating_upgrades_normal_to_caution():
    service = make_service(
        make_follow_up_turn()
    )

    result = service._analyze(
        vehicle={},
        messages=[
            {
                "role": "user",
                "content": (
                    "The engine is overheating "
                    "and the temperature gauge "
                    "is in the red."
                ),
            }
        ],
    )

    assert (
        result.safety.level
        == "caution"
    )


# ============================================================
# NEVER DOWNGRADE URGENT
# ============================================================

def test_existing_urgent_is_never_downgraded():
    original_message = (
        "Qwen already determined "
        "this requires urgent action."
    )

    service = make_service(
        make_analysis_turn(
            safety_level="urgent",
            safety_message=(
                original_message
            ),
        )
    )

    result = service._analyze(
        vehicle={},
        messages=[
            {
                "role": "user",
                "content": (
                    "The engine is overheating."
                ),
            }
        ],
    )

    assert (
        result.safety.level
        == "urgent"
    )

    assert (
        result.safety.message
        == original_message
    )


# ============================================================
# COMPONENT NORMALIZATION STILL RUNS
# ============================================================

def test_safety_backstop_does_not_break_component_registry():
    service = make_service(
        make_analysis_turn()
    )

    result = service._analyze(
        vehicle={},
        messages=[
            {
                "role": "user",
                "content": (
                    "My steering wheel shakes "
                    "when braking."
                ),
            }
        ],
    )

    component = (
        result.components[0]
    )

    assert (
        component.component_key
        == "brake_rotor"
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
        result.safety.level
        == "normal"
    )
