import sys
from pathlib import Path

# Allows:
# python scripts/seed_catalog.py
BACKEND_ROOT = Path(__file__).resolve().parents[1]

if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(
        0,
        str(BACKEND_ROOT),
    )

from app.schemas.catalog import (
    BrandCreate,
    CategoryCreate,
    SubcategoryInput,
)
from app.services.catalog_service import (
    CatalogAlreadyExistsError,
    brand_service,
    category_service,
)


CATEGORIES = [
    {
        "name": "Engine",
        "description": (
            "Internal engine, ignition, "
            "timing and engine-mounted components."
        ),
        "icon": "engine",
        "subcategories": [
            "Air Filters",
            "Oil Filters",
            "Spark Plugs",
            "Ignition Coils",
            "Engine Mounts",
            "Timing Belts",
            "Timing Chains",
            "Serpentine Belts",
            "Belt Tensioners",
            "Pulleys",
            "Gaskets & Seals",
            "Valve Cover Gaskets",
            "Head Gaskets",
            "Pistons & Rings",
            "Crankshafts",
            "Camshafts",
            "Engine Bearings",
            "Oil Pumps",
            "Oil Pans",
            "PCV Valves",
            "Engine Sensors",
            "Turbochargers",
            "Superchargers",
        ],
    },
    {
        "name": "Brakes",
        "description": (
            "Brake system components for "
            "stopping, control and ABS."
        ),
        "icon": "disc-3",
        "subcategories": [
            "Brake Pads",
            "Brake Rotors",
            "Brake Calipers",
            "Brake Drums",
            "Brake Shoes",
            "Master Cylinders",
            "Wheel Cylinders",
            "Brake Hoses",
            "Brake Lines",
            "Parking Brake Components",
            "ABS Sensors",
            "ABS Modules",
            "Brake Boosters",
            "Brake Hardware Kits",
        ],
    },
    {
        "name": "Suspension",
        "description": (
            "Ride-control, suspension "
            "and wheel-support components."
        ),
        "icon": "move-vertical",
        "subcategories": [
            "Shock Absorbers",
            "Struts",
            "Coil Springs",
            "Control Arms",
            "Ball Joints",
            "Sway Bars",
            "Sway Bar Links",
            "Suspension Bushings",
            "Wheel Bearings",
            "Wheel Hubs",
            "Strut Mounts",
            "Air Suspension",
            "Leaf Springs",
        ],
    },
    {
        "name": "Steering",
        "description": (
            "Mechanical and powered "
            "steering system components."
        ),
        "icon": "circle-dot",
        "subcategories": [
            "Inner Tie Rods",
            "Outer Tie Rods",
            "Steering Racks",
            "Power Steering Pumps",
            "Steering Columns",
            "Steering Knuckles",
            "Steering Gear Boxes",
            "Power Steering Hoses",
            "Steering U-Joints",
            "Electric Steering Components",
        ],
    },
    {
        "name": "Transmission & Drivetrain",
        "description": (
            "Transmission, clutch, axle "
            "and drivetrain components."
        ),
        "icon": "settings",
        "subcategories": [
            "Transmission Filters",
            "Transmission Pans",
            "Transmission Mounts",
            "Clutch Kits",
            "Clutch Discs",
            "Pressure Plates",
            "Flywheels",
            "CV Axles",
            "CV Joints",
            "Drive Shafts",
            "U-Joints",
            "Differentials",
            "Transfer Cases",
            "Transmission Seals",
            "Shift Cables",
        ],
    },
    {
        "name": "Cooling & Heating",
        "description": (
            "Engine temperature control "
            "and cabin heating components."
        ),
        "icon": "thermometer",
        "subcategories": [
            "Radiators",
            "Water Pumps",
            "Thermostats",
            "Radiator Hoses",
            "Cooling Fans",
            "Fan Clutches",
            "Coolant Reservoirs",
            "Radiator Caps",
            "Heater Cores",
            "Coolant Temperature Sensors",
            "Thermostat Housings",
        ],
    },
    {
        "name": "Electrical & Charging",
        "description": (
            "Starting, charging and "
            "vehicle electrical components."
        ),
        "icon": "zap",
        "subcategories": [
            "Batteries",
            "Alternators",
            "Starters",
            "Starter Solenoids",
            "Fuses",
            "Relays",
            "Wiring Harnesses",
            "Battery Cables",
            "Switches",
            "Horns",
            "Control Modules",
            "Voltage Regulators",
        ],
    },
    {
        "name": "Fuel & Air Intake",
        "description": (
            "Fuel delivery, injection "
            "and air-intake components."
        ),
        "icon": "fuel",
        "subcategories": [
            "Fuel Pumps",
            "Fuel Injectors",
            "Fuel Filters",
            "Fuel Pressure Regulators",
            "Fuel Rails",
            "Throttle Bodies",
            "Mass Air Flow Sensors",
            "MAP Sensors",
            "Intake Manifolds",
            "Air Intake Kits",
            "Throttle Position Sensors",
            "EVAP Components",
        ],
    },
    {
        "name": "Exhaust & Emissions",
        "description": (
            "Exhaust flow and emissions "
            "control components."
        ),
        "icon": "wind",
        "subcategories": [
            "Catalytic Converters",
            "Mufflers",
            "Resonators",
            "Exhaust Pipes",
            "Exhaust Manifolds",
            "Oxygen Sensors",
            "EGR Valves",
            "Exhaust Gaskets",
            "Exhaust Hangers",
            "DPF Components",
            "Emission Sensors",
        ],
    },
    {
        "name": "HVAC & Climate Control",
        "description": (
            "Air-conditioning, ventilation "
            "and climate-control components."
        ),
        "icon": "snowflake",
        "subcategories": [
            "AC Compressors",
            "AC Condensers",
            "AC Evaporators",
            "Blower Motors",
            "Cabin Air Filters",
            "Expansion Valves",
            "Receiver Driers",
            "AC Hoses",
            "HVAC Actuators",
            "Climate Control Modules",
            "Heater Blower Resistors",
        ],
    },
    {
        "name": "Lighting",
        "description": (
            "Exterior and interior "
            "automotive lighting."
        ),
        "icon": "lightbulb",
        "subcategories": [
            "Headlights",
            "Headlight Bulbs",
            "Tail Lights",
            "Brake Light Bulbs",
            "Fog Lights",
            "Turn Signals",
            "Side Markers",
            "License Plate Lights",
            "Interior Lights",
            "LED Bulbs",
            "Lighting Ballasts",
        ],
    },
    {
        "name": "Body & Exterior",
        "description": (
            "Exterior body, glass and "
            "weather-protection components."
        ),
        "icon": "car-front",
        "subcategories": [
            "Side Mirrors",
            "Bumpers",
            "Bumper Covers",
            "Fenders",
            "Hoods",
            "Grilles",
            "Door Handles",
            "Weatherstripping",
            "Windshield Wipers",
            "Wiper Motors",
            "Washer Pumps",
            "Lift Supports",
            "Splash Shields",
            "Mud Guards",
        ],
    },
    {
        "name": "Interior & Controls",
        "description": (
            "Cabin hardware, switches "
            "and driver-control components."
        ),
        "icon": "layout-dashboard",
        "subcategories": [
            "Window Regulators",
            "Window Motors",
            "Door Lock Actuators",
            "Interior Switches",
            "Pedal Components",
            "Gauge Components",
            "Seat Components",
            "Console Components",
            "Interior Handles",
            "Floor Mats",
            "Cabin Accessories",
        ],
    },
    {
        "name": "Wheels & Tires",
        "description": (
            "Wheel, tire and tire-monitoring "
            "components."
        ),
        "icon": "circle",
        "subcategories": [
            "Tires",
            "Wheels",
            "Wheel Covers",
            "Center Caps",
            "Lug Nuts",
            "Wheel Studs",
            "TPMS Sensors",
            "Valve Stems",
            "Wheel Locks",
        ],
    },
    {
        "name": "Fluids & Maintenance",
        "description": (
            "Routine service fluids, "
            "filters and maintenance supplies."
        ),
        "icon": "droplets",
        "subcategories": [
            "Engine Oil",
            "Transmission Fluid",
            "Brake Fluid",
            "Coolant & Antifreeze",
            "Power Steering Fluid",
            "Gear Oil",
            "Fuel Additives",
            "Engine Cleaners",
            "Grease & Lubricants",
            "Washer Fluid",
            "Maintenance Kits",
        ],
    },
    {
        "name": "Sensors & Engine Management",
        "description": (
            "Electronic sensors and "
            "engine-management components."
        ),
        "icon": "cpu",
        "subcategories": [
            "Crankshaft Sensors",
            "Camshaft Sensors",
            "Knock Sensors",
            "Coolant Sensors",
            "Oil Pressure Sensors",
            "Vehicle Speed Sensors",
            "Throttle Sensors",
            "Oxygen Sensors",
            "MAF Sensors",
            "MAP Sensors",
            "ECU Components",
        ],
    },
]


BRANDS = [
    {
        "name": "Bosch",
        "country": "Germany",
        "description": (
            "Automotive electrical, braking, "
            "fuel and maintenance components."
        ),
    },
    {
        "name": "Brembo",
        "country": "Italy",
        "description": (
            "Performance and replacement "
            "braking components."
        ),
    },
    {
        "name": "NGK",
        "country": "Japan",
        "description": (
            "Ignition and engine-management "
            "components."
        ),
    },
    {
        "name": "Denso",
        "country": "Japan",
        "description": (
            "Electrical, ignition, HVAC "
            "and engine components."
        ),
    },
    {
        "name": "ACDelco",
        "country": "United States",
        "description": (
            "Automotive replacement and "
            "maintenance parts."
        ),
    },
    {
        "name": "Delphi",
        "country": "United Kingdom",
        "description": (
            "Fuel, steering, electronics "
            "and chassis components."
        ),
    },
    {
        "name": "Gates",
        "country": "United States",
        "description": (
            "Belts, hoses and power "
            "transmission products."
        ),
    },
    {
        "name": "Monroe",
        "country": "United States",
        "description": (
            "Shock absorbers, struts "
            "and ride-control products."
        ),
    },
    {
        "name": "KYB",
        "country": "Japan",
        "description": (
            "Suspension and ride-control "
            "components."
        ),
    },
    {
        "name": "MOOG",
        "country": "United States",
        "description": (
            "Steering and suspension "
            "replacement components."
        ),
    },
    {
        "name": "SKF",
        "country": "Sweden",
        "description": (
            "Bearings, hubs and rotating "
            "automotive components."
        ),
    },
    {
        "name": "Timken",
        "country": "United States",
        "description": (
            "Wheel bearings, hubs "
            "and drivetrain components."
        ),
    },
    {
        "name": "MANN-FILTER",
        "country": "Germany",
        "description": (
            "Air, oil, fuel and cabin "
            "filtration products."
        ),
    },
    {
        "name": "MAHLE",
        "country": "Germany",
        "description": (
            "Engine, filtration and "
            "thermal-management components."
        ),
    },
    {
        "name": "Continental",
        "country": "Germany",
        "description": (
            "Belts, tires, electronics "
            "and automotive systems."
        ),
    },
    {
        "name": "Mobil 1",
        "country": "United States",
        "description": (
            "Synthetic lubricants and "
            "automotive maintenance products."
        ),
    },
    {
        "name": "Castrol",
        "country": "United Kingdom",
        "description": (
            "Engine oils and automotive "
            "lubricants."
        ),
    },
    {
        "name": "Valvoline",
        "country": "United States",
        "description": (
            "Automotive lubricants "
            "and maintenance fluids."
        ),
    },
    {
        "name": "Philips",
        "country": "Netherlands",
        "description": (
            "Automotive lighting "
            "and electrical products."
        ),
    },
    {
        "name": "OSRAM",
        "country": "Germany",
        "description": (
            "Automotive lighting "
            "products."
        ),
    },
]


def seed_catalog(
    *,
    category_service_instance=category_service,
    brand_service_instance=brand_service,
) -> dict:
    result = {
        "categories_created": 0,
        "categories_skipped": 0,
        "brands_created": 0,
        "brands_skipped": 0,
    }

    for category_data in CATEGORIES:
        payload = CategoryCreate(
            name=category_data["name"],
            description=category_data[
                "description"
            ],
            icon=category_data["icon"],
            subcategories=[
                SubcategoryInput(
                    name=name
                )
                for name in category_data[
                    "subcategories"
                ]
            ],
        )

        try:
            category_service_instance.create_category(
                payload
            )

            result[
                "categories_created"
            ] += 1

        except CatalogAlreadyExistsError:
            result[
                "categories_skipped"
            ] += 1

    for brand_data in BRANDS:
        payload = BrandCreate(
            name=brand_data["name"],
            country=brand_data[
                "country"
            ],
            description=brand_data[
                "description"
            ],
        )

        try:
            brand_service_instance.create_brand(
                payload
            )

            result[
                "brands_created"
            ] += 1

        except CatalogAlreadyExistsError:
            result[
                "brands_skipped"
            ] += 1

    return result


def main():
    print()
    print(
        "======================================"
    )
    print(
        "        PartPilot Catalog Seed"
    )
    print(
        "======================================"
    )
    print()

    result = seed_catalog()

    print(
        f"Categories created : "
        f"{result['categories_created']}"
    )

    print(
        f"Categories skipped : "
        f"{result['categories_skipped']}"
    )

    print(
        f"Brands created     : "
        f"{result['brands_created']}"
    )

    print(
        f"Brands skipped     : "
        f"{result['brands_skipped']}"
    )

    print()
    print(
        "Catalog foundation ready."
    )
    print()


if __name__ == "__main__":
    main()