from pymongo.collection import Collection

from app.core.database import database


def normalize_vehicle_text(
    value: str | None,
) -> str | None:
    if value is None:
        return None

    normalized = " ".join(
        value.strip().lower().split()
    )

    return normalized or None


class FitmentRepository:
    def __init__(
        self,
        collection: Collection,
    ):
        self.collection = collection

    def create(
        self,
        fitment_data: dict,
    ) -> dict:
        result = self.collection.insert_one(
            fitment_data
        )

        fitment_data["_id"] = (
            result.inserted_id
        )

        return fitment_data

    def find_by_product_id(
        self,
        product_id: str,
    ) -> list[dict]:
        fitments = self.collection.find(
            {
                "product_id": product_id,
            }
        )

        return list(fitments)

    def find_matching(
        self,
        *,
        year: int,
        make: str,
        model: str,
        engine: str | None = None,
        transmission: str | None = None,
    ) -> list[dict]:
        make_normalized = (
            normalize_vehicle_text(
                make
            )
        )

        model_normalized = (
            normalize_vehicle_text(
                model
            )
        )

        engine_normalized = (
            normalize_vehicle_text(
                engine
            )
        )

        transmission_normalized = (
            normalize_vehicle_text(
                transmission
            )
        )

        query = {
            "is_active": True,
            "make_normalized": (
                make_normalized
            ),
            "model_normalized": (
                model_normalized
            ),
            "year_start": {
                "$lte": year,
            },
            "year_end": {
                "$gte": year,
            },
        }

        candidates = list(
            self.collection.find(
                query
            )
        )

        matches = []

        for fitment in candidates:
            fitment_engine = (
                fitment.get(
                    "engine_normalized"
                )
            )

            fitment_transmission = (
                fitment.get(
                    "transmission_normalized"
                )
            )

            engine_matches = (
                fitment_engine is None
                or fitment_engine
                == engine_normalized
            )

            transmission_matches = (
                fitment_transmission
                is None
                or fitment_transmission
                == transmission_normalized
            )

            if (
                engine_matches
                and transmission_matches
            ):
                matches.append(
                    fitment
                )

        return matches


fitment_repository = FitmentRepository(
    database["fitments"]
)