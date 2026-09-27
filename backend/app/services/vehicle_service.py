from datetime import datetime, timezone

from app.repositories.vehicle_repository import (
    VehicleRepository,
    vehicle_repository,
)
from app.schemas.vehicle import (
    VehicleCreate,
    VehicleUpdate,
)


class VehicleService:
    def __init__(
        self,
        repository: VehicleRepository,
    ):
        self.repository = repository

    def create_vehicle(
        self,
        user_id: str,
        vehicle: VehicleCreate,
    ) -> dict:
        existing_vehicles = (
            self.repository.find_by_user_id(
                user_id
            )
        )

        now = datetime.now(
            timezone.utc
        )

        
        vehicle_data = vehicle.model_dump()

        vehicle_data.update(
            {
                "user_id": user_id,
                "is_active": (
                    len(
                        existing_vehicles
                    )
                    == 0
                ),
                "created_at": now,
                "updated_at": now,
            }
        )

        created = (
            self.repository.create(
                vehicle_data
            )
        )

        return (
            self._serialize_vehicle(
                created
            )
        )

    def list_vehicles(
        self,
        user_id: str,
    ) -> list[dict]:
        vehicles = (
            self.repository.find_by_user_id(
                user_id
            )
        )

        return [
            self._serialize_vehicle(
                vehicle
            )
            for vehicle in vehicles
        ]

    def get_vehicle(
        self,
        vehicle_id: str,
        user_id: str,
    ):
        vehicle = (
            self.repository.find_by_id_for_user(
                vehicle_id,
                user_id,
            )
        )

        if vehicle is None:
            return None

        return (
            self._serialize_vehicle(
                vehicle
            )
        )

    def update_vehicle(
        self,
        vehicle_id: str,
        user_id: str,
        vehicle_update: VehicleUpdate,
    ):
        existing = (
            self.repository.find_by_id_for_user(
                vehicle_id,
                user_id,
            )
        )

        if existing is None:
            return None

        updates = (
            vehicle_update.model_dump(
                exclude_unset=True
            )
        )

        if not updates:
            return (
                self._serialize_vehicle(
                    existing
                )
            )

        updates["updated_at"] = (
            datetime.now(
                timezone.utc
            )
        )

        updated = (
            self.repository.update(
                vehicle_id,
                user_id,
                updates,
            )
        )

        if updated is None:
            return None

        return (
            self._serialize_vehicle(
                updated
            )
        )

    def set_active_vehicle(
        self,
        vehicle_id: str,
        user_id: str,
    ):
        target_vehicle = (
            self.repository.find_by_id_for_user(
                vehicle_id,
                user_id,
            )
        )

        if target_vehicle is None:
            return None

        self.repository.clear_active_for_user(
            user_id
        )

        updated = (
            self.repository.update(
                vehicle_id,
                user_id,
                {
                    "is_active": True,
                    "updated_at": (
                        datetime.now(
                            timezone.utc
                        )
                    ),
                },
            )
        )

        if updated is None:
            return None

        return (
            self._serialize_vehicle(
                updated
            )
        )

    def delete_vehicle(
        self,
        vehicle_id: str,
        user_id: str,
    ) -> bool:
        existing = (
            self.repository.find_by_id_for_user(
                vehicle_id,
                user_id,
            )
        )

        if existing is None:
            return False

        was_active = existing.get(
            "is_active",
            False,
        )

        deleted = (
            self.repository.delete(
                vehicle_id,
                user_id,
            )
        )

        if not deleted:
            return False

        if was_active:
            remaining_vehicles = (
                self.repository.find_by_user_id(
                    user_id
                )
            )

            if remaining_vehicles:
                next_vehicle = (
                    remaining_vehicles[0]
                )

                self.repository.update(
                    str(
                        next_vehicle[
                            "_id"
                        ]
                    ),
                    user_id,
                    {
                        "is_active": True,
                        "updated_at": (
                            datetime.now(
                                timezone.utc
                            )
                        ),
                    },
                )

        return True

    @staticmethod
    def _serialize_vehicle(
        vehicle: dict,
    ) -> dict:
        return {
            "id": str(
                vehicle["_id"]
            ),
            "user_id": vehicle[
                "user_id"
            ],
            "year": vehicle["year"],
            "make": vehicle["make"],
            "model": vehicle["model"],
            "engine": vehicle[
                "engine"
            ],
            "transmission": vehicle[
                "transmission"
            ],
            "nickname": vehicle.get(
                "nickname"
            ),
            "image_url": vehicle.get(
                "image_url"
            ),
            "is_active": vehicle.get(
                "is_active",
                False,
            ),
            "created_at": vehicle[
                "created_at"
            ],
            "updated_at": vehicle[
                "updated_at"
            ],
        }


vehicle_service = VehicleService(
    vehicle_repository
)