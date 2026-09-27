from dataclasses import dataclass
from typing import Literal


# ============================================================
# TYPES
# ============================================================

BackstopSafetyLevel = Literal[
    "caution",
    "urgent",
]


@dataclass(
    frozen=True,
    slots=True,
)
class AISafetyBackstopDecision:
    level: BackstopSafetyLevel
    message: str
    rule: str


# ============================================================
# SAFETY MESSAGES
# ============================================================

BRAKE_FAILURE_MESSAGE = (
    "Possible loss of braking ability was reported. "
    "Do not continue driving. Pull over safely if possible "
    "and arrange towing or professional assistance."
)

STEERING_FAILURE_MESSAGE = (
    "Possible loss of steering control was reported. "
    "Do not continue driving. Stop in a safe location "
    "and arrange towing or professional assistance."
)

FIRE_FUEL_MESSAGE = (
    "A possible fire or active fuel-leak hazard was reported. "
    "Stop the vehicle safely, switch off the engine, move away "
    "from the vehicle if necessary, and seek emergency or "
    "professional assistance."
)

OVERHEATING_MESSAGE = (
    "Possible severe overheating was reported. "
    "Avoid continued driving. Stop safely, switch off the "
    "engine, allow the vehicle to cool, and have the cause "
    "inspected before continuing."
)

SMOKE_MESSAGE = (
    "Smoke or a possible electrical-burning condition was "
    "reported. Stop driving if it is safe to do so and have "
    "the vehicle inspected before continuing."
)

FLUID_LEAK_MESSAGE = (
    "A potentially safety-relevant fluid leak was reported. "
    "Avoid unnecessary driving and have the vehicle inspected "
    "promptly. Stop driving if braking, steering, engine "
    "temperature, or vehicle control is affected."
)


# ============================================================
# URGENT RULES
# ============================================================

URGENT_RULES = (
    (
        "brake_failure",
        (
            "brakes don't work",
            "brakes do not work",
            "brakes are not working",
            "brakes stopped working",
            "lost my brakes",
            "lost the brakes",
            "no brakes",
            "can't stop the car",
            "cannot stop the car",
            "can't stop the vehicle",
            "cannot stop the vehicle",
            "car won't stop",
            "car will not stop",
            "vehicle won't stop",
            "vehicle will not stop",
            "brake pedal goes to the floor",
            "brake pedal went to the floor",
            "brake pedal sinks to the floor",
        ),
        BRAKE_FAILURE_MESSAGE,
    ),
    (
        "steering_failure",
        (
            "can't steer",
            "cannot steer",
            "unable to steer",
            "lost steering",
            "steering is locked",
            "steering locked",
            "steering wheel won't turn",
            "steering wheel will not turn",
        ),
        STEERING_FAILURE_MESSAGE,
    ),
    (
        "fire_or_active_fuel_leak",
        (
            "car is on fire",
            "vehicle is on fire",
            "engine is on fire",
            "flames coming from",
            "flames under the hood",
            "fuel is leaking",
            "gasoline is leaking",
            "active fuel leak",
        ),
        FIRE_FUEL_MESSAGE,
    ),
)


# ============================================================
# CAUTION RULES
# ============================================================

CAUTION_RULES = (
    (
        "severe_overheating",
        (
            "engine is overheating",
            "car is overheating",
            "vehicle is overheating",
            "temperature gauge is in the red",
            "temperature gauge went into the red",
            "coolant is boiling",
            "steam coming from under the hood",
            "steam under the hood",
        ),
        OVERHEATING_MESSAGE,
    ),
    (
        "smoke_or_electrical_burning",
        (
            "smoke coming from the engine",
            "smoke under the hood",
            "smoke coming from under the hood",
            "burning smell from the dashboard",
            "electrical burning smell",
        ),
        SMOKE_MESSAGE,
    ),
    (
        "safety_relevant_fluid_leak",
        (
            "brake fluid leak",
            "brake fluid is leaking",
            "fuel leak",
            "gasoline leak",
            "coolant pouring out",
        ),
        FLUID_LEAK_MESSAGE,
    ),
)


# ============================================================
# NORMALIZATION
# ============================================================

def _normalize_text(
    value: str,
) -> str:
    return (
        " ".join(
            value
            .replace(
                "\u2019",
                "'",
            )
            .strip()
            .lower()
            .split()
        )
    )


# ============================================================
# USER MESSAGE EXTRACTION
# ============================================================

def _get_user_text(
    messages: list[dict],
) -> str:
    user_messages = []

    for message in messages:
        if not isinstance(
            message,
            dict,
        ):
            continue

        if (
            message.get(
                "role"
            )
            != "user"
        ):
            continue

        content = message.get(
            "content"
        )

        if not isinstance(
            content,
            str,
        ):
            continue

        normalized = (
            _normalize_text(
                content
            )
        )

        if normalized:
            user_messages.append(
                normalized
            )

    return "\n".join(
        user_messages
    )


# ============================================================
# RULE MATCHING
# ============================================================

def _match_rules(
    *,
    text: str,
    level: BackstopSafetyLevel,
    rules,
) -> AISafetyBackstopDecision | None:
    for (
        rule_name,
        phrases,
        message,
    ) in rules:
        for phrase in phrases:
            if phrase in text:
                return (
                    AISafetyBackstopDecision(
                        level=level,
                        message=message,
                        rule=rule_name,
                    )
                )

    return None


# ============================================================
# PUBLIC EVALUATION
# ============================================================

def evaluate_ai_safety_backstop(
    messages: list[dict],
) -> AISafetyBackstopDecision | None:
    """
    Evaluate explicit safety-critical statements made by the
    USER.

    Assistant/Qwen text is intentionally ignored.

    Rules are intentionally narrow. This is a deterministic
    backstop, not another diagnostic engine.
    """

    user_text = (
        _get_user_text(
            messages
        )
    )

    if not user_text:
        return None

    # Urgent always takes priority.
    urgent = _match_rules(
        text=user_text,
        level="urgent",
        rules=URGENT_RULES,
    )

    if urgent is not None:
        return urgent

    caution = _match_rules(
        text=user_text,
        level="caution",
        rules=CAUTION_RULES,
    )

    return caution
