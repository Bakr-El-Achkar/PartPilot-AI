from app.core.ai_component_registry import (
    AI_COMPONENT_REGISTRY,
    get_component_definition,
    is_registered_component,
)


def test_registry_contains_brake_rotor():
    component = (
        get_component_definition(
            "brake_rotor"
        )
    )

    assert component is not None

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


def test_registry_normalizes_component_key():
    component = (
        get_component_definition(
            "  BRAKE_PAD  "
        )
    )

    assert component is not None

    assert (
        component.component_key
        == "brake_pad"
    )


def test_unknown_component_is_rejected():
    component = (
        get_component_definition(
            "qwen_invented_part"
        )
    )

    assert component is None


def test_blank_component_is_rejected():
    assert (
        get_component_definition(
            "   "
        )
        is None
    )


def test_registered_component_helper():
    assert (
        is_registered_component(
            "battery"
        )
        is True
    )

    assert (
        is_registered_component(
            "fake_component"
        )
        is False
    )


def test_every_registry_key_matches_definition():
    for (
        key,
        component,
    ) in AI_COMPONENT_REGISTRY.items():
        assert (
            key
            == component.component_key
        )


def test_required_component_fields_are_not_blank():
    for component in (
        AI_COMPONENT_REGISTRY.values()
    ):
        assert component.component_key
        assert component.label
        assert component.catalog_key
        assert component.hotspot_key
