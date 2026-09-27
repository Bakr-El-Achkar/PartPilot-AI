import pytest
from pydantic import ValidationError

from app.schemas.vehicle import (
    VehicleCreate,
    VehicleUpdate,
)


def test_vehicle_create_accepts_valid_vehicle():
    vehicle = VehicleCreate(
        year=2019,
        make="Toyota",
        model="Camry",
        engine="2.5L I4",
        transmission="Automatic",
        nickname="Daily Car",
    )

    assert vehicle.year == 2019
    assert vehicle.make == "Toyota"
    assert vehicle.model == "Camry"
    assert vehicle.engine == "2.5L I4"
    assert vehicle.transmission == "Automatic"
    assert vehicle.nickname == "Daily Car"


def test_vehicle_create_allows_missing_nickname():
    vehicle = VehicleCreate(
        year=2020,
        make="BMW",
        model="330i",
        engine="2.0L Turbo",
        transmission="Automatic",
    )

    assert vehicle.nickname is None


def test_vehicle_create_rejects_invalid_year():
    with pytest.raises(ValidationError):
        VehicleCreate(
            year=1800,
            make="Toyota",
            model="Camry",
            engine="2.5L I4",
            transmission="Automatic",
        )


def test_vehicle_create_rejects_empty_make():
    with pytest.raises(ValidationError):
        VehicleCreate(
            year=2020,
            make="",
            model="Camry",
            engine="2.5L I4",
            transmission="Automatic",
        )


def test_vehicle_update_allows_partial_update():
    vehicle = VehicleUpdate(
        nickname="Weekend Car",
    )

    assert vehicle.nickname == "Weekend Car"
    assert vehicle.year is None
    assert vehicle.make is None
    assert vehicle.model is None