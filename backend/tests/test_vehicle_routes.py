from datetime import datetime, timezone
from bson import ObjectId
from fastapi.testclient import TestClient

from app.main import app
from app.dependencies.auth import get_current_user
import app.routes.vehicles as vehicle_routes


client = TestClient(app)

USER_ID = ObjectId()


def fake_current_user():
    return {
        "_id": USER_ID,
        "first_name": "Bakr",
        "last_name": "El Achkar",
        "email": "bakr@example.com",
        "role": "customer",
        "is_active": True,
    }


def sample_vehicle(
    *,
    vehicle_id="vehicle-1",
    active=True,
):
    now = datetime.now(timezone.utc)

    return {
        "id": vehicle_id,
        "user_id": str(USER_ID),
        "year": 2019,
        "make": "Toyota",
        "model": "Camry",
        "engine": "2.5L I4",
        "transmission": "Automatic",
        "nickname": "Daily Car",
        "is_active": active,
        "created_at": now,
        "updated_at": now,
    }


class FakeVehicleService:
    def __init__(self):
        self.vehicles = [
            sample_vehicle()
        ]

    def create_vehicle(
        self,
        user_id,
        vehicle,
    ):
        created = sample_vehicle(
            vehicle_id="vehicle-2",
            active=False,
        )

        created.update(
            {
                "user_id": user_id,
                "year": vehicle.year,
                "make": vehicle.make,
                "model": vehicle.model,
                "engine": vehicle.engine,
                "transmission": vehicle.transmission,
                "nickname": vehicle.nickname,
            }
        )

        self.vehicles.append(created)

        return created

    def list_vehicles(
        self,
        user_id,
    ):
        return [
            vehicle
            for vehicle in self.vehicles
            if vehicle["user_id"] == user_id
        ]

    def get_vehicle(
        self,
        vehicle_id,
        user_id,
    ):
        for vehicle in self.vehicles:
            if (
                vehicle["id"] == vehicle_id
                and vehicle["user_id"] == user_id
            ):
                return vehicle

        return None

    def update_vehicle(
        self,
        vehicle_id,
        user_id,
        vehicle_update,
    ):
        vehicle = self.get_vehicle(
            vehicle_id,
            user_id,
        )

        if vehicle is None:
            return None

        updates = vehicle_update.model_dump(
            exclude_unset=True
        )

        vehicle.update(updates)
        vehicle["updated_at"] = datetime.now(
            timezone.utc
        )

        return vehicle

    def set_active_vehicle(
        self,
        vehicle_id,
        user_id,
    ):
        vehicle = self.get_vehicle(
            vehicle_id,
            user_id,
        )

        if vehicle is None:
            return None

        for item in self.vehicles:
            if item["user_id"] == user_id:
                item["is_active"] = False

        vehicle["is_active"] = True

        return vehicle

    def delete_vehicle(
        self,
        vehicle_id,
        user_id,
    ):
        vehicle = self.get_vehicle(
            vehicle_id,
            user_id,
        )

        if vehicle is None:
            return False

        self.vehicles.remove(vehicle)

        return True


def setup_function():
    app.dependency_overrides[
        get_current_user
    ] = fake_current_user

    vehicle_routes.vehicle_service = (
        FakeVehicleService()
    )


def teardown_function():
    app.dependency_overrides.clear()


def test_create_vehicle():
    response = client.post(
        "/api/vehicles",
        json={
            "year": 2022,
            "make": "BMW",
            "model": "330i",
            "engine": "2.0L Turbo",
            "transmission": "Automatic",
            "nickname": "Weekend Car",
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["make"] == "BMW"
    assert data["model"] == "330i"


def test_list_vehicles():
    response = client.get(
        "/api/vehicles"
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["make"] == "Toyota"


def test_get_vehicle():
    response = client.get(
        "/api/vehicles/vehicle-1"
    )

    assert response.status_code == 200

    assert (
        response.json()["model"]
        == "Camry"
    )


def test_get_missing_vehicle_returns_404():
    response = client.get(
        "/api/vehicles/missing"
    )

    assert response.status_code == 404


def test_update_vehicle():
    response = client.patch(
        "/api/vehicles/vehicle-1",
        json={
            "nickname": "Family Car",
        },
    )

    assert response.status_code == 200

    assert (
        response.json()["nickname"]
        == "Family Car"
    )


def test_set_active_vehicle():
    service = (
        vehicle_routes.vehicle_service
    )

    service.vehicles.append(
        sample_vehicle(
            vehicle_id="vehicle-2",
            active=False,
        )
    )

    response = client.patch(
        "/api/vehicles/vehicle-2/active"
    )

    assert response.status_code == 200

    assert (
        response.json()["is_active"]
        is True
    )


def test_delete_vehicle():
    response = client.delete(
        "/api/vehicles/vehicle-1"
    )

    assert response.status_code == 204


def test_delete_missing_vehicle_returns_404():
    response = client.delete(
        "/api/vehicles/missing"
    )

    assert response.status_code == 404