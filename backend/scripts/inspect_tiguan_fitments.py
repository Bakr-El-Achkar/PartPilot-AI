from pprint import pprint

from app.core.database import (
    database,
    ping_database,
)


def contains_text(
    document: dict,
    text: str,
) -> bool:
    return (
        text.lower()
        in str(document).lower()
    )


def main():
    print()
    print(
        "========================================="
    )
    print(
        " Vehnexa Fitment Inspection"
    )
    print(
        "========================================="
    )
    print()

    print(
        f"Database connection: "
        f"{'OK' if ping_database() else 'FAILED'}"
    )

    print()
    print(
        "Database collections:"
    )

    collections = (
        database.list_collection_names()
    )

    for name in sorted(
        collections
    ):
        print(
            f"  - {name}"
        )

    print()
    print(
        "========================================="
    )
    print(
        " GARAGE TIGUAN"
    )
    print(
        "========================================="
    )

    tiguan_vehicles = list(
        database[
            "vehicles"
        ].find(
            {
                "make": {
                    "$regex": (
                        "^Volkswagen$"
                    ),
                    "$options": "i",
                },
                "model": {
                    "$regex": (
                        "^Tiguan$"
                    ),
                    "$options": "i",
                },
            }
        )
    )

    print(
        "Volkswagen Tiguan garage "
        f"vehicles found: "
        f"{len(tiguan_vehicles)}"
    )

    for index, vehicle in enumerate(
        tiguan_vehicles,
        start=1,
    ):
        print()
        print(
            f"Tiguan vehicle #{index}"
        )

        pprint(
            vehicle,
            sort_dicts=False,
        )

    print()
    print(
        "========================================="
    )
    print(
        " FITMENT COLLECTION"
    )
    print(
        "========================================="
    )

    fitment_collection = (
        database[
            "fitments"
        ]
    )

    total_fitments = (
        fitment_collection
        .count_documents({})
    )

    print(
        f"Total fitment documents: "
        f"{total_fitments}"
    )

    sample_fitment = (
        fitment_collection.find_one()
    )

    print()
    print(
        "Sample fitment document:"
    )

    if sample_fitment:
        pprint(
            sample_fitment,
            sort_dicts=False,
        )
    else:
        print(
            "No fitment documents found."
        )

    print()
    print(
        "========================================="
    )
    print(
        " VOLKSWAGEN FITMENTS"
    )
    print(
        "========================================="
    )

    volkswagen_fitments = []

    tiguan_fitments = []

    for fitment in (
        fitment_collection.find()
    ):
        if contains_text(
            fitment,
            "Volkswagen",
        ):
            volkswagen_fitments.append(
                fitment
            )

        if contains_text(
            fitment,
            "Tiguan",
        ):
            tiguan_fitments.append(
                fitment
            )

    print(
        "Fitment documents containing "
        f"'Volkswagen': "
        f"{len(volkswagen_fitments)}"
    )

    print(
        "Fitment documents containing "
        f"'Tiguan': "
        f"{len(tiguan_fitments)}"
    )

    if volkswagen_fitments:
        print()
        print(
            "First Volkswagen fitments:"
        )

        for fitment in (
            volkswagen_fitments[:10]
        ):
            print(
                "---------------------------------"
            )

            pprint(
                fitment,
                sort_dicts=False,
            )

    print()
    print(
        "========================================="
    )
    print(
        " TIGUAN FITMENTS"
    )
    print(
        "========================================="
    )

    if not tiguan_fitments:
        print(
            "No fitment document contains "
            "'Tiguan'."
        )
    else:
        for fitment in (
            tiguan_fitments[:30]
        ):
            print(
                "---------------------------------"
            )

            pprint(
                fitment,
                sort_dicts=False,
            )

    print()
    print(
        "========================================="
    )
    print(
        " ACTIVE TIGUAN SUMMARY"
    )
    print(
        "========================================="
    )

    active_tiguans = [
        vehicle
        for vehicle
        in tiguan_vehicles
        if vehicle.get(
            "is_active"
        )
    ]

    print(
        f"Active Tiguan vehicles: "
        f"{len(active_tiguans)}"
    )

    for vehicle in active_tiguans:
        print()
        print(
            f"Vehicle ID: "
            f"{vehicle.get('_id')}"
        )

        print(
            f"Year: "
            f"{vehicle.get('year')}"
        )

        print(
            f"Make: "
            f"{vehicle.get('make')}"
        )

        print(
            f"Model: "
            f"{vehicle.get('model')}"
        )

        print(
            f"Engine: "
            f"{vehicle.get('engine')}"
        )

        print(
            f"Transmission: "
            f"{vehicle.get('transmission')}"
        )

    print()
    print(
        "========================================="
    )
    print(
        " RESULT"
    )
    print(
        "========================================="
    )

    if (
        tiguan_vehicles
        and
        not tiguan_fitments
    ):
        print(
            "ROOT CAUSE CONFIRMED:"
        )

        print(
            "The user's Volkswagen Tiguan "
            "exists in the Garage, but there "
            "are no Tiguan records in the "
            "fitment collection."
        )

        print()
        print(
            "The Shop frontend is therefore "
            "correct to return 0 compatible "
            "products."
        )

    elif (
        tiguan_vehicles
        and
        tiguan_fitments
    ):
        print(
            "Tiguan fitment records exist."
        )

        print(
            "We need to inspect their exact "
            "year/engine/transmission matching "
            "against the Garage vehicle."
        )

    else:
        print(
            "No Volkswagen Tiguan Garage "
            "vehicle was found."
        )

    print()


if __name__ == "__main__":
    main()