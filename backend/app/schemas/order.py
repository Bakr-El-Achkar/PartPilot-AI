from datetime import datetime
from typing import Literal

from pydantic import (
    BaseModel,
    Field,
    field_validator,
)


class OrderItemCreate(BaseModel):
    product_id: str = Field(
        min_length=1,
        max_length=100,
    )

    quantity: int = Field(
        ge=1,
        le=99,
    )

    @field_validator(
        "product_id",
    )
    @classmethod
    def normalize_product_id(
        cls,
        value: str,
    ) -> str:
        value = value.strip()

        if not value:
            raise ValueError(
                "product_id must not be blank"
            )

        return value


class OrderCreate(BaseModel):
    items: list[
        OrderItemCreate
    ] = Field(
        min_length=1,
        max_length=50,
    )

    shipping_address: str = Field(
        min_length=5,
        max_length=500,
    )

    payment_method: Literal[
        "cash_on_delivery"
    ] = "cash_on_delivery"

    vehicle_id: str | None = Field(
        default=None,
        max_length=100,
    )

    @field_validator(
        "shipping_address",
    )
    @classmethod
    def normalize_shipping_address(
        cls,
        value: str,
    ) -> str:
        value = value.strip()

        if len(value) < 5:
            raise ValueError(
                "shipping_address is too short"
            )

        return value

    @field_validator(
        "vehicle_id",
    )
    @classmethod
    def normalize_vehicle_id(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        value = value.strip()

        return value or None


class OrderItemPublic(BaseModel):
    product_id: str

    name: str
    slug: str
    sku: str

    image_url: str | None = None

    unit_price: float
    quantity: int
    line_total: float


class OrderPublic(BaseModel):
    id: str
    order_number: str

    vehicle_id: str | None = None

    items: list[
        OrderItemPublic
    ]

    subtotal: float
    delivery_fee: float
    discount: float
    total: float

    payment_method: str
    payment_status: str

    shipping_address: str

    status: str

    created_at: datetime
    updated_at: datetime
