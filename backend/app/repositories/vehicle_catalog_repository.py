from app.core.database import database


class VehicleCatalogRepository:
    def __init__(self):
        self.collection = database["vehicle_catalog"]

    def get_makes(self) -> list[str]:
        makes = self.collection.distinct(
            "make",
            {
                "is_active": True,
            },
        )

        return sorted(
            {
                str(make).strip()
                for make in makes
                if make
            }
        )

    def get_models(
        self,
        make: str,
    ) -> list[str]:
        models = self.collection.distinct(
            "model",
            {
                "make": make,
                "is_active": True,
            },
        )

        return sorted(
            {
                str(model).strip()
                for model in models
                if model
            }
        )

    def get_years(
        self,
        make: str,
        model: str,
    ) -> list[int]:
        documents = self.collection.find(
            {
                "make": make,
                "model": model,
                "is_active": True,
            },
            {
                "_id": 0,
                "year_start": 1,
                "year_end": 1,
            },
        )

        years: set[int] = set()

        for document in documents:
            start = int(
                document["year_start"]
            )

            end = int(
                document["year_end"]
            )

            years.update(
                range(
                    start,
                    end + 1,
                )
            )

        return sorted(
            years,
            reverse=True,
        )

    def get_options(
        self,
        make: str,
        model: str,
        year: int,
    ) -> dict:
        documents = self.collection.find(
            {
                "make": make,
                "model": model,
                "year_start": {
                    "$lte": year,
                },
                "year_end": {
                    "$gte": year,
                },
                "is_active": True,
            },
            {
                "_id": 0,
                "engines": 1,
                "transmissions": 1,
            },
        )

        engines: set[str] = set()
        transmissions: set[str] = set()

        for document in documents:
            for engine in document.get(
                "engines",
                [],
            ):
                if engine:
                    engines.add(
                        str(engine).strip()
                    )

            for transmission in document.get(
                "transmissions",
                [],
            ):
                if transmission:
                    transmissions.add(
                        str(
                            transmission
                        ).strip()
                    )

        return {
            "engines": sorted(
                engines
            ),
            "transmissions": sorted(
                transmissions
            ),
        }

    def find_existing(
        self,
        *,
        make: str,
        model: str,
        year_start: int,
        year_end: int,
    ):
        return self.collection.find_one(
            {
                "make": make,
                "model": model,
                "year_start": year_start,
                "year_end": year_end,
            }
        )

    def create(
        self,
        data: dict,
    ):
        result = (
            self.collection.insert_one(
                data
            )
        )

        return result.inserted_id