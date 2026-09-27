import sys
from pathlib import Path

from pydantic import ValidationError


BACKEND_ROOT = (
    Path(__file__)
    .resolve()
    .parents[1]
)

if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(
        0,
        str(BACKEND_ROOT),
    )


from app.repositories.catalog_repository import (
    brand_repository,
    category_repository,
)
from app.schemas.catalog import (
    ProductCreate,
)
from app.services.product_service import (
    ProductAlreadyExistsError,
    ProductReferenceError,
    ProductValidationError,
    product_service,
)


TOTAL_PRODUCT_COUNT = 500


BRAND_NAMES = {
    "bosch": "Bosch",
    "brembo": "Brembo",
    "ngk": "NGK",
    "denso": "Denso",
    "acdelco": "ACDelco",
    "delphi": "Delphi",
    "gates": "Gates",
    "monroe": "Monroe",
    "kyb": "KYB",
    "moog": "MOOG",
    "skf": "SKF",
    "timken": "Timken",
    "mann-filter": "MANN-FILTER",
    "mahle": "MAHLE",
    "continental": "Continental",
    "mobil-1": "Mobil 1",
    "castrol": "Castrol",
    "valvoline": "Valvoline",
    "philips": "Philips",
    "osram": "OSRAM",
}


CATEGORY_BLUEPRINTS = [
    {
        "category_slug": "engine",
        "brands": [
            "bosch",
            "ngk",
            "denso",
            "gates",
            "mann-filter",
            "mahle",
        ],
        "parts": [
            (
                "air-filters",
                "Engine Air Filter",
            ),
            (
                "oil-filters",
                "Oil Filter",
            ),
            (
                "spark-plugs",
                "Spark Plug",
            ),
            (
                "ignition-coils",
                "Ignition Coil",
            ),
            (
                "serpentine-belts",
                "Serpentine Belt",
            ),
            (
                "belt-tensioners",
                "Belt Tensioner",
            ),
            (
                "engine-mounts",
                "Engine Mount",
            ),
            (
                "engine-sensors",
                "Engine Sensor",
            ),
        ],
    },
    {
        "category_slug": "brakes",
        "brands": [
            "bosch",
            "brembo",
            "acdelco",
            "delphi",
        ],
        "parts": [
            (
                "brake-pads",
                "Brake Pad Set",
            ),
            (
                "brake-rotors",
                "Brake Rotor",
            ),
            (
                "brake-calipers",
                "Brake Caliper",
            ),
            (
                "brake-hoses",
                "Brake Hose",
            ),
            (
                "abs-sensors",
                "ABS Sensor",
            ),
            (
                "master-cylinders",
                "Brake Master Cylinder",
            ),
        ],
    },
    {
        "category_slug": "suspension",
        "brands": [
            "monroe",
            "kyb",
            "moog",
            "skf",
            "timken",
        ],
        "parts": [
            (
                "shock-absorbers",
                "Shock Absorber",
            ),
            (
                "struts",
                "Suspension Strut",
            ),
            (
                "control-arms",
                "Control Arm",
            ),
            (
                "ball-joints",
                "Ball Joint",
            ),
            (
                "sway-bar-links",
                "Sway Bar Link",
            ),
            (
                "wheel-hubs",
                "Wheel Hub Assembly",
            ),
        ],
    },
    {
        "category_slug": "steering",
        "brands": [
            "moog",
            "delphi",
            "acdelco",
            "bosch",
        ],
        "parts": [
            (
                "inner-tie-rods",
                "Inner Tie Rod",
            ),
            (
                "outer-tie-rods",
                "Outer Tie Rod",
            ),
            (
                "steering-racks",
                "Steering Rack",
            ),
            (
                "power-steering-pumps",
                "Power Steering Pump",
            ),
            (
                "power-steering-hoses",
                "Power Steering Hose",
            ),
        ],
    },
    {
        "category_slug": (
            "transmission-drivetrain"
        ),
        "brands": [
            "acdelco",
            "skf",
            "timken",
            "gates",
            "valvoline",
        ],
        "parts": [
            (
                "transmission-filters",
                "Transmission Filter",
            ),
            (
                "transmission-mounts",
                "Transmission Mount",
            ),
            (
                "clutch-kits",
                "Clutch Kit",
            ),
            (
                "cv-axles",
                "CV Axle",
            ),
            (
                "u-joints",
                "Universal Joint",
            ),
            (
                "drive-shafts",
                "Drive Shaft",
            ),
        ],
    },
    {
        "category_slug": (
            "cooling-heating"
        ),
        "brands": [
            "denso",
            "gates",
            "mahle",
            "continental",
            "acdelco",
        ],
        "parts": [
            (
                "radiators",
                "Radiator",
            ),
            (
                "water-pumps",
                "Water Pump",
            ),
            (
                "thermostats",
                "Thermostat",
            ),
            (
                "radiator-hoses",
                "Radiator Hose",
            ),
            (
                "cooling-fans",
                "Cooling Fan",
            ),
            (
                "heater-cores",
                "Heater Core",
            ),
        ],
    },
    {
        "category_slug": (
            "electrical-charging"
        ),
        "brands": [
            "bosch",
            "denso",
            "acdelco",
            "delphi",
        ],
        "parts": [
            (
                "alternators",
                "Alternator",
            ),
            (
                "starters",
                "Starter Motor",
            ),
            (
                "relays",
                "Automotive Relay",
            ),
            (
                "battery-cables",
                "Battery Cable",
            ),
            (
                "switches",
                "Electrical Switch",
            ),
            (
                "control-modules",
                "Control Module",
            ),
        ],
    },
    {
        "category_slug": (
            "fuel-air-intake"
        ),
        "brands": [
            "bosch",
            "denso",
            "delphi",
            "mann-filter",
            "mahle",
        ],
        "parts": [
            (
                "fuel-pumps",
                "Fuel Pump",
            ),
            (
                "fuel-injectors",
                "Fuel Injector",
            ),
            (
                "fuel-filters",
                "Fuel Filter",
            ),
            (
                "mass-air-flow-sensors",
                "Mass Air Flow Sensor",
            ),
            (
                "throttle-bodies",
                "Throttle Body",
            ),
            (
                "map-sensors",
                "MAP Sensor",
            ),
        ],
    },
    {
        "category_slug": (
            "exhaust-emissions"
        ),
        "brands": [
            "bosch",
            "denso",
            "mahle",
            "delphi",
        ],
        "parts": [
            (
                "oxygen-sensors",
                "Oxygen Sensor",
            ),
            (
                "egr-valves",
                "EGR Valve",
            ),
            (
                "exhaust-gaskets",
                "Exhaust Gasket",
            ),
            (
                "catalytic-converters",
                "Catalytic Converter",
            ),
            (
                "mufflers",
                "Muffler",
            ),
            (
                "exhaust-hangers",
                "Exhaust Hanger",
            ),
        ],
    },
    {
        "category_slug": (
            "hvac-climate-control"
        ),
        "brands": [
            "denso",
            "mahle",
            "mann-filter",
            "acdelco",
            "bosch",
        ],
        "parts": [
            (
                "ac-compressors",
                "AC Compressor",
            ),
            (
                "ac-condensers",
                "AC Condenser",
            ),
            (
                "blower-motors",
                "Blower Motor",
            ),
            (
                "cabin-air-filters",
                "Cabin Air Filter",
            ),
            (
                "hvac-actuators",
                "HVAC Actuator",
            ),
        ],
    },
    {
        "category_slug": "lighting",
        "brands": [
            "philips",
            "osram",
            "bosch",
            "acdelco",
        ],
        "parts": [
            (
                "headlight-bulbs",
                "Headlight Bulb",
            ),
            (
                "fog-lights",
                "Fog Light",
            ),
            (
                "brake-light-bulbs",
                "Brake Light Bulb",
            ),
            (
                "led-bulbs",
                "LED Bulb",
            ),
            (
                "tail-lights",
                "Tail Light",
            ),
        ],
    },
    {
        "category_slug": (
            "body-exterior"
        ),
        "brands": [
            "bosch",
            "acdelco",
            "denso",
            "continental",
        ],
        "parts": [
            (
                "windshield-wipers",
                "Wiper Blade",
            ),
            (
                "washer-pumps",
                "Washer Pump",
            ),
            (
                "wiper-motors",
                "Wiper Motor",
            ),
            (
                "side-mirrors",
                "Side Mirror",
            ),
            (
                "door-handles",
                "Exterior Door Handle",
            ),
            (
                "lift-supports",
                "Lift Support",
            ),
        ],
    },
    {
        "category_slug": (
            "interior-controls"
        ),
        "brands": [
            "acdelco",
            "bosch",
            "denso",
            "delphi",
        ],
        "parts": [
            (
                "window-regulators",
                "Window Regulator",
            ),
            (
                "window-motors",
                "Window Motor",
            ),
            (
                "door-lock-actuators",
                "Door Lock Actuator",
            ),
            (
                "interior-switches",
                "Interior Switch",
            ),
            (
                "seat-components",
                "Seat Component",
            ),
            (
                "floor-mats",
                "Floor Mat Set",
            ),
        ],
    },
    {
        "category_slug": (
            "wheels-tires"
        ),
        "brands": [
            "continental",
            "timken",
            "moog",
            "acdelco",
            "skf",
        ],
        "parts": [
            (
                "tires",
                "All-Season Tire",
            ),
            (
                "lug-nuts",
                "Lug Nut Set",
            ),
            (
                "wheel-studs",
                "Wheel Stud",
            ),
            (
                "tpms-sensors",
                "TPMS Sensor",
            ),
            (
                "wheel-locks",
                "Wheel Lock Set",
            ),
        ],
    },
    {
        "category_slug": (
            "fluids-maintenance"
        ),
        "brands": [
            "mobil-1",
            "castrol",
            "valvoline",
            "bosch",
            "acdelco",
        ],
        "parts": [
            (
                "engine-oil",
                "Synthetic Engine Oil",
            ),
            (
                "transmission-fluid",
                "Transmission Fluid",
            ),
            (
                "brake-fluid",
                "Brake Fluid",
            ),
            (
                "coolant-antifreeze",
                "Coolant",
            ),
            (
                "power-steering-fluid",
                "Power Steering Fluid",
            ),
            (
                "maintenance-kits",
                "Maintenance Kit",
            ),
        ],
    },
    {
        "category_slug": (
            "sensors-engine-management"
        ),
        "brands": [
            "bosch",
            "denso",
            "delphi",
            "acdelco",
        ],
        "parts": [
            (
                "crankshaft-sensors",
                "Crankshaft Position Sensor",
            ),
            (
                "camshaft-sensors",
                "Camshaft Position Sensor",
            ),
            (
                "knock-sensors",
                "Knock Sensor",
            ),
            (
                "coolant-sensors",
                "Coolant Sensor",
            ),
            (
                "oil-pressure-sensors",
                "Oil Pressure Sensor",
            ),
            (
                "vehicle-speed-sensors",
                "Vehicle Speed Sensor",
            ),
        ],
    },
]


# These are the SKUs used by the previous
# PartPilot seed. Keeping them here means an
# existing database will SKIP them instead of
# creating another duplicate catalog beside them.
LEGACY_PRODUCT_SPECS = [
    # Brakes
    (
        "BOSCH-BRK-001",
        "bosch",
        "brakes",
        "brake-pads",
        "Bosch Premium Ceramic Brake Pads",
    ),
    (
        "BREMBO-BRK-001",
        "brembo",
        "brakes",
        "brake-rotors",
        "Brembo Premium Brake Rotor",
    ),
    (
        "ACDELCO-BRK-001",
        "acdelco",
        "brakes",
        "brake-calipers",
        "ACDelco Brake Caliper",
    ),
    (
        "BOSCH-BRK-002",
        "bosch",
        "brakes",
        "abs-sensors",
        "Bosch ABS Wheel Speed Sensor",
    ),

    # Engine
    (
        "NGK-ENG-001",
        "ngk",
        "engine",
        "spark-plugs",
        "NGK Iridium Spark Plug",
    ),
    (
        "MANN-ENG-001",
        "mann-filter",
        "engine",
        "oil-filters",
        "MANN-FILTER Oil Filter",
    ),
    (
        "DENSO-ENG-001",
        "denso",
        "engine",
        "ignition-coils",
        "Denso Ignition Coil",
    ),
    (
        "GATES-ENG-001",
        "gates",
        "engine",
        "serpentine-belts",
        "Gates Serpentine Belt",
    ),

    # Suspension
    (
        "MONROE-SUS-001",
        "monroe",
        "suspension",
        "shock-absorbers",
        "Monroe Shock Absorber",
    ),
    (
        "KYB-SUS-001",
        "kyb",
        "suspension",
        "struts",
        "KYB Gas Strut",
    ),
    (
        "MOOG-SUS-001",
        "moog",
        "suspension",
        "control-arms",
        "MOOG Control Arm",
    ),
    (
        "SKF-SUS-001",
        "skf",
        "suspension",
        "wheel-hubs",
        "SKF Wheel Hub Assembly",
    ),

    # Steering
    (
        "MOOG-STR-001",
        "moog",
        "steering",
        "outer-tie-rods",
        "MOOG Outer Tie Rod",
    ),
    (
        "DELPHI-STR-001",
        "delphi",
        "steering",
        "inner-tie-rods",
        "Delphi Inner Tie Rod",
    ),
    (
        "ACDELCO-STR-001",
        "acdelco",
        "steering",
        "power-steering-pumps",
        "ACDelco Power Steering Pump",
    ),
    (
        "DELPHI-STR-002",
        "delphi",
        "steering",
        "power-steering-hoses",
        "Delphi Power Steering Hose",
    ),

    # Transmission
    (
        "ACDELCO-TRN-001",
        "acdelco",
        "transmission-drivetrain",
        "transmission-filters",
        "ACDelco Transmission Filter",
    ),
    (
        "SKF-TRN-001",
        "skf",
        "transmission-drivetrain",
        "cv-axles",
        "SKF CV Axle",
    ),
    (
        "TIMKEN-TRN-001",
        "timken",
        "transmission-drivetrain",
        "u-joints",
        "Timken Universal Joint",
    ),
    (
        "GATES-TRN-001",
        "gates",
        "transmission-drivetrain",
        "transmission-mounts",
        "Gates Transmission Mount",
    ),

    # Cooling
    (
        "DENSO-CLG-001",
        "denso",
        "cooling-heating",
        "radiators",
        "Denso Radiator",
    ),
    (
        "GATES-CLG-001",
        "gates",
        "cooling-heating",
        "water-pumps",
        "Gates Water Pump",
    ),
    (
        "MAHLE-CLG-001",
        "mahle",
        "cooling-heating",
        "thermostats",
        "MAHLE Thermostat",
    ),
    (
        "CONTINENTAL-CLG-001",
        "continental",
        "cooling-heating",
        "radiator-hoses",
        "Continental Radiator Hose",
    ),

    # Electrical
    (
        "BOSCH-ELC-001",
        "bosch",
        "electrical-charging",
        "alternators",
        "Bosch Alternator",
    ),
    (
        "DENSO-ELC-001",
        "denso",
        "electrical-charging",
        "starters",
        "Denso Starter Motor",
    ),
    (
        "ACDELCO-ELC-001",
        "acdelco",
        "electrical-charging",
        "battery-cables",
        "ACDelco Battery Cable",
    ),
    (
        "BOSCH-ELC-002",
        "bosch",
        "electrical-charging",
        "relays",
        "Bosch Automotive Relay",
    ),

    # Fuel / Intake
    (
        "DELPHI-FUL-001",
        "delphi",
        "fuel-air-intake",
        "fuel-pumps",
        "Delphi Fuel Pump",
    ),
    (
        "BOSCH-FUL-001",
        "bosch",
        "fuel-air-intake",
        "fuel-injectors",
        "Bosch Fuel Injector",
    ),
    (
        "DENSO-FUL-001",
        "denso",
        "fuel-air-intake",
        "mass-air-flow-sensors",
        "Denso Mass Air Flow Sensor",
    ),
    (
        "MANN-FUL-001",
        "mann-filter",
        "fuel-air-intake",
        "air-intake-kits",
        "MANN-FILTER Air Intake Filter",
    ),

    # Exhaust
    (
        "BOSCH-EXH-001",
        "bosch",
        "exhaust-emissions",
        "oxygen-sensors",
        "Bosch Oxygen Sensor",
    ),
    (
        "DENSO-EXH-001",
        "denso",
        "exhaust-emissions",
        "oxygen-sensors",
        "Denso Oxygen Sensor",
    ),
    (
        "BOSCH-EXH-002",
        "bosch",
        "exhaust-emissions",
        "egr-valves",
        "Bosch EGR Valve",
    ),
    (
        "MAHLE-EXH-001",
        "mahle",
        "exhaust-emissions",
        "exhaust-gaskets",
        "MAHLE Exhaust Gasket",
    ),

    # HVAC
    (
        "DENSO-HVAC-001",
        "denso",
        "hvac-climate-control",
        "ac-compressors",
        "Denso AC Compressor",
    ),
    (
        "MAHLE-HVAC-001",
        "mahle",
        "hvac-climate-control",
        "ac-condensers",
        "MAHLE AC Condenser",
    ),
    (
        "MANN-HVAC-001",
        "mann-filter",
        "hvac-climate-control",
        "cabin-air-filters",
        "MANN-FILTER Cabin Air Filter",
    ),
    (
        "ACDELCO-HVAC-001",
        "acdelco",
        "hvac-climate-control",
        "blower-motors",
        "ACDelco Blower Motor",
    ),

    # Lighting
    (
        "PHILIPS-LGT-001",
        "philips",
        "lighting",
        "headlight-bulbs",
        "Philips Headlight Bulb",
    ),
    (
        "OSRAM-LGT-001",
        "osram",
        "lighting",
        "led-bulbs",
        "OSRAM LED Headlight Bulb",
    ),
    (
        "PHILIPS-LGT-002",
        "philips",
        "lighting",
        "fog-lights",
        "Philips Fog Light",
    ),
    (
        "OSRAM-LGT-002",
        "osram",
        "lighting",
        "brake-light-bulbs",
        "OSRAM Brake Light Bulb",
    ),

    # Body
    (
        "BOSCH-BDY-001",
        "bosch",
        "body-exterior",
        "windshield-wipers",
        "Bosch Wiper Blade",
    ),
    (
        "ACDELCO-BDY-001",
        "acdelco",
        "body-exterior",
        "washer-pumps",
        "ACDelco Washer Pump",
    ),
    (
        "DENSO-BDY-001",
        "denso",
        "body-exterior",
        "wiper-motors",
        "Denso Wiper Motor",
    ),
    (
        "ACDELCO-BDY-002",
        "acdelco",
        "body-exterior",
        "lift-supports",
        "ACDelco Lift Support",
    ),

    # Wheels
    (
        "CONTINENTAL-WHL-001",
        "continental",
        "wheels-tires",
        "tires",
        "Continental Touring Tire",
    ),
    (
        "ACDELCO-WHL-001",
        "acdelco",
        "wheels-tires",
        "tpms-sensors",
        "ACDelco TPMS Sensor",
    ),
    (
        "TIMKEN-WHL-001",
        "timken",
        "wheels-tires",
        "wheel-studs",
        "Timken Wheel Stud",
    ),
    (
        "MOOG-WHL-001",
        "moog",
        "wheels-tires",
        "lug-nuts",
        "MOOG Lug Nut Set",
    ),

    # Maintenance
    (
        "MOBIL1-MNT-001",
        "mobil-1",
        "fluids-maintenance",
        "engine-oil",
        "Mobil 1 Synthetic Engine Oil",
    ),
    (
        "CASTROL-MNT-001",
        "castrol",
        "fluids-maintenance",
        "engine-oil",
        "Castrol Synthetic Engine Oil",
    ),
    (
        "VALVOLINE-MNT-001",
        "valvoline",
        "fluids-maintenance",
        "transmission-fluid",
        "Valvoline Transmission Fluid",
    ),
    (
        "BOSCH-MNT-001",
        "bosch",
        "fluids-maintenance",
        "maintenance-kits",
        "Bosch Maintenance Kit",
    ),

    # Sensors
    (
        "BOSCH-SEN-001",
        "bosch",
        "sensors-engine-management",
        "crankshaft-sensors",
        "Bosch Crankshaft Sensor",
    ),
    (
        "DENSO-SEN-001",
        "denso",
        "sensors-engine-management",
        "camshaft-sensors",
        "Denso Camshaft Sensor",
    ),
    (
        "DELPHI-SEN-001",
        "delphi",
        "sensors-engine-management",
        "knock-sensors",
        "Delphi Knock Sensor",
    ),
    (
        "ACDELCO-SEN-001",
        "acdelco",
        "sensors-engine-management",
        "oil-pressure-sensors",
        "ACDelco Oil Pressure Sensor",
    ),
]


def _price_for(
    index: int,
) -> float:
    whole = (
        12
        + (
            index * 17
        )
        % 230
    )

    cents = [
        49,
        99,
        25,
        75,
    ][
        index % 4
    ]

    return float(
        f"{whole}.{cents:02d}"
    )


def _stock_for(
    index: int,
) -> int:
    return (
        8
        + (
            index * 11
        )
        % 93
    )


def _make_product(
    *,
    index: int,
    sku: str,
    brand_slug: str,
    category_slug: str,
    subcategory_slug: str,
    name: str,
) -> dict:
    price = _price_for(
        index
    )

    sale_price = None

    if index % 7 == 0:
        sale_price = round(
            price * 0.9,
            2,
        )

    return {
        "name": name,
        "sku": sku,
        "part_number": (
            f"PP-{index:05d}"
        ),
        "brand_slug": brand_slug,
        "category_slug": (
            category_slug
        ),
        "subcategory_slug": (
            subcategory_slug
        ),
        "description": (
            f"{name} from the PartPilot "
            f"demonstration automotive catalog. "
            f"Designed to demonstrate product "
            f"search, inventory, compatibility "
            f"and AI-assisted recommendations."
        ),
        "price": price,
        "sale_price": sale_price,
        "stock_quantity": (
            _stock_for(
                index
            )
        ),
        "images": [],
        "specifications": {
            "catalog_type": (
                "PartPilot Demo"
            ),
            "category": (
                category_slug
            ),
            "component": (
                subcategory_slug
            ),
            "inventory_class": (
                "Standard"
                if index % 4
                else "Premium"
            ),
        },
        "warranty": (
            "12 months"
            if index % 5
            else "24 months"
        ),
    }


def _build_legacy_products():
    products = []

    for index, (
        sku,
        brand_slug,
        category_slug,
        subcategory_slug,
        name,
    ) in enumerate(
        LEGACY_PRODUCT_SPECS,
        start=1,
    ):
        products.append(
            _make_product(
                index=index,
                sku=sku,
                brand_slug=(
                    brand_slug
                ),
                category_slug=(
                    category_slug
                ),
                subcategory_slug=(
                    subcategory_slug
                ),
                name=name,
            )
        )

    return products


def _build_generated_products(
    *,
    start_index: int,
    count: int,
):
    products = []

    variants = [
        "Premium",
        "Professional",
        "Performance",
        "OE-Style",
        "Advanced",
        "Standard",
        "Heavy Duty",
        "Select",
    ]

    for offset in range(
        count
    ):
        index = (
            start_index
            + offset
        )

        blueprint = (
            CATEGORY_BLUEPRINTS[
                offset
                % len(
                    CATEGORY_BLUEPRINTS
                )
            ]
        )

        part_index = (
            offset
            // len(
                CATEGORY_BLUEPRINTS
            )
        )

        part_slug, part_name = (
            blueprint["parts"][
                part_index
                % len(
                    blueprint[
                        "parts"
                    ]
                )
            ]
        )

        brand_slug = (
            blueprint["brands"][
                (
                    offset
                    + part_index
                )
                % len(
                    blueprint[
                        "brands"
                    ]
                )
            ]
        )

        brand_name = (
            BRAND_NAMES[
                brand_slug
            ]
        )

        variant = variants[
            offset
            % len(
                variants
            )
        ]

        name = (
            f"{brand_name} "
            f"{variant} "
            f"{part_name} "
            f"{index:03d}"
        )

        sku = (
            f"PP-GEN-"
            f"{index:04d}"
        )

        product = (
            _make_product(
                index=index,
                sku=sku,
                brand_slug=(
                    brand_slug
                ),
                category_slug=(
                    blueprint[
                        "category_slug"
                    ]
                ),
                subcategory_slug=(
                    part_slug
                ),
                name=name,
            )
        )

        products.append(
            product
        )

    return products


def build_products():
    legacy_products = (
        _build_legacy_products()
    )

    remaining = (
        TOTAL_PRODUCT_COUNT
        - len(
            legacy_products
        )
    )

    if remaining < 0:
        raise ValueError(
            "Legacy product count exceeds "
            "TOTAL_PRODUCT_COUNT"
        )

    generated_products = (
        _build_generated_products(
            start_index=(
                len(
                    legacy_products
                )
                + 1
            ),
            count=remaining,
        )
    )

    products = (
        legacy_products
        + generated_products
    )

    if (
        len(products)
        != TOTAL_PRODUCT_COUNT
    ):
        raise RuntimeError(
            "Product generator did not "
            "produce the requested total"
        )

    return products


PRODUCTS = build_products()


def seed_products(
    *,
    products=PRODUCTS,
    product_service_instance=(
        product_service
    ),
    category_repository_instance=(
        category_repository
    ),
    brand_repository_instance=(
        brand_repository
    ),
) -> dict:
    result = {
        "products_created": 0,
        "products_skipped": 0,
        "products_failed": 0,
    }

    for product_data in products:
        category = (
            category_repository_instance
            .find_by_slug(
                product_data[
                    "category_slug"
                ]
            )
        )

        if category is None:
            result[
                "products_failed"
            ] += 1

            print(
                "[FAILED] "
                f"{product_data['sku']} - "
                "category "
                f"'{product_data['category_slug']}' "
                "not found"
            )

            continue

        brand = (
            brand_repository_instance
            .find_by_slug(
                product_data[
                    "brand_slug"
                ]
            )
        )

        if brand is None:
            result[
                "products_failed"
            ] += 1

            print(
                "[FAILED] "
                f"{product_data['sku']} - "
                "brand "
                f"'{product_data['brand_slug']}' "
                "not found"
            )

            continue

        subcategory_slug = (
            product_data[
                "subcategory_slug"
            ]
        )

        valid_subcategory = any(
            item.get("slug")
            == subcategory_slug
            for item in category.get(
                "subcategories",
                [],
            )
        )

        if not valid_subcategory:
            result[
                "products_failed"
            ] += 1

            print(
                "[FAILED] "
                f"{product_data['sku']} - "
                "subcategory "
                f"'{subcategory_slug}' "
                "does not exist under "
                f"'{category['name']}'"
            )

            continue

        payload = ProductCreate(
            name=product_data[
                "name"
            ],
            sku=product_data[
                "sku"
            ],
            part_number=(
                product_data[
                    "part_number"
                ]
            ),
            brand_id=str(
                brand["_id"]
            ),
            category_id=str(
                category["_id"]
            ),
            subcategory_slug=(
                subcategory_slug
            ),
            description=(
                product_data[
                    "description"
                ]
            ),
            price=product_data[
                "price"
            ],
            sale_price=(
                product_data.get(
                    "sale_price"
                )
            ),
            stock_quantity=(
                product_data[
                    "stock_quantity"
                ]
            ),
            images=(
                product_data.get(
                    "images",
                    [],
                )
            ),
            specifications=(
                product_data.get(
                    "specifications",
                    {},
                )
            ),
            warranty=(
                product_data.get(
                    "warranty"
                )
            ),
        )

        try:
            (
                product_service_instance
                .create_product(
                    payload
                )
            )

            result[
                "products_created"
            ] += 1

            print(
                "[CREATED] "
                f"{product_data['sku']} - "
                f"{product_data['name']}"
            )

        except ProductAlreadyExistsError:
            result[
                "products_skipped"
            ] += 1

            print(
                "[SKIPPED] "
                f"{product_data['sku']} "
                "already exists"
            )

        except (
            ProductReferenceError,
            ProductValidationError,
            ValidationError,
        ) as exc:
            result[
                "products_failed"
            ] += 1

            print(
                "[FAILED] "
                f"{product_data['sku']} - "
                f"{exc}"
            )

    return result


def main():
    print()
    print(
        "=========================================="
    )
    print(
        "        PartPilot 500 Product Seed"
    )
    print(
        "=========================================="
    )

    print(
        f"Seed definitions : "
        f"{len(PRODUCTS)}"
    )

    print()

    result = seed_products()

    print()
    print(
        "=========================================="
    )
    print(
        "               Seed Result"
    )
    print(
        "=========================================="
    )

    print(
        "Products created : "
        f"{result['products_created']}"
    )

    print(
        "Products skipped : "
        f"{result['products_skipped']}"
    )

    print(
        "Products failed  : "
        f"{result['products_failed']}"
    )

    print()

    if (
        result["products_failed"]
        == 0
    ):
        print(
            "500-product catalog seed "
            "completed successfully."
        )
    else:
        print(
            "Seed completed with failures. "
            "Review the messages above."
        )

    print()


if __name__ == "__main__":
    main()