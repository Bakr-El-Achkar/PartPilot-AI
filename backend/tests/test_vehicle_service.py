from app.schemas.vehicle import VehicleCreate, VehicleUpdate
from app.services.vehicle_service import VehicleService


class FakeVehicleRepository:
    def __init__(self):
        self.documents = []
        self.counter = 1

    def create(self, vehicle_data: dict):
        document = {
            **vehicle_data,
            "_id": f"vehicle-{self.counter}",
        }

        self.counter += 1
        self.documents.append(document)

        return document

    def find_by_user_id(self, user_id: str):
        return [
            document
            for document in self.documents
            if document["user_id"] == user_id
        ]

    def find_by_id_for_user(
        self,
        vehicle_id: str,
        user_id: str,
    ):
        for document in self.documents:
            if (
                str(document["_id"]) == vehicle_id
                and document["user_id"] == user_id
            ):
                return document

        return None

    def update(
        self,
        vehicle_id: str,
        user_id: str,
        updates: dict,
    ):
        vehicle = self.find_by_id_for_user(
            vehicle_id,
            user_id,
        )

        if vehicle is None:
            return None

        vehicle.update(updates)

        return vehicle

    def delete(
        self,
        vehicle_id: str,
        user_id: str,
    ):
        vehicle = self.find_by_id_for_user(
            vehicle_id,
            user_id,
        )

        if vehicle is None:
            return False

        self.documents.remove(vehicle)

        return True

    def clear_active_for_user(
        self,
        user_id: str,
    ):
        for document in self.documents:
            if document["user_id"] == user_id:
                document["is_active"] = False


def create_vehicle_payload():
    return VehicleCreate(
        year=2019,
        make="Toyota",
        model="Camry",
        engine="2.5L I4",
        transmission="Automatic",
        nickname="Daily Car",
    )


def test_first_vehicle_becomes_active():
    repository = FakeVehicleRepository()
    service = VehicleService(repository)

    vehicle = service.create_vehicle(
        "user-1",
        create_vehicle_payload(),
    )

    assert vehicle["is_active"] is True


def test_second_vehicle_is_not_active():
    repository = FakeVehicleRepository()
    service = VehicleService(repository)

    first = service.create_vehicle(
        "user-1",
        create_vehicle_payload(),
    )

    second = service.create_vehicle(
        "user-1",
        VehicleCreate(
            year=2021,
            make="BMW",
            model="330i",
            engine="2.0L Turbo",
            transmission="Automatic",
        ),
    )

    assert first["is_active"] is True
    assert second["is_active"] is False


def test_users_have_independent_active_vehicles():
    repository = FakeVehicleRepository()
    service = VehicleService(repository)

    user_1_vehicle = service.create_vehicle(
        "user-1",
        create_vehicle_payload(),
    )

    user_2_vehicle = service.create_vehicle(
        "user-2",
        VehicleCreate(
            year=2022,
            make="Honda",
            model="Civic",
            engine="1.5L Turbo",
            transmission="CVT",
        ),
    )

    assert user_1_vehicle["is_active"] is True
    assert user_2_vehicle["is_active"] is True


def test_list_user_vehicles():
    repository = FakeVehicleRepository()
    service = VehicleService(repository)

    service.create_vehicle(
        "user-1",
        create_vehicle_payload(),
    )

    service.create_vehicle(
        "user-1",
        VehicleCreate(
            year=2020,
            make="BMW",
            model="X3",
            engine="2.0L Turbo",
            transmission="Automatic",
        ),
    )

    service.create_vehicle(
        "user-2",
        VehicleCreate(
            year=2021,
            make="Honda",
            model="Accord",
            engine="1.5L Turbo",
            transmission="CVT",
        ),
    )

    vehicles = service.list_vehicles(
        "user-1"
    )

    assert len(vehicles) == 2


def test_update_vehicle():
    repository = FakeVehicleRepository()
    service = VehicleService(repository)

    created = service.create_vehicle(
        "user-1",
        create_vehicle_payload(),
    )

    updated = service.update_vehicle(
        created["id"],
        "user-1",
        VehicleUpdate(
            nickname="Family Car",
        ),
    )

    assert updated is not None
    assert updated["nickname"] == "Family Car"


def test_user_cannot_update_other_users_vehicle():
    repository = FakeVehicleRepository()
    service = VehicleService(repository)

    created = service.create_vehicle(
        "user-1",
        create_vehicle_payload(),
    )

    updated = service.update_vehicle(
        created["id"],
        "user-2",
        VehicleUpdate(
            nickname="Hacked",
        ),
    )

    assert updated is None


def test_set_active_vehicle():
    repository = FakeVehicleRepository()
    service = VehicleService(repository)

    first = service.create_vehicle(
        "user-1",
        create_vehicle_payload(),
    )

    second = service.create_vehicle(
        "user-1",
        VehicleCreate(
            year=2022,
            make="BMW",
            model="M340i",
            engine="3.0L Turbo I6",
            transmission="Automatic",
        ),
    )

    activated = service.set_active_vehicle(
        second["id"],
        "user-1",
    )

    first_after = service.get_vehicle(
        first["id"],
        "user-1",
    )

    second_after = service.get_vehicle(
        second["id"],
        "user-1",
    )

    assert activated is not None
    assert first_after["is_active"] is False
    assert second_after["is_active"] is True


def test_invalid_vehicle_does_not_clear_active_vehicle():
    repository = FakeVehicleRepository()
    service = VehicleService(repository)

    first = service.create_vehicle(
        "user-1",
        create_vehicle_payload(),
    )

    result = service.set_active_vehicle(
        "does-not-exist",
        "user-1",
    )

    existing = service.get_vehicle(
        first["id"],
        "user-1",
    )

    assert result is None
    assert existing["is_active"] is True


def test_delete_active_vehicle_promotes_another_vehicle():
    repository = FakeVehicleRepository()
    service = VehicleService(repository)

    first = service.create_vehicle(
        "user-1",
        create_vehicle_payload(),
    )

    second = service.create_vehicle(
        "user-1",
        VehicleCreate(
            year=2020,
            make="Honda",
            model="Civic",
            engine="2.0L I4",
            transmission="CVT",
        ),
    )

    deleted = service.delete_vehicle(
        first["id"],
        "user-1",
    )

    second_after = service.get_vehicle(
        second["id"],
        "user-1",
    )

    assert deleted is True
    assert second_after["is_active"] is True


def test_user_cannot_delete_other_users_vehicle():
    repository = FakeVehicleRepository()
    service = VehicleService(repository)

    vehicle = service.create_vehicle(
        "user-1",
        create_vehicle_payload(),
    )

    deleted = service.delete_vehicle(
        vehicle["id"],
        "user-2",
    )

    assert deleted is False

    assert (
        service.get_vehicle(
            vehicle["id"],
            "user-1",
        )
        is not None
    )