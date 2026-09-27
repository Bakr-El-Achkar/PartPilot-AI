from datetime import datetime, timezone

from app.repositories.fitment_repository import (
    FitmentRepository,
    fitment_repository,
    normalize_vehicle_text,
)
from app.repositories.vehicle_repository import (
    vehicle_repository,
)
from app.schemas.fitment import FitmentCreate
from app.services.product_service import product_service


class FitmentAlreadyExistsError(Exception):
    pass


class FitmentReferenceError(Exception):
    pass


class FitmentVehicleNotFoundError(Exception):
    pass


class FitmentService:
    def __init__(
        self,
        fitment_repository: FitmentRepository,
        product_service,
        vehicle_repository,
    ):
        self.fitment_repository = fitment_repository
        self.product_service = product_service
        self.vehicle_repository = vehicle_repository

    def create_fitment(
        self,
        fitment: FitmentCreate,
    ) -> dict:
        product = self.product_service.get_product(
            fitment.product_id
        )

        if product is None:
            raise FitmentReferenceError(
                "Product not found"
            )

        if not product.get(
            "is_active",
            True,
        ):
            raise FitmentReferenceError(
                "Product is inactive"
            )

        make_normalized = normalize_vehicle_text(
            fitment.make
        )

        model_normalized = normalize_vehicle_text(
            fitment.model
        )

        engine_normalized = normalize_vehicle_text(
            fitment.engine
        )

        transmission_normalized = (
            normalize_vehicle_text(
                fitment.transmission
            )
        )

        existing_fitments = (
            self.fitment_repository
            .find_by_product_id(
                fitment.product_id
            )
        )

        for existing in existing_fitments:
            if self._is_same_fitment(
                existing=existing,
                make_normalized=make_normalized,
                model_normalized=model_normalized,
                year_start=fitment.year_start,
                year_end=fitment.year_end,
                engine_normalized=engine_normalized,
                transmission_normalized=(
                    transmission_normalized
                ),
            ):
                raise FitmentAlreadyExistsError(
                    "Fitment already exists"
                )

        now = datetime.now(
            timezone.utc
        )

        fitment_data = {
            "product_id": fitment.product_id,
            "make": fitment.make.strip(),
            "model": fitment.model.strip(),
            "make_normalized": make_normalized,
            "model_normalized": model_normalized,
            "year_start": fitment.year_start,
            "year_end": fitment.year_end,
            "engine": (
                fitment.engine.strip()
                if fitment.engine
                else None
            ),
            "engine_normalized": (
                engine_normalized
            ),
            "transmission": (
                fitment.transmission.strip()
                if fitment.transmission
                else None
            ),
            "transmission_normalized": (
                transmission_normalized
            ),
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        }

        created = (
            self.fitment_repository.create(
                fitment_data
            )
        )

        return self._serialize_fitment(
            created
        )

    def list_product_fitments(
        self,
        product_id: str,
    ) -> list[dict]:
        fitments = (
            self.fitment_repository
            .find_by_product_id(
                product_id
            )
        )

        return [
            self._serialize_fitment(
                fitment
            )
            for fitment in fitments
        ]

    def get_compatible_products(
        self,
        *,
        vehicle_id: str,
        user_id: str,
    ) -> list[dict]:
        vehicle = (
            self.vehicle_repository
            .find_by_id_for_user(
                vehicle_id,
                user_id,
            )
        )

        if vehicle is None:
            raise FitmentVehicleNotFoundError(
                "Vehicle not found"
            )

        fitments = (
            self.fitment_repository
            .find_matching(
                year=vehicle["year"],
                make=vehicle["make"],
                model=vehicle["model"],
                engine=vehicle.get(
                    "engine"
                ),
                transmission=vehicle.get(
                    "transmission"
                ),
            )
        )

        products = []
        seen_product_ids = set()

        for fitment in fitments:
            product_id = str(
                fitment["product_id"]
            )

            if product_id in seen_product_ids:
                continue

            product = (
                self.product_service
                .get_product(
                    product_id
                )
            )

            if product is None:
                continue

            if not product.get(
                "is_active",
                True,
            ):
                continue

            seen_product_ids.add(
                product_id
            )

            products.append(
                product
            )

        return products

    @staticmethod
    def _is_same_fitment(
        *,
        existing: dict,
        make_normalized: str | None,
        model_normalized: str | None,
        year_start: int,
        year_end: int,
        engine_normalized: str | None,
        transmission_normalized: str | None,
    ) -> bool:
        return (
            existing.get(
                "make_normalized"
            )
            == make_normalized
            and existing.get(
                "model_normalized"
            )
            == model_normalized
            and existing.get(
                "year_start"
            )
            == year_start
            and existing.get(
                "year_end"
            )
            == year_end
            and existing.get(
                "engine_normalized"
            )
            == engine_normalized
            and existing.get(
                "transmission_normalized"
            )
            == transmission_normalized
        )

    @staticmethod
    def _serialize_fitment(
        fitment: dict,
    ) -> dict:
        return {
            "id": str(
                fitment["_id"]
            ),
            "product_id": str(
                fitment["product_id"]
            ),
            "make": fitment["make"],
            "model": fitment["model"],
            "make_normalized": (
                fitment[
                    "make_normalized"
                ]
            ),
            "model_normalized": (
                fitment[
                    "model_normalized"
                ]
            ),
            "year_start": (
                fitment["year_start"]
            ),
            "year_end": (
                fitment["year_end"]
            ),
            "engine": fitment.get(
                "engine"
            ),
            "engine_normalized": (
                fitment.get(
                    "engine_normalized"
                )
            ),
            "transmission": (
                fitment.get(
                    "transmission"
                )
            ),
            "transmission_normalized": (
                fitment.get(
                    "transmission_normalized"
                )
            ),
            "is_active": fitment.get(
                "is_active",
                True,
            ),
            "created_at": fitment.get(
                "created_at"
            ),
            "updated_at": fitment.get(
                "updated_at"
            ),
        }


fitment_service = FitmentService(
    fitment_repository=fitment_repository,
    product_service=product_service,
    vehicle_repository=vehicle_repository,
)