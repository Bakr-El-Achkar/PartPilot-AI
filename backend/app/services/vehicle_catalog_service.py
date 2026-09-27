from app.repositories.vehicle_catalog_repository import (
    VehicleCatalogRepository,
)


vehicle_catalog_repository = (
    VehicleCatalogRepository()
)


class VehicleCatalogService:
    def get_makes(
        self,
    ) -> list[str]:
        return (
            vehicle_catalog_repository
            .get_makes()
        )

    def get_models(
        self,
        make: str,
    ) -> list[str]:
        clean_make = (
            make.strip()
        )

        if not clean_make:
            return []

        return (
            vehicle_catalog_repository
            .get_models(
                clean_make
            )
        )

    def get_years(
        self,
        make: str,
        model: str,
    ) -> list[int]:
        clean_make = (
            make.strip()
        )

        clean_model = (
            model.strip()
        )

        if (
            not clean_make
            or not clean_model
        ):
            return []

        return (
            vehicle_catalog_repository
            .get_years(
                make=clean_make,
                model=clean_model,
            )
        )

    def get_options(
        self,
        make: str,
        model: str,
        year: int,
    ) -> dict:
        clean_make = (
            make.strip()
        )

        clean_model = (
            model.strip()
        )

        options = (
            vehicle_catalog_repository
            .get_options(
                make=clean_make,
                model=clean_model,
                year=year,
            )
        )

        return {
            "make": clean_make,
            "model": clean_model,
            "year": year,
            "engines": options[
                "engines"
            ],
            "transmissions": options[
                "transmissions"
            ],
        }


vehicle_catalog_service = (
    VehicleCatalogService()
)