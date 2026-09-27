from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_vehicle_catalog_contains_core_makes():
    response = client.get(
        "/api/vehicle-catalog/makes"
    )

    assert response.status_code == 200

    makes = response.json()

    expected_makes = {
        "Honda",
        "Toyota",
        "Nissan",
        "Hyundai",
        "Kia",
        "Ford",
        "Chevrolet",
        "Volkswagen",
        "BMW",
        "Mercedes-Benz",
        "Mazda",
        "Subaru",
    }

    assert expected_makes.issubset(
        set(makes)
    )


def test_honda_contains_crv_and_civic():
    response = client.get(
        "/api/vehicle-catalog/models",
        params={
            "make": "Honda",
        },
    )

    assert response.status_code == 200

    models = response.json()

    assert "CR-V" in models
    assert "Civic" in models


def test_honda_crv_contains_multiple_years():
    response = client.get(
        "/api/vehicle-catalog/years",
        params={
            "make": "Honda",
            "model": "CR-V",
        },
    )

    assert response.status_code == 200

    years = response.json()

    assert len(years) >= 10


def test_honda_crv_2004_has_engine_options():
    response = client.get(
        "/api/vehicle-catalog/options",
        params={
            "make": "Honda",
            "model": "CR-V",
            "year": 2004,
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data["engines"]) >= 1


def test_honda_crv_2004_has_transmission_options():
    response = client.get(
        "/api/vehicle-catalog/options",
        params={
            "make": "Honda",
            "model": "CR-V",
            "year": 2004,
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert len(
        data["transmissions"]
    ) >= 1