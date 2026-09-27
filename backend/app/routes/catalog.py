from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from app.dependencies.auth import (
    get_current_user,
)
from app.schemas.catalog import (
    BrandCreate,
    BrandPublic,
    CategoryCreate,
    CategoryPublic,
)
from app.services.catalog_service import (
    CatalogAlreadyExistsError,
    brand_service,
    category_service,
)


router = APIRouter(
    prefix="/api/catalog",
    tags=["Catalog"],
)


def require_admin(
    current_user: dict,
) -> None:
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )


@router.get(
    "/categories",
    response_model=list[CategoryPublic],
)
def list_categories():
    return category_service.list_categories()


@router.post(
    "/categories",
    response_model=CategoryPublic,
    status_code=status.HTTP_201_CREATED,
)
def create_category(
    category: CategoryCreate,
    current_user: dict = Depends(
        get_current_user
    ),
):
    require_admin(current_user)

    try:
        return (
            category_service.create_category(
                category
            )
        )

    except CatalogAlreadyExistsError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.get(
    "/brands",
    response_model=list[BrandPublic],
)
def list_brands():
    return brand_service.list_brands()


@router.post(
    "/brands",
    response_model=BrandPublic,
    status_code=status.HTTP_201_CREATED,
)
def create_brand(
    brand: BrandCreate,
    current_user: dict = Depends(
        get_current_user
    ),
):
    require_admin(current_user)

    try:
        return brand_service.create_brand(
            brand
        )

    except CatalogAlreadyExistsError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc