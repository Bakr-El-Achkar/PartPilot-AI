from datetime import (
    datetime,
)

from pydantic import (
    BaseModel,
    Field,
    field_validator,
)


class ReviewCreate(
    BaseModel
):
    product_id: str = Field(
        min_length=1,
        max_length=100,
    )

    rating: int = Field(
        ge=1,
        le=5,
    )

    comment: str = Field(
        min_length=2,
        max_length=2000,
    )


    @field_validator(
        "product_id",
    )
    @classmethod
    def normalize_product_id(
        cls,
        value: str,
    ) -> str:
        value = (
            value.strip()
        )


        if not value:
            raise ValueError(
                "product_id must not be blank"
            )


        return value


    @field_validator(
        "comment",
    )
    @classmethod
    def normalize_comment(
        cls,
        value: str,
    ) -> str:
        value = (
            value.strip()
        )


        if len(
            value
        ) < 2:
            raise ValueError(
                "Review comment is too short"
            )


        return value


class ReviewPublic(
    BaseModel
):
    id: str

    product_id: str

    customer_name: str

    rating: int
    comment: str

    verified_purchase: bool

    created_at: datetime
    updated_at: datetime


class ReviewEligibility(
    BaseModel
):
    eligible: bool

    reason: str | None = None

    review_id: str | None = None
