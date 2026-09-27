from pydantic import BaseModel, Field, model_validator


class VehicleCatalogCreate(BaseModel):
    make: str = Field(min_length=1, max_length=80)
    model: str = Field(min_length=1, max_length=120)

    year_start: int = Field(ge=1950, le=2100)
    year_end: int = Field(ge=1950, le=2100)

    engines: list[str] = Field(default_factory=list)
    transmissions: list[str] = Field(default_factory=list)

    is_active: bool = True

    @model_validator(mode="after")
    def validate_year_range(self):
        if self.year_end < self.year_start:
            raise ValueError(
                "year_end must be greater than or equal to year_start"
            )

        return self


class VehicleOptionsResponse(BaseModel):
    make: str
    model: str
    year: int

    engines: list[str]
    transmissions: list[str]