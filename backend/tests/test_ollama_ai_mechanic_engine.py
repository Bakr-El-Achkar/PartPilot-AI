import json

import pytest

from app.services.ollama_ai_mechanic_engine import (
    AIMechanicEngineError,
    OllamaAIMechanicEngine,
)


# ============================================================
# FAKE HTTP RESPONSE
# ============================================================

class FakeResponse:
    def __init__(
        self,
        *,
        payload=None,
        should_fail=False,
    ):
        self.payload = (
            payload
            if payload is not None
            else {}
        )

        self.should_fail = should_fail

    def raise_for_status(
        self,
    ):
        if self.should_fail:
            raise RuntimeError(
                "HTTP request failed"
            )

    def json(
        self,
    ):
        return self.payload


# ============================================================
# FAKE HTTP CLIENT
# ============================================================

class FakeHTTPClient:
    def __init__(
        self,
        response,
    ):
        self.response = response
        self.calls = []

    def post(
        self,
        url,
        *,
        json=None,
        timeout=None,
    ):
        self.calls.append(
            {
                "url": url,
                "json": json,
                "timeout": timeout,
            }
        )

        return self.response


# ============================================================
# VALID AI RESPONSE
# ============================================================

def valid_analysis_content():
    return {
        "response_type": "analysis",
        "assistant_message": (
            "The symptoms may be consistent "
            "with an issue in the front "
            "braking system."
        ),
        "follow_up_question": None,
        "possible_causes": [
            {
                "cause": (
                    "Brake rotor variation"
                ),
                "explanation": (
                    "Uneven rotor surfaces "
                    "may contribute to "
                    "vibration while braking."
                ),
                "relevance": "high",
            }
        ],
        "components": [
            {
                "component_key": (
                    "brake_rotor"
                ),
                "label": (
                    "Front Brake Rotors"
                ),
                "catalog_key": (
                    "brake-rotors"
                ),
                "hotspot_key": (
                    "front_brakes"
                ),
                "relevance": "high",
                "explanation": (
                    "The front brake area "
                    "is a likely place "
                    "to inspect."
                ),
            }
        ],
        "safety": {
            "level": "normal",
            "message": (
                "Guidance only — not a "
                "definitive diagnosis."
            ),
        },
    }


# ============================================================
# VEHICLE
# ============================================================

def vehicle():
    return {
        "year": 2026,
        "make": "Volkswagen",
        "model": "Tiguan",
        "engine": "2.0L TSI",
        "transmission": (
            "Automatic"
        ),
    }


# ============================================================
# TEST STRUCTURED RESPONSE
# ============================================================

def test_analyze_parses_structured_ollama_response():
    content = json.dumps(
        valid_analysis_content()
    )

    client = FakeHTTPClient(
        FakeResponse(
            payload={
                "message": {
                    "role": (
                        "assistant"
                    ),
                    "content": content,
                },
                "done": True,
            }
        )
    )

    engine = OllamaAIMechanicEngine(
        host=(
            "http://localhost:11434"
        ),
        model=(
            "vehnexa-qwen3"
        ),
        client=client,
    )

    result = engine.analyze(
        vehicle=vehicle(),
        messages=[
            {
                "role": "user",
                "content": (
                    "My steering wheel "
                    "shakes when braking."
                ),
            }
        ],
    )

    assert (
        result.response_type
        == "analysis"
    )

    assert (
        result.components[0]
        .component_key
        == "brake_rotor"
    )

    assert (
        result.components[0]
        .hotspot_key
        == "front_brakes"
    )


# ============================================================
# TEST OLLAMA REQUEST
# ============================================================

def test_analyze_sends_json_schema_to_ollama():
    content = json.dumps(
        valid_analysis_content()
    )

    client = FakeHTTPClient(
        FakeResponse(
            payload={
                "message": {
                    "content": content,
                }
            }
        )
    )

    engine = OllamaAIMechanicEngine(
        host=(
            "http://localhost:11434/"
        ),
        model=(
            "vehnexa-qwen3"
        ),
        client=client,
    )

    engine.analyze(
        vehicle=vehicle(),
        messages=[
            {
                "role": "user",
                "content": (
                    "The steering wheel "
                    "shakes when braking."
                ),
            }
        ],
    )

    call = client.calls[0]

    assert (
        call["url"]
        == (
            "http://localhost:11434"
            "/api/chat"
        )
    )

    body = call["json"]

    assert (
        body["model"]
        == "vehnexa-qwen3"
    )

    assert (
        body["stream"]
        is False
    )

    assert (
        body["options"]
        ["temperature"]
        == 0
    )

    assert (
        isinstance(
            body["format"],
            dict,
        )
    )

    assert (
        body["format"]["type"]
        == "object"
    )


# ============================================================
# TEST VEHICLE CONTEXT
# ============================================================

def test_prompt_contains_selected_vehicle_context():
    content = json.dumps(
        valid_analysis_content()
    )

    client = FakeHTTPClient(
        FakeResponse(
            payload={
                "message": {
                    "content": content,
                }
            }
        )
    )

    engine = OllamaAIMechanicEngine(
        host=(
            "http://localhost:11434"
        ),
        model=(
            "vehnexa-qwen3"
        ),
        client=client,
    )

    engine.analyze(
        vehicle=vehicle(),
        messages=[
            {
                "role": "user",
                "content": (
                    "The car vibrates."
                ),
            }
        ],
    )

    messages = (
        client.calls[0]
        ["json"]
        ["messages"]
    )

    system_message = (
        messages[0]["content"]
    )

    assert (
        "2026 Volkswagen Tiguan"
        in system_message
    )

    assert (
        "2.0L TSI"
        in system_message
    )

    assert (
        "Automatic"
        in system_message
    )


# ============================================================
# TEST SAFETY / BUSINESS RULES IN PROMPT
# ============================================================

def test_prompt_forbids_inventory_and_fitment_invention():
    content = json.dumps(
        valid_analysis_content()
    )

    client = FakeHTTPClient(
        FakeResponse(
            payload={
                "message": {
                    "content": content,
                }
            }
        )
    )

    engine = OllamaAIMechanicEngine(
        host=(
            "http://localhost:11434"
        ),
        model=(
            "vehnexa-qwen3"
        ),
        client=client,
    )

    engine.analyze(
        vehicle=vehicle(),
        messages=[
            {
                "role": "user",
                "content": (
                    "The car vibrates."
                ),
            }
        ],
    )

    system_message = (
        client.calls[0]
        ["json"]
        ["messages"][0]
        ["content"]
        .lower()
    )

    assert (
        "do not invent"
        in system_message
    )

    assert (
        "price"
        in system_message
    )

    assert (
        "stock"
        in system_message
    )

    assert (
        "fitment"
        in system_message
    )

    assert (
        "possible"
        in system_message
    )


# ============================================================
# TEST INVALID MODEL JSON
# ============================================================

def test_invalid_model_json_raises_engine_error():
    client = FakeHTTPClient(
        FakeResponse(
            payload={
                "message": {
                    "content": (
                        "this is not json"
                    ),
                }
            }
        )
    )

    engine = OllamaAIMechanicEngine(
        host=(
            "http://localhost:11434"
        ),
        model=(
            "vehnexa-qwen3"
        ),
        client=client,
    )

    with pytest.raises(
        AIMechanicEngineError
    ):
        engine.analyze(
            vehicle=vehicle(),
            messages=[
                {
                    "role": "user",
                    "content": (
                        "The car vibrates."
                    ),
                }
            ],
        )


# ============================================================
# TEST INVALID STRUCTURE
# ============================================================

def test_invalid_ai_structure_raises_engine_error():
    content = json.dumps(
        {
            "response_type": (
                "analysis"
            ),
            "assistant_message": (
                "Possible brake issue."
            ),
            "follow_up_question": None,
            "possible_causes": [],
            "components": [],
            "safety": {
                "level": (
                    "normal"
                ),
                "message": (
                    "Guidance only."
                ),
            },
        }
    )

    client = FakeHTTPClient(
        FakeResponse(
            payload={
                "message": {
                    "content": content,
                }
            }
        )
    )

    engine = OllamaAIMechanicEngine(
        host=(
            "http://localhost:11434"
        ),
        model=(
            "vehnexa-qwen3"
        ),
        client=client,
    )

    with pytest.raises(
        AIMechanicEngineError
    ):
        engine.analyze(
            vehicle=vehicle(),
            messages=[
                {
                    "role": "user",
                    "content": (
                        "The car vibrates."
                    ),
                }
            ],
        )


# ============================================================
# TEST OLLAMA FAILURE
# ============================================================

def test_ollama_request_failure_raises_engine_error():
    client = FakeHTTPClient(
        FakeResponse(
            should_fail=True
        )
    )

    engine = OllamaAIMechanicEngine(
        host=(
            "http://localhost:11434"
        ),
        model=(
            "vehnexa-qwen3"
        ),
        client=client,
    )

    with pytest.raises(
        AIMechanicEngineError
    ):
        engine.analyze(
            vehicle=vehicle(),
            messages=[
                {
                    "role": "user",
                    "content": (
                        "The car vibrates."
                    ),
                }
            ],
        )