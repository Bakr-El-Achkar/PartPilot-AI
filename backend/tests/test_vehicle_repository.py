from bson import ObjectId

from app.repositories.vehicle_repository import (
    VehicleRepository,
)


class FakeInsertResult:
    def __init__(self, inserted_id):
        self.inserted_id = inserted_id


class FakeUpdateResult:
    def __init__(self, matched_count):
        self.matched_count = matched_count


class FakeDeleteResult:
    def __init__(self, deleted_count):
        self.deleted_count = deleted_count


class FakeCollection:
    def __init__(self):
        self.documents = []

    def insert_one(self, document):
        inserted_id = ObjectId()

        stored_document = {
            **document,
            "_id": inserted_id,
        }

        self.documents.append(stored_document)

        return FakeInsertResult(inserted_id)

    def find(self, query):
        return [
            document
            for document in self.documents
            if self._matches(document, query)
        ]

    def find_one(self, query):
        for document in self.documents:
            if self._matches(document, query):
                return document

        return None

    def update_one(self, query, update):
        for document in self.documents:
            if self._matches(document, query):
                document.update(
                    update.get("$set", {})
                )

                return FakeUpdateResult(
                    matched_count=1
                )

        return FakeUpdateResult(
            matched_count=0
        )

    def update_many(self, query, update):
        matched_count = 0

        for document in self.documents:
            if self._matches(document, query):
                document.update(
                    update.get("$set", {})
                )

                matched_count += 1

        return FakeUpdateResult(
            matched_count=matched_count
        )

    def delete_one(self, query):
        for index, document in enumerate(
            self.documents
        ):
            if self._matches(document, query):
                self.documents.pop(index)

                return FakeDeleteResult(
                    deleted_count=1
                )

        return FakeDeleteResult(
            deleted_count=0
        )

    @staticmethod
    def _matches(document, query):
        return all(
            document.get(key) == value
            for key, value in query.items()
        )


def make_vehicle(
    *,
    user_id="user-123",
    make="Toyota",
    model="Camry",
    active=False,
):
    return {
        "user_id": user_id,
        "year": 2019,
        "make": make,
        "model": model,
        "engine": "2.5L I4",
        "transmission": "Automatic",
        "nickname": None,
        "is_active": active,
    }


def test_create_vehicle():
    collection = FakeCollection()

    repository = VehicleRepository(collection)

    vehicle = make_vehicle()

    created = repository.create(vehicle)

    assert "_id" in created

    assert created["make"] == "Toyota"

    assert len(collection.documents) == 1


def test_find_all_vehicles_for_user():
    collection = FakeCollection()

    repository = VehicleRepository(collection)

    repository.create(
        make_vehicle(
            user_id="user-1",
            make="Toyota",
        )
    )

    repository.create(
        make_vehicle(
            user_id="user-1",
            make="BMW",
        )
    )

    repository.create(
        make_vehicle(
            user_id="user-2",
            make="Honda",
        )
    )

    vehicles = repository.find_by_user_id(
        "user-1"
    )

    assert len(vehicles) == 2

    assert {
        vehicle["make"]
        for vehicle in vehicles
    } == {
        "Toyota",
        "BMW",
    }


def test_find_vehicle_by_id_for_owner():
    collection = FakeCollection()

    repository = VehicleRepository(collection)

    created = repository.create(
        make_vehicle(
            user_id="user-1"
        )
    )

    vehicle = repository.find_by_id_for_user(
        str(created["_id"]),
        "user-1",
    )

    assert vehicle is not None

    assert vehicle["_id"] == created["_id"]


def test_user_cannot_find_another_users_vehicle():
    collection = FakeCollection()

    repository = VehicleRepository(collection)

    created = repository.create(
        make_vehicle(
            user_id="user-1"
        )
    )

    vehicle = repository.find_by_id_for_user(
        str(created["_id"]),
        "user-2",
    )

    assert vehicle is None


def test_update_vehicle():
    collection = FakeCollection()

    repository = VehicleRepository(collection)

    created = repository.create(
        make_vehicle(
            user_id="user-1"
        )
    )

    updated = repository.update(
        str(created["_id"]),
        "user-1",
        {
            "nickname": "Daily Driver",
        },
    )

    assert updated is not None

    assert (
        updated["nickname"]
        == "Daily Driver"
    )


def test_user_cannot_update_another_users_vehicle():
    collection = FakeCollection()

    repository = VehicleRepository(collection)

    created = repository.create(
        make_vehicle(
            user_id="user-1"
        )
    )

    updated = repository.update(
        str(created["_id"]),
        "user-2",
        {
            "nickname": "Not Allowed",
        },
    )

    assert updated is None


def test_delete_vehicle():
    collection = FakeCollection()

    repository = VehicleRepository(collection)

    created = repository.create(
        make_vehicle(
            user_id="user-1"
        )
    )

    deleted = repository.delete(
        str(created["_id"]),
        "user-1",
    )

    assert deleted is True

    assert len(collection.documents) == 0


def test_user_cannot_delete_another_users_vehicle():
    collection = FakeCollection()

    repository = VehicleRepository(collection)

    created = repository.create(
        make_vehicle(
            user_id="user-1"
        )
    )

    deleted = repository.delete(
        str(created["_id"]),
        "user-2",
    )

    assert deleted is False

    assert len(collection.documents) == 1


def test_clear_active_vehicle_for_user():
    collection = FakeCollection()

    repository = VehicleRepository(collection)

    repository.create(
        make_vehicle(
            user_id="user-1",
            make="Toyota",
            active=True,
        )
    )

    repository.create(
        make_vehicle(
            user_id="user-1",
            make="BMW",
            active=True,
        )
    )

    repository.create(
        make_vehicle(
            user_id="user-2",
            make="Honda",
            active=True,
        )
    )

    repository.clear_active_for_user(
        "user-1"
    )

    user_1_vehicles = (
        repository.find_by_user_id(
            "user-1"
        )
    )

    user_2_vehicles = (
        repository.find_by_user_id(
            "user-2"
        )
    )

    assert all(
        vehicle["is_active"] is False
        for vehicle in user_1_vehicles
    )

    assert (
        user_2_vehicles[0]["is_active"]
        is True
    )


def test_set_vehicle_active():
    collection = FakeCollection()

    repository = VehicleRepository(collection)

    created = repository.create(
        make_vehicle(
            user_id="user-1",
            active=False,
        )
    )

    active_vehicle = repository.set_active(
        str(created["_id"]),
        "user-1",
    )

    assert active_vehicle is not None

    assert (
        active_vehicle["is_active"]
        is True
    )