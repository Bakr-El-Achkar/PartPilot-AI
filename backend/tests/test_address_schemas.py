import pytest

from pydantic import (
    ValidationError,
)

from app.schemas.address import (
    AddressCreate,
)


def test_valid_address():
    address = AddressCreate(
        label="Home",
        recipient_name=(
            "Baker El Achkar"
        ),
        phone=(
            "+961 70 123 456"
        ),
        address_line1=(
            "Main Street"
        ),
        city="Tripoli",
        region=(
            "North Lebanon"
        ),
        country="Lebanon",
    )

    assert (
        address.city
        == "Tripoli"
    )


def test_address_rejects_blank_recipient():
    with pytest.raises(
        ValidationError
    ):
        AddressCreate(
            label="Home",
            recipient_name=" ",
            phone="+96170123456",
            address_line1=(
                "Main Street"
            ),
            city="Tripoli",
        )
