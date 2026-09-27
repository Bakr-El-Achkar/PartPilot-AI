import json
import logging
import time
from copy import deepcopy
from typing import Any

import httpx
from pydantic import ValidationError

from app.core.ai_config import (
    ai_settings,
)

from app.schemas.ai_mechanic import (
    AIMechanicTurn,
)


AI_TIMING_LOGGER = logging.getLogger(
    "uvicorn.error"
)


# ============================================================
# DOMAIN ERROR
# ============================================================

class AIMechanicEngineError(
    Exception
):
    """
    Raised when the AI provider cannot return a valid,
    structured AI Mechanic result.
    """

    pass


# ============================================================
# OLLAMA / QWEN AI MECHANIC ENGINE
# ============================================================

class OllamaAIMechanicEngine:
    def __init__(
        self,
        *,
        host: str,
        model: str,
        client=None,
        timeout_seconds: float = 120.0,
        auth_token: str | None = None,
    ):
        self.host = (
            host
            .strip()
            .rstrip("/")
        )

        self.model = (
            model.strip()
        )

        self.timeout_seconds = (
            timeout_seconds
        )

        resolved_auth_token = (
            auth_token
            if auth_token is not None
            else (
                ai_settings
                .vehnexa_ai_proxy_token
            )
        )

        self.auth_token = (
            resolved_auth_token.strip()
            if isinstance(
                resolved_auth_token,
                str,
            )
            else ""
        )

        if client is not None:
            self.client = client

        else:
            headers = {}

            if self.auth_token:
                headers[
                    "Authorization"
                ] = (
                    f"Bearer "
                    f"{self.auth_token}"
                )

            self.client = (
                httpx.Client(
                    headers=headers,
                )
            )

    # ========================================================
    # PUBLIC ANALYSIS METHOD
    # ========================================================

    def analyze(
        self,
        *,
        vehicle: dict,
        messages: list[dict],
    ) -> AIMechanicTurn:
        request_messages = (
            self._build_messages(
                vehicle=vehicle,
                messages=messages,
            )
        )

        content = (
            self._request_model(
                request_messages
            )
        )

        try:
            return (
                self._timed_parse_turn(
                    content,
                    validation_kind="primary",
                )
            )

        except ValidationError as exc:
            repaired_content = (
                self._repair_invalid_turn(
                    original_messages=(
                        request_messages
                    ),
                    invalid_content=content,
                    validation_error=exc,
                )
            )

            try:
                return (
                    self._timed_parse_turn(
                        repaired_content,
                        validation_kind="repair",
                    )
                )

            except (
                ValidationError,
                json.JSONDecodeError,
                TypeError,
            ) as repair_exc:
                raise (
                    AIMechanicEngineError(
                        "AI Mechanic returned "
                        "an invalid diagnostic "
                        "structure after one "
                        "repair attempt."
                    )
                ) from repair_exc

        except (
            json.JSONDecodeError,
            TypeError,
        ) as exc:
            raise (
                AIMechanicEngineError(
                    "AI Mechanic returned "
                    "invalid JSON."
                )
            ) from exc

    # ========================================================
    # TIMED STRUCTURED-OUTPUT VALIDATION
    # ========================================================

    def _timed_parse_turn(
        self,
        content: str,
        *,
        validation_kind: str,
    ) -> AIMechanicTurn:
        started = (
            time.perf_counter()
        )

        try:
            return self._parse_turn(
                content
            )

        finally:
            elapsed_ms = (
                (
                    time.perf_counter()
                    - started
                )
                * 1000
            )

            AI_TIMING_LOGGER.info(
                "[AI TIMING] "
                "schema_validation "
                "kind=%s "
                "wall_ms=%.2f",
                validation_kind,
                elapsed_ms,
            )


    # ========================================================
    # REQUEST MODEL
    # ========================================================

    def _request_model(
        self,
        messages: list[dict],
        *,
        require_components: bool = False,
    ) -> str:
        body = {
            "model": self.model,

            "messages": (
                messages
            ),

            "stream": False,

            # Hardened JSON schema.
            #
            # During normal generation every top-level
            # AIMechanicTurn field must be explicitly returned.
            #
            # During repair of an invalid analysis response,
            # component/possible-cause arrays can additionally
            # be forced to contain at least one item.
            "format": (
                self._build_output_schema(
                    require_components=(
                        require_components
                    ),
                )
            ),

            "options": {
                "temperature": 0,
            },
        }

        request_started = (
            time.perf_counter()
        )

        try:
            response = (
                self.client.post(
                    (
                        f"{self.host}"
                        "/api/chat"
                    ),
                    json=body,
                    timeout=(
                        self.timeout_seconds
                    ),
                )
            )

            response.raise_for_status()

            payload = (
                response.json()
            )

            wall_ms = (
                (
                    time.perf_counter()
                    - request_started
                )
                * 1000
            )

            def ns_to_ms(
                value,
            ):
                if not isinstance(
                    value,
                    (int, float),
                ):
                    return 0.0

                return (
                    float(value)
                    / 1_000_000
                )

            ollama_total_ms = (
                ns_to_ms(
                    payload.get(
                        "total_duration"
                    )
                )
            )

            load_ms = (
                ns_to_ms(
                    payload.get(
                        "load_duration"
                    )
                )
            )

            prompt_eval_ms = (
                ns_to_ms(
                    payload.get(
                        "prompt_eval_duration"
                    )
                )
            )

            eval_ms = (
                ns_to_ms(
                    payload.get(
                        "eval_duration"
                    )
                )
            )

            prompt_tokens = (
                payload.get(
                    "prompt_eval_count",
                    0,
                )
                or 0
            )

            output_tokens = (
                payload.get(
                    "eval_count",
                    0,
                )
                or 0
            )

            eval_seconds = (
                eval_ms
                / 1000
            )

            tokens_per_second = (
                (
                    output_tokens
                    / eval_seconds
                )
                if eval_seconds > 0
                else 0.0
            )

            AI_TIMING_LOGGER.info(
                "[AI TIMING] "
                "qwen_request "
                "wall_ms=%.2f "
                "ollama_total_ms=%.2f "
                "load_ms=%.2f "
                "prompt_eval_ms=%.2f "
                "generation_ms=%.2f "
                "prompt_tokens=%s "
                "output_tokens=%s "
                "generation_tps=%.2f",
                wall_ms,
                ollama_total_ms,
                load_ms,
                prompt_eval_ms,
                eval_ms,
                prompt_tokens,
                output_tokens,
                tokens_per_second,
            )

        except Exception as exc:
            raise (
                AIMechanicEngineError(
                    "Unable to communicate "
                    "with the AI Mechanic engine."
                )
            ) from exc

        return (
            self._extract_content(
                payload
            )
        )

    # ========================================================
    # REPAIR INVALID STRUCTURED TURN
    # ========================================================

    def _repair_invalid_turn(
        self,
        *,
        original_messages: list[dict],
        invalid_content: str,
        validation_error: ValidationError,
    ) -> str:
        repair_instruction = f"""
Your previous JSON response did not satisfy Vehnexa's
required diagnostic structure.

VALIDATION ERROR

{validation_error}

PREVIOUS JSON

{invalid_content}

Correct the response.

IMPORTANT RULES

If response_type is "analysis":

- components MUST contain at least one component suggestion
- possible_causes MUST contain relevant possible causes
- follow_up_question MUST be null
- include safety guidance

Every component suggestion MUST include all fields required
by the supplied JSON schema.

Use component_key values such as:

- brake_rotor
- brake_pad
- brake_caliper
- control_arm
- tie_rod
- wheel_bearing
- spark_plug
- ignition_coil
- battery
- alternator
- radiator
- water_pump

Use catalog_key values such as:

- brake-rotors
- brake-pads
- brake-calipers
- control-arms
- tie-rods
- wheel-bearings
- spark-plugs
- ignition-coils
- batteries
- alternators
- radiators
- water-pumps

If you do not have enough information to provide at least
one justified component suggestion, change response_type to
"follow_up" and ask one useful follow-up question instead.

For a follow_up response:

- include assistant_message
- include follow_up_question
- components may be empty
- possible_causes may be empty
- include safety guidance

Do not invent:

- product IDs
- product names
- SKUs
- part numbers
- prices
- stock
- availability
- product compatibility
- product fitment

Return ONLY corrected JSON matching the supplied schema.

Do not include markdown.

Do not include commentary outside the JSON.
""".strip()

        repair_messages = [
            *original_messages,

            {
                "role": "assistant",
                "content": (
                    invalid_content
                ),
            },

            {
                "role": "user",
                "content": (
                    repair_instruction
                ),
            },
        ]

        # Only force a non-empty components array when the
        # invalid response was actually attempting to return
        # an analysis.
        #
        # We intentionally do NOT force components for an
        # invalid follow-up response because follow-ups are
        # allowed to have an empty components list.

        require_components = False

        try:
            invalid_raw = (
                json.loads(
                    invalid_content
                )
            )

            require_components = (
                invalid_raw.get(
                    "response_type"
                )
                == "analysis"
            )

        except (
            json.JSONDecodeError,
            TypeError,
        ):
            pass

        return (
            self._request_model(
                repair_messages,
                require_components=(
                    require_components
                ),
            )
        )

    # ========================================================
    # BUILD OLLAMA MESSAGES
    # ========================================================

    def _build_messages(
        self,
        *,
        vehicle: dict,
        messages: list[dict],
    ) -> list[dict]:
        system_prompt = (
            self._build_system_prompt(
                vehicle
            )
        )

        result = [
            {
                "role": "system",

                "content": (
                    system_prompt
                ),
            }
        ]

        for message in messages:
            role = (
                message.get(
                    "role"
                )
            )

            content = (
                message.get(
                    "content"
                )
            )

            if (
                role
                not in {
                    "user",
                    "assistant",
                }
            ):
                continue

            if not isinstance(
                content,
                str,
            ):
                continue

            content = (
                content.strip()
            )

            if not content:
                continue

            result.append(
                {
                    "role": role,
                    "content": content,
                }
            )

        return result

    # ========================================================
    # SYSTEM PROMPT
    # ========================================================

    @staticmethod
    def _build_system_prompt(
        vehicle: dict,
    ) -> str:
        year = (
            vehicle.get(
                "year",
                "Unknown",
            )
        )

        make = (
            vehicle.get(
                "make",
                "Unknown",
            )
        )

        model = (
            vehicle.get(
                "model",
                "Unknown",
            )
        )

        engine = (
            vehicle.get(
                "engine",
                "Unknown",
            )
        )

        transmission = (
            vehicle.get(
                "transmission",
                "Unknown",
            )
        )

        vehicle_description = (
            f"{year} {make} {model}"
        )

        return f"""
You are Vehnexa AI Mechanic, an automotive troubleshooting
assistant.

SELECTED VEHICLE

Vehicle: {vehicle_description}
Engine: {engine}
Transmission: {transmission}

YOUR ROLE

Help the user reason about vehicle symptoms using plain,
understandable language.

Your output is guidance only. It is not a professional,
confirmed, or definitive mechanical diagnosis.

When the information is insufficient, ask one useful
follow-up question.

When enough information exists, return possible causes
and likely components that should be inspected.

IMPORTANT DIAGNOSTIC RULES

Use uncertainty-aware language.

Use wording such as:

- possible cause
- may be related to
- may be consistent with
- likely area to inspect
- could contribute to the symptom

Do not state that a component is definitely broken unless
the conversation contains reliable direct evidence that
would justify such a statement.

SAFETY

If the reported symptoms may make continued driving unsafe,
set safety.level to "caution" or "urgent" and explain the
appropriate safe next step.

Examples include possible severe braking problems,
steering loss, overheating, smoke, major fluid loss,
or similar safety-critical symptoms.

Do not encourage the user to continue driving when the
reported situation could reasonably be unsafe.

VEHNEXA MARKETPLACE RULES

You reason about COMPONENTS only.

Do not invent:

- product IDs
- product names
- SKUs
- part numbers
- price
- sale price
- stock
- availability
- fitment
- compatibility

Actual product price, stock and fitment are determined
later by the Vehnexa backend using its real catalog and
vehicle compatibility data.

Never claim that a product fits the vehicle.

COMPONENT OUTPUT

For every component suggestion provide every field required
by the supplied JSON schema.

component_key:

A stable machine-friendly component identifier.

Examples:

brake_rotor
brake_pad
brake_caliper
control_arm
tie_rod
wheel_bearing
spark_plug
ignition_coil
battery
alternator
radiator
water_pump

catalog_key:

A marketplace-oriented category or subcategory key.

Examples:

brake-rotors
brake-pads
brake-calipers
control-arms
tie-rods
wheel-bearings
spark-plugs
ignition-coils
batteries
alternators
radiators
water-pumps

hotspot_key:

A semantic area used by the Vehnexa 3D car viewer.

Prefer one of these general areas when applicable:

front_brakes
rear_brakes
front_left_wheel
front_right_wheel
rear_left_wheel
rear_right_wheel
front_suspension
rear_suspension
front_left_suspension
front_right_suspension
steering_system
engine_bay
engine_front
engine_left
engine_right
battery_area
cooling_system
transmission_area
exhaust_system
fuel_system
electrical_system
underbody
rear_vehicle

Do not invent x, y, or z coordinates.

The frontend owns all real 3D positions and maps hotspot_key
to predetermined coordinates on the vehicle model.

RELEVANCE

Use only:

high
medium
low

Do not return fake numeric certainty percentages.

RESPONSE TYPES

Use "follow_up" when more information is required.

For a follow_up response:

- include assistant_message
- include follow_up_question
- possible_causes may be empty
- components may be empty
- include safety guidance

Use "analysis" when there is enough information to provide
meaningful possible causes.

For an analysis response:

- include assistant_message
- follow_up_question MUST be null
- components MUST contain at least one component suggestion
- possible_causes MUST contain at least one relevant cause
- include safety guidance

CRITICAL COMPONENT RULE

Never return response_type="analysis" without the
components field.

Never return response_type="analysis" with an empty
components list.

If the possible causes include items such as brake rotors,
brake pads, brake calipers, wheel bearings, tie rods,
control arms, or other physical vehicle components, include
the corresponding justified entries in components.

Example relationship:

Possible cause:
Warped brake rotors

Corresponding component suggestion:
component_key = brake_rotor
catalog_key = brake-rotors
hotspot_key = front_brakes

Possible cause:
Uneven brake pad wear

Corresponding component suggestion:
component_key = brake_pad
catalog_key = brake-pads
hotspot_key = front_brakes

Possible cause:
Sticking brake caliper

Corresponding component suggestion:
component_key = brake_caliper
catalog_key = brake-calipers
hotspot_key = front_brakes

These are semantic component suggestions only.

They are NOT claims that any marketplace product is
compatible with the selected vehicle.

If you cannot provide at least one justified component,
return response_type="follow_up" instead.

STRUCTURED OUTPUT RULE

Every top-level field required by the supplied JSON schema
must be present in the JSON response.

Always return data matching the supplied JSON schema exactly.

Do not add commentary outside the structured JSON response.
""".strip()

    # ========================================================
    # EXTRACT OLLAMA CONTENT
    # ========================================================

    @staticmethod
    def _extract_content(
        payload: Any,
    ) -> str:
        if not isinstance(
            payload,
            dict,
        ):
            raise (
                AIMechanicEngineError(
                    "AI Mechanic returned "
                    "an invalid response."
                )
            )

        message = (
            payload.get(
                "message"
            )
        )

        if not isinstance(
            message,
            dict,
        ):
            raise (
                AIMechanicEngineError(
                    "AI Mechanic response "
                    "did not contain a message."
                )
            )

        content = (
            message.get(
                "content"
            )
        )

        if not isinstance(
            content,
            str,
        ):
            raise (
                AIMechanicEngineError(
                    "AI Mechanic response "
                    "did not contain valid content."
                )
            )

        content = (
            content.strip()
        )

        if not content:
            raise (
                AIMechanicEngineError(
                    "AI Mechanic returned "
                    "an empty response."
                )
            )

        return content

    # ========================================================
    # PARSE STRUCTURED TURN
    # ========================================================

    @staticmethod
    def _parse_turn(
        content: str,
    ) -> AIMechanicTurn:
        raw = (
            json.loads(
                content
            )
        )

        return (
            AIMechanicTurn
            .model_validate(
                raw
            )
        )

    # ========================================================
    # HARDENED STRUCTURED OUTPUT SCHEMA
    # ========================================================

    @staticmethod
    def _build_output_schema(
        *,
        require_components: bool = False,
    ) -> dict:
        # Create an independent copy because this schema will
        # be modified before being sent to Ollama.
        schema = deepcopy(
            AIMechanicTurn
            .model_json_schema()
        )

        properties = (
            schema.get(
                "properties",
                {}
            )
        )

        if not isinstance(
            properties,
            dict,
        ):
            return schema

        # ----------------------------------------------------
        # FORCE ALL TOP-LEVEL FIELDS TO BE GENERATED
        # ----------------------------------------------------
        #
        # Pydantic fields such as components and possible_causes
        # may have defaults.
        #
        # This means they can be valid Python/Pydantic fields
        # while not appearing in JSON Schema's required list.
        #
        # For the LLM we want every field to be explicit.

        schema[
            "required"
        ] = list(
            properties.keys()
        )

        # Remove defaults so the structured-output grammar does
        # not encourage omission of those fields.
        for field_schema in (
            properties.values()
        ):
            if not isinstance(
                field_schema,
                dict,
            ):
                continue

            field_schema.pop(
                "default",
                None,
            )

        # ----------------------------------------------------
        # HARDEN ANALYSIS REPAIR
        # ----------------------------------------------------
        #
        # When an invalid response attempted to return
        # response_type="analysis", the repair request must
        # produce at least one component and one possible cause.

        if require_components:
            components_schema = (
                properties.get(
                    "components"
                )
            )

            if isinstance(
                components_schema,
                dict,
            ):
                components_schema[
                    "minItems"
                ] = 1

            possible_causes_schema = (
                properties.get(
                    "possible_causes"
                )
            )

            if isinstance(
                possible_causes_schema,
                dict,
            ):
                possible_causes_schema[
                    "minItems"
                ] = 1

        return schema