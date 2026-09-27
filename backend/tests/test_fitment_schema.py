import pytest
from pydantic import ValidationError

from app.schemas.fitment import (
    FitmentCreate,
)


def test_fitment_accepts_valid_vehicle_range():
    fitment = FitmentCreate(
        product_id="product-1",
        make="Honda",
        model="CR-V",
        year_start=2002,
        year_end=2006,
        engine="2.4L",
        transmission="Automatic",
    )

    assert fitment.product_id == "product-1"
    assert fitment.make == "Honda"
    assert fitment.model == "CR-V"
    assert fitment.year_start == 2002
    assert fitment.year_end == 2006
    assert fitment.engine == "2.4L"
    assert fitment.transmission == "Automatic"


def test_fitment_allows_engine_to_be_optional():
    fitment = FitmentCreate(
        product_id="product-1",
        make="Honda",
        model="CR-V",
        year_start=2002,
        year_end=2006,
        engine=None,
        transmission="Automatic",
    )

    assert fitment.engine is None


def test_fitment_allows_transmission_to_be_optional():
    fitment = FitmentCreate(
        product_id="product-1",
        make="Honda",
        model="CR-V",
        year_start=2002,
        year_end=2006,
        engine="2.4L",
        transmission=None,
    )

    assert fitment.transmission is None


def test_fitment_can_apply_to_all_engines_and_transmissions():
    fitment = FitmentCreate(
        product_id="product-1",
        make="Honda",
        model="CR-V",
        year_start=2002,
        year_end=2006,
    )

    assert fitment.engine is None
    assert fitment.transmission is None


def test_fitment_rejects_end_year_before_start_year():
    with pytest.raises(ValidationError):
        FitmentCreate(
            product_id="product-1",
            make="Honda",
            model="CR-V",
            year_start=2006,
            year_end=2002,
        )


def test_fitment_rejects_invalid_year():
    with pytest.raises(ValidationError):
        FitmentCreate(
            product_id="product-1",
            make="Honda",
            model="CR-V",
            year_start=1800,
            year_end=2006,
        )


def test_fitment_requires_product():
    with pytest.raises(ValidationError):
        FitmentCreate(
            product_id="",
            make="Honda",
            model="CR-V",
            year_start=2002,
            year_end=2006,
        )


def test_fitment_requires_make():
    with pytest.raises(ValidationError):
        FitmentCreate(
            product_id="product-1",
            make="",
            model="CR-V",
            year_start=2002,
            year_end=2006,
        )


def test_fitment_requires_model():
    with pytest.raises(ValidationError):
        FitmentCreate(
            product_id="product-1",
            make="Honda",
            model="",
            year_start=2002,
            year_end=2006,
        )