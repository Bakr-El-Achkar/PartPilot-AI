from datetime import datetime
from typing import Literal

from pydantic import (
    BaseModel,
    Field,
    field_validator,
    model_validator,
)


NotificationCategory = Literal[
    "general",
    "promotion",
    "account",
]

NotificationSource = Literal[
    "admin",
    "system",
]


class NotificationPublic(
    BaseModel
):
    id: str
    user_id: str

    category: NotificationCategory

    title: str
    message: str

    link: str | None = None

    source: NotificationSource

    is_read: bool
    read_at: datetime | None = None

    created_at: datetime


class NotificationReadAllResponse(
    BaseModel
):
    updated_count: int


class AdminNotificationPublic(
    NotificationPublic
):
    recipient_name: str
    recipient_email: str

    created_by_admin_id: str | None = None


class AdminNotificationCreate(
    BaseModel
):
    audience: Literal[
        "user",
        "all_customers",
    ]

    user_id: str | None = Field(
        default=None,
        max_length=100,
    )

    category: NotificationCategory = (
        "general"
    )

    title: str = Field(
        min_length=2,
        max_length=120,
    )

    message: str = Field(
        min_length=2,
        max_length=1000,
    )

    link: str | None = Field(
        default=None,
        max_length=500,
    )


    @field_validator(
        "title",
        "message",
    )
    @classmethod
    def clean_required_text(
        cls,
        value: str,
    ) -> str:
        value = value.strip()


        if not value:
            raise ValueError(
                "Field cannot be blank."
            )


        return value


    @field_validator(
        "user_id",
        "link",
    )
    @classmethod
    def clean_optional_text(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None


        value = value.strip()


        return (
            value
            or None
        )


    @model_validator(
        mode="after",
    )
    def validate_target(
        self,
    ):
        if (
            self.audience
            == "user"
            and self.user_id
            is None
        ):
            raise ValueError(
                "user_id is required "
                "when audience is user."
            )


        if (
            self.audience
            == "all_customers"
            and self.user_id
            is not None
        ):
            raise ValueError(
                "user_id must not be provided "
                "when audience is all_customers."
            )


        return self
