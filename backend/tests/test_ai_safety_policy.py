from app.core.ai_safety_policy import (
    evaluate_ai_safety_backstop,
)


def user_message(
    text,
):
    return [
        {
            "role": "user",
            "content": text,
        }
    ]


def test_brake_failure_is_urgent():
    result = (
        evaluate_ai_safety_backstop(
            user_message(
                "My brakes are not working "
                "and I cannot stop the car."
            )
        )
    )

    assert result is not None
    assert result.level == "urgent"
    assert result.rule == "brake_failure"


def test_steering_failure_is_urgent():
    result = (
        evaluate_ai_safety_backstop(
            user_message(
                "The steering wheel won't turn."
            )
        )
    )

    assert result is not None
    assert result.level == "urgent"
    assert result.rule == "steering_failure"


def test_vehicle_fire_is_urgent():
    result = (
        evaluate_ai_safety_backstop(
            user_message(
                "The engine is on fire."
            )
        )
    )

    assert result is not None
    assert result.level == "urgent"


def test_severe_overheating_is_caution():
    result = (
        evaluate_ai_safety_backstop(
            user_message(
                "The engine is overheating "
                "and the temperature gauge "
                "is in the red."
            )
        )
    )

    assert result is not None
    assert result.level == "caution"
    assert (
        result.rule
        == "severe_overheating"
    )


def test_engine_smoke_is_caution():
    result = (
        evaluate_ai_safety_backstop(
            user_message(
                "There is smoke coming "
                "from the engine."
            )
        )
    )

    assert result is not None
    assert result.level == "caution"


def test_normal_brake_vibration_does_not_trigger():
    result = (
        evaluate_ai_safety_backstop(
            user_message(
                "My steering wheel shakes "
                "when I brake at highway speed."
            )
        )
    )

    assert result is None


def test_assistant_messages_are_ignored():
    result = (
        evaluate_ai_safety_backstop(
            [
                {
                    "role": "assistant",
                    "content": (
                        "If your brakes are not "
                        "working, stop driving."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        "I only feel a small "
                        "vibration."
                    ),
                },
            ]
        )
    )

    assert result is None


def test_negative_smoke_statement_does_not_trigger():
    result = (
        evaluate_ai_safety_backstop(
            user_message(
                "There is no smoke and the "
                "engine is not overheating."
            )
        )
    )

    assert result is None
