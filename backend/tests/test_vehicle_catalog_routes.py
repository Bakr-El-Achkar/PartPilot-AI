from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_get_vehicle_makes_returns_200():
    response = client.get("/api/vehicle-catalog/makes")

    assert response.status_code == 200


def test_get_vehicle_models_returns_200():
    response = client.get(
        "/api/vehicle-catalog/models",
        params={"make": "Honda"},
    )

    assert response.status_code == 200


def test_get_vehicle_years_returns_200():
    response = client.get(
        "/api/vehicle-catalog/years",
        params={
            "make": "Honda",
            "model": "CR-V",
        },
    )

    assert response.status_code == 200


def test_get_vehicle_options_returns_200():
    response = client.get(
        "/api/vehicle-catalog/options",
        params={
            "make": "Honda",
            "model": "CR-V",
            "year": 2004,
        },
    )

    assert response.status_code == 200