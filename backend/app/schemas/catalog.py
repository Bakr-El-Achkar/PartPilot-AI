from datetime import datetime
from typing import Optional

from pydantic import (
    BaseModel,
    Field,
    HttpUrl,
    model_validator,
)


class SubcategoryInput(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=80,
    )


class SubcategoryPublic(BaseModel):
    name: str
    slug: str


class CategoryCreate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=80,
    )

    description: Optional[str] = Field(
        default=None,
        max_length=500,
    )

    icon: Optional[str] = Field(
        default=None,
        max_length=100,
    )

    subcategories: list[
        SubcategoryInput
    ] = Field(
        default_factory=list
    )


class CategoryPublic(BaseModel):
    id: str

    name: str
    slug: str

    description: Optional[str] = None
    icon: Optional[str] = None

    subcategories: list[
        SubcategoryPublic
    ]

    is_active: bool

    created_at: datetime
    updated_at: datetime


class BrandCreate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=100,
    )

    description: Optional[str] = Field(
        default=None,
        max_length=1000,
    )

    country: Optional[str] = Field(
        default=None,
        max_length=80,
    )

    website: Optional[HttpUrl] = None
    logo_url: Optional[HttpUrl] = None


class BrandPublic(BaseModel):
    id: str

    name: str
    slug: str

    description: Optional[str] = None
    country: Optional[str] = None

    website: Optional[str] = None
    logo_url: Optional[str] = None

    is_active: bool

    created_at: datetime
    updated_at: datetime


class ProductCreate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=200,
    )

    sku: str = Field(
        min_length=3,
        max_length=60,
    )

    part_number: str = Field(
        min_length=1,
        max_length=100,
    )

    brand_id: str = Field(
        min_length=1,
    )

    category_id: str = Field(
        min_length=1,
    )

    subcategory_slug: str = Field(
        min_length=1,
        max_length=100,
    )

    description: str = Field(
        min_length=1,
        max_length=5000,
    )

    price: float = Field(
        gt=0,
    )

    sale_price: Optional[float] = Field(
        default=None,
        gt=0,
    )

    stock_quantity: int = Field(
        ge=0,
    )

    images: list[str] = Field(
        default_factory=list,
        max_length=10,
    )

    specifications: dict[
        str,
        str,
    ] = Field(
        default_factory=dict,
    )

    warranty: Optional[str] = Field(
        default=None,
        max_length=250,
    )

    @model_validator(mode="after")
    def validate_sale_price(
        self,
    ):
        if (
            self.sale_price
            is not None
            and self.sale_price
            > self.price
        ):
            raise ValueError(
                "Sale price cannot be greater than regular price"
            )

        return self


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=200,
    )

    part_number: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    brand_id: Optional[str] = None

    category_id: Optional[str] = None

    subcategory_slug: Optional[str] = None

    description: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=5000,
    )

    price: Optional[float] = Field(
        default=None,
        gt=0,
    )

    sale_price: Optional[float] = Field(
        default=None,
        gt=0,
    )

    stock_quantity: Optional[int] = Field(
        default=None,
        ge=0,
    )

    images: Optional[list[str]] = None

    specifications: Optional[
        dict[str, str]
    ] = None

    warranty: Optional[str] = Field(
        default=None,
        max_length=250,
    )

    is_active: Optional[bool] = None


class ProductPublic(BaseModel):
    id: str

    name: str
    slug: str

    sku: str
    part_number: str

    brand_id: str
    category_id: str
    subcategory_slug: str

    description: str

    price: float
    sale_price: Optional[float] = None

    stock_quantity: int

    images: list[str]

    specifications: dict[
        str,
        str,
    ]

    warranty: Optional[str] = None

    rating_average: float = 0
    review_count: int = 0

    is_active: bool

    created_at: datetime
    updated_at: datetime