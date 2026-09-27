from bson import ObjectId

from app.schemas.vehicle import VehicleCreate
from app.services.vehicle_service import VehicleService


class FakeVehicleRepository:
    def __init__(self):
        self.created = []

    def find_by_user_id(self, user_id):
        return self.created

    def create(self, document):
        created = {
            "_id": ObjectId(),
            **document,
        }

        self.created.append(created)

        return created


def test_create_vehicle_preserves_image_url():
    repository = FakeVehicleRepository()

    service = VehicleService(repository)

    image_url = (
        "https://example.com/"
        "volkswagen-tiguan.jpg"
    )

    payload = VehicleCreate(
        year=2009,
        make="Volkswagen",
        model="Tiguan",
        engine="2.0L TSI",
        transmission="Automatic",
        nickname="Bakr",
        image_url=image_url,
    )

    created = service.create_vehicle(
        "user-123",
        payload,
    )

    assert created["image_url"] == image_url
    assert repository.created[0]["image_url"] == image_url
