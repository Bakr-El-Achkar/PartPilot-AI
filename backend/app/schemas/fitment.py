from datetime import datetime

from pydantic import (
    BaseModel,
    Field,
    model_validator,
)


class FitmentCreate(BaseModel):
    product_id: str = Field(
        min_length=1,
    )

    make: str = Field(
        min_length=1,
        max_length=80,
    )

    model: str = Field(
        min_length=1,
        max_length=100,
    )

    year_start: int = Field(
        ge=1950,
        le=2100,
    )

    year_end: int = Field(
        ge=1950,
        le=2100,
    )

    engine: str | None = Field(
        default=None,
        max_length=100,
    )

    transmission: str | None = Field(
        default=None,
        max_length=80,
    )

    @model_validator(
        mode="after"
    )
    def validate_year_range(
        self,
    ):
        if self.year_end < self.year_start:
            raise ValueError(
                "year_end cannot be earlier "
                "than year_start"
            )

        return self


class FitmentPublic(BaseModel):
    id: str
    product_id: str

    make: str
    model: str

    make_normalized: str
    model_normalized: str

    year_start: int
    year_end: int

    engine: str | None = None
    engine_normalized: str | None = None

    transmission: str | None = None
    transmission_normalized: str | None = None

    is_active: bool

    created_at: datetime | None = None
    updated_at: datetime | None = None