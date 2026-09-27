from bson import ObjectId
from bson.errors import InvalidId
from pymongo.collection import Collection

from app.core.database import database


class VehicleRepository:
    def __init__(self, collection: Collection):
        self.collection = collection

    def create(self, vehicle_data: dict) -> dict:
        result = self.collection.insert_one(
            vehicle_data
        )

        vehicle_data["_id"] = (
            result.inserted_id
        )

        return vehicle_data

    def find_by_user_id(
        self,
        user_id: str,
    ) -> list[dict]:
        vehicles = self.collection.find(
            {
                "user_id": user_id,
            }
        )

        return list(vehicles)

    def find_by_id_for_user(
        self,
        vehicle_id: str,
        user_id: str,
    ):
        query_id = self._parse_vehicle_id(
            vehicle_id
        )

        return self.collection.find_one(
            {
                "_id": query_id,
                "user_id": user_id,
            }
        )

    # ========================================================
    # AI MECHANIC / OWNERSHIP-SCOPED LOOKUP
    # ========================================================
    #
    # AI Mechanic uses this repository interface.
    #
    # Keep find_by_id_for_user because the existing Garage
    # service already uses it.
    #
    # This alias gives AI Mechanic the same ownership-safe
    # lookup without duplicating MongoDB query logic.
    # ========================================================

    def find_owned_by_id(
        self,
        vehicle_id: str,
        user_id: str,
    ):
        return self.find_by_id_for_user(
            vehicle_id,
            user_id,
        )

    def update(
        self,
        vehicle_id: str,
        user_id: str,
        updates: dict,
    ):
        query_id = self._parse_vehicle_id(
            vehicle_id
        )

        result = self.collection.update_one(
            {
                "_id": query_id,
                "user_id": user_id,
            },
            {
                "$set": updates,
            },
        )

        if result.matched_count == 0:
            return None

        return self.collection.find_one(
            {
                "_id": query_id,
                "user_id": user_id,
            }
        )

    def delete(
        self,
        vehicle_id: str,
        user_id: str,
    ) -> bool:
        query_id = self._parse_vehicle_id(
            vehicle_id
        )

        result = self.collection.delete_one(
            {
                "_id": query_id,
                "user_id": user_id,
            }
        )

        return (
            result.deleted_count == 1
        )

    def clear_active_for_user(
        self,
        user_id: str,
    ) -> None:
        self.collection.update_many(
            {
                "user_id": user_id,
                "is_active": True,
            },
            {
                "$set": {
                    "is_active": False,
                }
            },
        )

    def set_active(
        self,
        vehicle_id: str,
        user_id: str,
    ):
        query_id = self._parse_vehicle_id(
            vehicle_id
        )

        result = self.collection.update_one(
            {
                "_id": query_id,
                "user_id": user_id,
            },
            {
                "$set": {
                    "is_active": True,
                }
            },
        )

        if result.matched_count == 0:
            return None

        return self.collection.find_one(
            {
                "_id": query_id,
                "user_id": user_id,
            }
        )

    @staticmethod
    def _parse_vehicle_id(
        vehicle_id: str,
    ):
        try:
            return ObjectId(vehicle_id)
        except InvalidId:
            return vehicle_id


vehicle_repository = VehicleRepository(
    database["vehicles"]
)