from datetime import datetime

from pydantic import (
    BaseModel,
    Field,
    field_validator,
)


class AddressCreate(BaseModel):
    label: str = Field(
        default="Home",
        min_length=1,
        max_length=50,
    )

    recipient_name: str = Field(
        min_length=2,
        max_length=120,
    )

    phone: str = Field(
        min_length=5,
        max_length=40,
    )

    address_line1: str = Field(
        min_length=3,
        max_length=200,
    )

    address_line2: str | None = Field(
        default=None,
        max_length=200,
    )

    city: str = Field(
        min_length=2,
        max_length=100,
    )

    region: str | None = Field(
        default=None,
        max_length=100,
    )

    country: str = Field(
        default="Lebanon",
        min_length=2,
        max_length=100,
    )

    postal_code: str | None = Field(
        default=None,
        max_length=30,
    )

    @field_validator(
        "label",
        "recipient_name",
        "phone",
        "address_line1",
        "city",
        "country",
    )
    @classmethod
    def required_text(
        cls,
        value: str,
    ) -> str:
        value = value.strip()

        if not value:
            raise ValueError(
                "field must not be blank"
            )

        return value

    @field_validator(
        "address_line2",
        "region",
        "postal_code",
    )
    @classmethod
    def optional_text(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        value = value.strip()

        return value or None


class AddressUpdate(BaseModel):
    label: str | None = Field(
        default=None,
        min_length=1,
        max_length=50,
    )

    recipient_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=120,
    )

    phone: str | None = Field(
        default=None,
        min_length=5,
        max_length=40,
    )

    address_line1: str | None = Field(
        default=None,
        min_length=3,
        max_length=200,
    )

    address_line2: str | None = Field(
        default=None,
        max_length=200,
    )

    city: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    region: str | None = Field(
        default=None,
        max_length=100,
    )

    country: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    postal_code: str | None = Field(
        default=None,
        max_length=30,
    )

    @field_validator(
        "label",
        "recipient_name",
        "phone",
        "address_line1",
        "city",
        "country",
    )
    @classmethod
    def optional_required_text(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        value = value.strip()

        if not value:
            raise ValueError(
                "field must not be blank"
            )

        return value

    @field_validator(
        "address_line2",
        "region",
        "postal_code",
    )
    @classmethod
    def optional_text(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        value = value.strip()

        return value or None


class AddressPublic(BaseModel):
    id: str

    label: str
    recipient_name: str
    phone: str

    address_line1: str
    address_line2: str | None = None

    city: str
    region: str | None = None
    country: str

    postal_code: str | None = None

    is_default: bool

    created_at: datetime
    updated_at: datetime
