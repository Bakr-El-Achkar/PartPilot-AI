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


from app.repositories.product_repository import (
    product_repository,
)
from app.schemas.fitment import (
    FitmentCreate,
)
from app.services.fitment_service import (
    FitmentAlreadyExistsError,
    FitmentReferenceError,
    fitment_service,
)
from scripts.seed_products import (
    PRODUCTS,
)


TOTAL_FITMENT_COUNT = 500


# IMPORTANT:
# These are DEMO compatibility profiles.
# They are used to demonstrate PartPilot's
# fitment architecture and marketplace flow.
#
# They are NOT a verified OEM compatibility
# catalog and must not be treated as such.
VEHICLE_PROFILES = [
    {
        "make": "Honda",
        "model": "CR-V",
        "year_start": 2002,
        "year_end": 2006,
        "engine": None,
        "transmission": None,
    },
    {
        "make": "Honda",
        "model": "Civic",
        "year_start": 2006,
        "year_end": 2011,
        "engine": None,
        "transmission": None,
    },
    {
        "make": "Honda",
        "model": "Accord",
        "year_start": 2008,
        "year_end": 2012,
        "engine": None,
        "transmission": None,
    },
    {
        "make": "Toyota",
        "model": "Corolla",
        "year_start": 2003,
        "year_end": 2008,
        "engine": None,
        "transmission": None,
    },
    {
        "make": "Toyota",
        "model": "Camry",
        "year_start": 2007,
        "year_end": 2011,
        "engine": None,
        "transmission": None,
    },
    {
        "make": "Toyota",
        "model": "RAV4",
        "year_start": 2006,
        "year_end": 2012,
        "engine": None,
        "transmission": None,
    },
    {
        "make": "Nissan",
        "model": "Altima",
        "year_start": 2007,
        "year_end": 2012,
        "engine": None,
        "transmission": None,
    },
    {
        "make": "Nissan",
        "model": "Sentra",
        "year_start": 2007,
        "year_end": 2012,
        "engine": None,
        "transmission": None,
    },
    {
        "make": "Nissan",
        "model": "X-Trail",
        "year_start": 2007,
        "year_end": 2013,
        "engine": None,
        "transmission": None,
    },
    {
        "make": "Hyundai",
        "model": "Elantra",
        "year_start": 2011,
        "year_end": 2016,
        "engine": None,
        "transmission": None,
    },
    {
        "make": "Hyundai",
        "model": "Tucson",
        "year_start": 2010,
        "year_end": 2015,
        "engine": None,
        "transmission": None,
    },
    {
        "make": "Kia",
        "model": "Sportage",
        "year_start": 2011,
        "year_end": 2016,
        "engine": None,
        "transmission": None,
    },
    {
        "make": "Kia",
        "model": "Cerato",
        "year_start": 2009,
        "year_end": 2013,
        "engine": None,
        "transmission": None,
    },
    {
        "make": "Ford",
        "model": "Focus",
        "year_start": 2012,
        "year_end": 2018,
        "engine": None,
        "transmission": None,
    },
    {
        "make": "Ford",
        "model": "Escape",
        "year_start": 2013,
        "year_end": 2019,
        "engine": None,
        "transmission": None,
    },
    {
        "make": "Chevrolet",
        "model": "Cruze",
        "year_start": 2011,
        "year_end": 2016,
        "engine": None,
        "transmission": None,
    },
    {
        "make": "Chevrolet",
        "model": "Malibu",
        "year_start": 2013,
        "year_end": 2018,
        "engine": None,
        "transmission": None,
    },
    {
        "make": "Volkswagen",
        "model": "Golf",
        "year_start": 2009,
        "year_end": 2013,
        "engine": None,
        "transmission": None,
    },
    {
        "make": "Volkswagen",
        "model": "Passat",
        "year_start": 2012,
        "year_end": 2018,
        "engine": None,
        "transmission": None,
    },
    {
        "make": "BMW",
        "model": "3 Series",
        "year_start": 2007,
        "year_end": 2013,
        "engine": None,
        "transmission": None,
    },
    {
        "make": "BMW",
        "model": "5 Series",
        "year_start": 2011,
        "year_end": 2016,
        "engine": None,
        "transmission": None,
    },
    {
        "make": "Mercedes-Benz",
        "model": "C-Class",
        "year_start": 2008,
        "year_end": 2014,
        "engine": None,
        "transmission": None,
    },
    {
        "make": "Mercedes-Benz",
        "model": "E-Class",
        "year_start": 2010,
        "year_end": 2016,
        "engine": None,
        "transmission": None,
    },
    {
        "make": "Mazda",
        "model": "Mazda3",
        "year_start": 2010,
        "year_end": 2013,
        "engine": None,
        "transmission": None,
    },
    {
        "make": "Subaru",
        "model": "Forester",
        "year_start": 2009,
        "year_end": 2013,
        "engine": None,
        "transmission": None,
    },
]


def build_fitments() -> list[dict]:
    fitments = []

    if len(PRODUCTS) < TOTAL_FITMENT_COUNT:
        raise RuntimeError(
            "Not enough seeded products to "
            "generate 500 fitments."
        )

    for index in range(
        TOTAL_FITMENT_COUNT
    ):
        product = PRODUCTS[index]

        vehicle = VEHICLE_PROFILES[
            index
            % len(
                VEHICLE_PROFILES
            )
        ]

        # Most demo records intentionally use
        # engine=None and transmission=None.
        #
        # In our matching system that means:
        #
        # ANY engine
        # ANY transmission
        #
        # This makes the demo more resilient
        # while users enter Garage vehicles
        # with different engine formatting.
        fitment = {
            "product_sku": (
                product["sku"]
            ),
            "make": (
                vehicle["make"]
            ),
            "model": (
                vehicle["model"]
            ),
            "year_start": (
                vehicle[
                    "year_start"
                ]
            ),
            "year_end": (
                vehicle[
                    "year_end"
                ]
            ),
            "engine": (
                vehicle.get(
                    "engine"
                )
            ),
            "transmission": (
                vehicle.get(
                    "transmission"
                )
            ),
        }

        fitments.append(
            fitment
        )

    if (
        len(fitments)
        != TOTAL_FITMENT_COUNT
    ):
        raise RuntimeError(
            "Fitment generator did not "
            "produce exactly 500 records."
        )

    return fitments


FITMENTS = build_fitments()


def seed_fitments(
    *,
    fitments=FITMENTS,
    fitment_service_instance=(
        fitment_service
    ),
    product_repository_instance=(
        product_repository
    ),
) -> dict:
    result = {
        "fitments_created": 0,
        "fitments_skipped": 0,
        "fitments_failed": 0,
    }

    for fitment_data in fitments:
        product_sku = (
            fitment_data[
                "product_sku"
            ]
        )

        product = (
            product_repository_instance
            .find_by_sku(
                product_sku
            )
        )

        if product is None:
            result[
                "fitments_failed"
            ] += 1

            print(
                "[FAILED] "
                f"{product_sku} - "
                "product not found"
            )

            continue

        product_id = str(
            product["_id"]
        )

        try:
            payload = FitmentCreate(
                product_id=product_id,
                make=fitment_data[
                    "make"
                ],
                model=fitment_data[
                    "model"
                ],
                year_start=(
                    fitment_data[
                        "year_start"
                    ]
                ),
                year_end=(
                    fitment_data[
                        "year_end"
                    ]
                ),
                engine=(
                    fitment_data.get(
                        "engine"
                    )
                ),
                transmission=(
                    fitment_data.get(
                        "transmission"
                    )
                ),
            )

            (
                fitment_service_instance
                .create_fitment(
                    payload
                )
            )

            result[
                "fitments_created"
            ] += 1

            print(
                "[CREATED] "
                f"{product_sku} -> "
                f"{fitment_data['year_start']}"
                "-"
                f"{fitment_data['year_end']} "
                f"{fitment_data['make']} "
                f"{fitment_data['model']}"
            )

        except FitmentAlreadyExistsError:
            result[
                "fitments_skipped"
            ] += 1

            print(
                "[SKIPPED] "
                f"{product_sku} -> "
                f"{fitment_data['make']} "
                f"{fitment_data['model']} "
                "already exists"
            )

        except (
            FitmentReferenceError,
            ValidationError,
        ) as exc:
            result[
                "fitments_failed"
            ] += 1

            print(
                "[FAILED] "
                f"{product_sku} - "
                f"{exc}"
            )

    return result


def main():
    print()
    print(
        "=========================================="
    )
    print(
        "        PartPilot 500 Fitment Seed"
    )
    print(
        "=========================================="
    )

    print(
        "Fitment definitions : "
        f"{len(FITMENTS)}"
    )

    print(
        "Vehicle profiles    : "
        f"{len(VEHICLE_PROFILES)}"
    )

    print()

    result = seed_fitments()

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
        "Fitments created : "
        f"{result['fitments_created']}"
    )

    print(
        "Fitments skipped : "
        f"{result['fitments_skipped']}"
    )

    print(
        "Fitments failed  : "
        f"{result['fitments_failed']}"
    )

    print()

    if (
        result["fitments_failed"]
        == 0
    ):
        print(
            "500-fitment catalog seed "
            "completed successfully."
        )
    else:
        print(
            "Fitment seed completed "
            "with failures."
        )

    print()


if __name__ == "__main__":
    main()