from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class VehicleCreate(BaseModel):
    year: int = Field(
        ge=1950,
        le=2100,
    )

    make: str = Field(
        min_length=2,
        max_length=50,
        examples=["Toyota"],
    )

    model: str = Field(
        min_length=1,
        max_length=80,
        examples=["Camry"],
    )

    engine: str = Field(
        min_length=1,
        max_length=100,
        examples=["2.5L I4"],
    )

    transmission: str = Field(
        min_length=1,
        max_length=60,
        examples=["Automatic"],
    )

    nickname: Optional[str] = Field(
        default=None,
        max_length=50,
        examples=["My Camry"],
    )

    image_url: Optional[str] = Field(
        default=None,
        max_length=2000,
    )


class VehicleUpdate(BaseModel):
    year: Optional[int] = Field(
        default=None,
        ge=1950,
        le=2100,
    )

    make: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=50,
    )

    model: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=80,
    )

    engine: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    transmission: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=60,
    )

    nickname: Optional[str] = Field(
        default=None,
        max_length=50,
    )

    image_url: Optional[str] = Field(
        default=None,
        max_length=2000,
    )


class VehiclePublic(BaseModel):
    id: str
    user_id: str

    year: int
    make: str
    model: str
    engine: str
    transmission: str

    nickname: Optional[str] = None
    image_url: Optional[str] = None

    is_active: bool

    created_at: datetime
    updated_at: datetime