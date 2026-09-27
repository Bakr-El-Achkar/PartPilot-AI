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
    ProductPublic,
)
from app.schemas.fitment import (
    FitmentCreate,
    FitmentPublic,
)
from app.services.fitment_service import (
    FitmentAlreadyExistsError,
    FitmentReferenceError,
    FitmentVehicleNotFoundError,
    fitment_service,
)


router = APIRouter(
    prefix="/api/fitments",
    tags=["Fitments"],
)


def require_admin(
    current_user: dict,
) -> None:
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=(
                status.HTTP_403_FORBIDDEN
            ),
            detail="Admin access required",
        )


@router.get(
    "/product/{product_id}",
    response_model=list[FitmentPublic],
)
def list_product_fitments(
    product_id: str,
):
    return (
        fitment_service
        .list_product_fitments(
            product_id
        )
    )


@router.get(
    "/compatible/{vehicle_id}",
    response_model=list[ProductPublic],
)
def get_compatible_products(
    vehicle_id: str,
    current_user: dict = Depends(
        get_current_user
    ),
):
    user_id = str(
        current_user["_id"]
    )

    try:
        return (
            fitment_service
            .get_compatible_products(
                vehicle_id=vehicle_id,
                user_id=user_id,
            )
        )

    except FitmentVehicleNotFoundError as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail=str(exc),
        ) from exc


@router.post(
    "",
    response_model=FitmentPublic,
    status_code=(
        status.HTTP_201_CREATED
    ),
)
def create_fitment(
    fitment: FitmentCreate,
    current_user: dict = Depends(
        get_current_user
    ),
):
    require_admin(
        current_user
    )

    try:
        return (
            fitment_service
            .create_fitment(
                fitment
            )
        )

    except FitmentAlreadyExistsError as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_409_CONFLICT
            ),
            detail=str(exc),
        ) from exc

    except FitmentReferenceError as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=str(exc),
        ) from exc