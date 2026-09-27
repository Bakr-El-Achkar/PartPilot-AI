from dataclasses import dataclass


# ============================================================
# COMPONENT DEFINITION
# ============================================================

@dataclass(
    frozen=True,
    slots=True,
)
class AIComponentDefinition:
    component_key: str
    label: str
    catalog_key: str
    hotspot_key: str


# ============================================================
# SERVER-OWNED COMPONENT REGISTRY
# ============================================================

AI_COMPONENT_REGISTRY: dict[
    str,
    AIComponentDefinition,
] = {
    "brake_rotor": AIComponentDefinition(
        component_key="brake_rotor",
        label="Brake Rotors",
        catalog_key="brake-rotors",
        hotspot_key="front_brakes",
    ),

    "brake_pad": AIComponentDefinition(
        component_key="brake_pad",
        label="Brake Pads",
        catalog_key="brake-pads",
        hotspot_key="front_brakes",
    ),

    "brake_caliper": AIComponentDefinition(
        component_key="brake_caliper",
        label="Brake Calipers",
        catalog_key="brake-calipers",
        hotspot_key="front_brakes",
    ),

    "control_arm": AIComponentDefinition(
        component_key="control_arm",
        label="Control Arms",
        catalog_key="control-arms",
        hotspot_key="front_suspension",
    ),

    "tie_rod": AIComponentDefinition(
        component_key="tie_rod",
        label="Tie Rods",
        catalog_key="tie-rods",
        hotspot_key="steering_system",
    ),

    "wheel_bearing": AIComponentDefinition(
        component_key="wheel_bearing",
        label="Wheel Bearings",
        catalog_key="wheel-bearings",
        hotspot_key="front_suspension",
    ),

    "spark_plug": AIComponentDefinition(
        component_key="spark_plug",
        label="Spark Plugs",
        catalog_key="spark-plugs",
        hotspot_key="engine_bay",
    ),

    "ignition_coil": AIComponentDefinition(
        component_key="ignition_coil",
        label="Ignition Coils",
        catalog_key="ignition-coils",
        hotspot_key="engine_bay",
    ),

    "battery": AIComponentDefinition(
        component_key="battery",
        label="Battery",
        catalog_key="batteries",
        hotspot_key="battery_area",
    ),

    "alternator": AIComponentDefinition(
        component_key="alternator",
        label="Alternator",
        catalog_key="alternators",
        hotspot_key="engine_front",
    ),

    "radiator": AIComponentDefinition(
        component_key="radiator",
        label="Radiator",
        catalog_key="radiators",
        hotspot_key="cooling_system",
    ),

    "water_pump": AIComponentDefinition(
        component_key="water_pump",
        label="Water Pump",
        catalog_key="water-pumps",
        hotspot_key="cooling_system",
    ),
}


# ============================================================
# LOOKUP
# ============================================================

def get_component_definition(
    component_key: str,
) -> AIComponentDefinition | None:
    normalized_key = (
        component_key
        .strip()
        .lower()
    )

    if not normalized_key:
        return None

    return AI_COMPONENT_REGISTRY.get(
        normalized_key
    )


def is_registered_component(
    component_key: str,
) -> bool:
    return (
        get_component_definition(
            component_key
        )
        is not None
    )
