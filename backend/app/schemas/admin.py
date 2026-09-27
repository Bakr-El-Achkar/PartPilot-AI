from typing import (
    Literal,
)

from pydantic import (
    BaseModel,
)

from app.schemas.order import (
    OrderPublic,
)


from app.schemas.ai_mechanic import (
    AIMechanicMessage,
    AIMechanicTurn,
    SafetyLevel,
    SessionStatus,
)


class AdminOverview(
    BaseModel
):
    products: int
    fitments: int
    orders: int
    orders_this_month: int
    processing_orders: int
    users: int
    categories: int
    brands: int
    low_stock_items: int
    revenue: float


class AdminOrderPublic(
    OrderPublic
):
    user_id: str

    customer_name: str
    customer_email: str
    customer_phone: str | None = None


class AdminOrderStatusUpdate(
    BaseModel
):
    status: Literal[
        "processing",
        "shipped",
        "delivered",
        "cancelled",
    ]


from pydantic import (
    Field,
    HttpUrl,
)

from app.schemas.catalog import (
    SubcategoryInput,
)


class AdminCategoryUpdate(
    BaseModel
):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=80,
    )

    description: str | None = Field(
        default=None,
        max_length=500,
    )

    icon: str | None = Field(
        default=None,
        max_length=100,
    )

    subcategories: list[
        SubcategoryInput
    ] | None = None

    is_active: bool | None = None


class AdminBrandUpdate(
    BaseModel
):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    description: str | None = Field(
        default=None,
        max_length=1000,
    )

    country: str | None = Field(
        default=None,
        max_length=80,
    )

    website: HttpUrl | None = None
    logo_url: HttpUrl | None = None

    is_active: bool | None = None


class AdminFitmentUpdate(
    BaseModel
):
    product_id: str | None = Field(
        default=None,
        min_length=1,
    )

    make: str | None = Field(
        default=None,
        min_length=1,
        max_length=80,
    )

    model: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    year_start: int | None = Field(
        default=None,
        ge=1950,
        le=2100,
    )

    year_end: int | None = Field(
        default=None,
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

    is_active: bool | None = None


from datetime import datetime
from typing import Literal


class AdminUserPublic(
    BaseModel
):
    id: str

    first_name: str
    last_name: str

    email: str
    phone: str | None = None

    role: str
    is_active: bool

    created_at: datetime | None = None
    updated_at: datetime | None = None


class AdminUserUpdate(
    BaseModel
):
    role: Literal[
        "customer",
        "admin",
    ] | None = None

    is_active: bool | None = None


# =============================================================
# ADMIN REVIEWS
# =============================================================

class AdminReviewPublic(
    BaseModel
):
    id: str

    product_id: str
    product_name: str
    product_slug: str
    product_sku: str

    user_id: str
    customer_name: str
    customer_email: str

    order_id: str
    order_number: str

    rating: int
    comment: str

    verified_purchase: bool
    is_active: bool

    created_at: datetime | None = None
    updated_at: datetime | None = None


class AdminReviewStatusUpdate(
    BaseModel
):
    is_active: bool


# =============================================================
# ADMIN AI SESSIONS
# =============================================================

class AdminAISessionPublic(
    BaseModel
):
    id: str

    user_id: str
    customer_name: str
    customer_email: str

    vehicle_id: str
    vehicle_year: int | None = None
    vehicle_make: str
    vehicle_model: str
    vehicle_engine: str | None = None
    vehicle_transmission: str | None = None
    vehicle_nickname: str | None = None

    status: SessionStatus

    messages: list[
        AIMechanicMessage
    ]

    latest_turn: (
        AIMechanicTurn
        | None
    ) = None

    message_count: int

    safety_level: (
        SafetyLevel
        | None
    ) = None

    created_at: datetime
    updated_at: datetime

