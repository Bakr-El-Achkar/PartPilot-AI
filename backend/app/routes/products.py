from typing import Literal

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)

from app.dependencies.auth import (
    get_current_user,
)

from app.schemas.catalog import (
    ProductCreate,
    ProductPublic,
    ProductUpdate,
)

from app.services.product_service import (
    ProductAlreadyExistsError,
    ProductReferenceError,
    ProductValidationError,
    product_service,
)


router = APIRouter(
    prefix="/api/products",
    tags=["Products"],
)


# =============================================================
# ADMIN GUARD
# =============================================================

def require_admin(
    current_user: dict,
) -> None:
    if (
        current_user.get("role")
        != "admin"
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_403_FORBIDDEN
            ),
            detail="Admin access required",
        )


# =============================================================
# LIST PRODUCTS
#
# Public marketplace endpoint.
#
# Supports:
# - category
# - brand
# - subcategory
# - search
# - price range
# - availability
# - sorting
# =============================================================

@router.get(
    "",
    response_model=list[ProductPublic],
)
def list_products(
    category_id: str | None = Query(
        default=None,
    ),
    brand_id: str | None = Query(
        default=None,
    ),
    subcategory_slug: str | None = Query(
        default=None,
    ),
    search: str | None = Query(
        default=None,
        min_length=1,
        max_length=120,
    ),
    min_price: float | None = Query(
        default=None,
        ge=0,
    ),
    max_price: float | None = Query(
        default=None,
        ge=0,
    ),
    in_stock: bool | None = Query(
        default=None,
    ),
    sort: Literal[
        "recommended",
        "price_asc",
        "price_desc",
        "rating",
        "newest",
    ] = Query(
        default="recommended",
    ),
):
    if (
        min_price is not None
        and max_price is not None
        and min_price > max_price
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_422_UNPROCESSABLE_ENTITY
            ),
            detail=(
                "min_price cannot be "
                "greater than max_price"
            ),
        )

    service_filters: dict = {
        "category_id": category_id,
        "brand_id": brand_id,
        "subcategory_slug": (
            subcategory_slug
        ),
    }

    if (
        search is not None
        and search.strip()
    ):
        service_filters[
            "search"
        ] = search.strip()

    if min_price is not None:
        service_filters[
            "min_price"
        ] = min_price

    if max_price is not None:
        service_filters[
            "max_price"
        ] = max_price

    if in_stock is not None:
        service_filters[
            "in_stock"
        ] = in_stock

    if sort != "recommended":
        service_filters[
            "sort"
        ] = sort

    try:
        return (
            product_service
            .list_products(
                **service_filters
            )
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_422_UNPROCESSABLE_ENTITY
            ),
            detail=str(exc),
        ) from exc


# =============================================================
# GET PRODUCT BY SLUG
#
# IMPORTANT:
# This route must appear before "/{product_id}".
# =============================================================

@router.get(
    "/slug/{slug}",
    response_model=ProductPublic,
)
def get_product_by_slug(
    slug: str,
):
    product = (
        product_service
        .get_product_by_slug(
            slug
        )
    )

    if product is None:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail="Product not found",
        )

    return product


# =============================================================
# GET PRODUCT BY ID
# =============================================================

@router.get(
    "/{product_id}",
    response_model=ProductPublic,
)
def get_product(
    product_id: str,
):
    product = (
        product_service.get_product(
            product_id
        )
    )

    if product is None:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail="Product not found",
        )

    return product


# =============================================================
# CREATE PRODUCT
# =============================================================

@router.post(
    "",
    response_model=ProductPublic,
    status_code=(
        status.HTTP_201_CREATED
    ),
)
def create_product(
    product: ProductCreate,
    current_user: dict = Depends(
        get_current_user
    ),
):
    require_admin(
        current_user
    )

    try:
        return (
            product_service
            .create_product(
                product
            )
        )

    except ProductAlreadyExistsError as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_409_CONFLICT
            ),
            detail=str(exc),
        ) from exc

    except ProductReferenceError as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=str(exc),
        ) from exc

    except ProductValidationError as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=str(exc),
        ) from exc


# =============================================================
# UPDATE PRODUCT
# =============================================================

@router.patch(
    "/{product_id}",
    response_model=ProductPublic,
)
def update_product(
    product_id: str,
    update: ProductUpdate,
    current_user: dict = Depends(
        get_current_user
    ),
):
    require_admin(
        current_user
    )

    try:
        product = (
            product_service
            .update_product(
                product_id,
                update,
            )
        )

    except ProductAlreadyExistsError as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_409_CONFLICT
            ),
            detail=str(exc),
        ) from exc

    except ProductReferenceError as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=str(exc),
        ) from exc

    except ProductValidationError as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=str(exc),
        ) from exc

    if product is None:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail="Product not found",
        )

    return product
