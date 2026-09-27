from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Response,
    status,
)

from app.dependencies.auth import (
    get_current_user,
)
from app.schemas.vehicle import (
    VehicleCreate,
    VehiclePublic,
    VehicleUpdate,
)
from app.schemas.vehicle_preview import (
    VehiclePreviewResponse,
)
from app.services.vehicle_image_service import (
    vehicle_image_service,
)
from app.services.vehicle_service import (
    vehicle_service,
)


router = APIRouter(
    prefix="/api/vehicles",
    tags=["Vehicles"],
)


def get_user_id(
    current_user: dict,
) -> str:
    return str(current_user["_id"])


@router.post(
    "",
    response_model=VehiclePublic,
    status_code=status.HTTP_201_CREATED,
)
def create_vehicle(
    vehicle: VehicleCreate,
    current_user: dict = Depends(
        get_current_user
    ),
):
    user_id = get_user_id(
        current_user
    )

    return vehicle_service.create_vehicle(
        user_id,
        vehicle,
    )


@router.get(
    "",
    response_model=list[VehiclePublic],
)
def list_vehicles(
    current_user: dict = Depends(
        get_current_user
    ),
):
    user_id = get_user_id(
        current_user
    )

    return vehicle_service.list_vehicles(
        user_id
    )


# IMPORTANT:
# This must appear before /{vehicle_id}
@router.get(
    "/preview/image",
    response_model=VehiclePreviewResponse,
)
def preview_vehicle_image(
    year: int,
    make: str,
    model: str,
    current_user: dict = Depends(
        get_current_user
    ),
):
    return vehicle_image_service.get_vehicle_image(
        year=year,
        make=make,
        model=model,
    )


@router.get(
    "/{vehicle_id}",
    response_model=VehiclePublic,
)
def get_vehicle(
    vehicle_id: str,
    current_user: dict = Depends(
        get_current_user
    ),
):
    user_id = get_user_id(
        current_user
    )

    vehicle = vehicle_service.get_vehicle(
        vehicle_id,
        user_id,
    )

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found",
        )

    return vehicle


@router.patch(
    "/{vehicle_id}",
    response_model=VehiclePublic,
)
def update_vehicle(
    vehicle_id: str,
    vehicle_update: VehicleUpdate,
    current_user: dict = Depends(
        get_current_user
    ),
):
    user_id = get_user_id(
        current_user
    )

    vehicle = vehicle_service.update_vehicle(
        vehicle_id,
        user_id,
        vehicle_update,
    )

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found",
        )

    return vehicle


@router.patch(
    "/{vehicle_id}/active",
    response_model=VehiclePublic,
)
def set_active_vehicle(
    vehicle_id: str,
    current_user: dict = Depends(
        get_current_user
    ),
):
    user_id = get_user_id(
        current_user
    )

    vehicle = vehicle_service.set_active_vehicle(
        vehicle_id,
        user_id,
    )

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found",
        )

    return vehicle


@router.delete(
    "/{vehicle_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_vehicle(
    vehicle_id: str,
    current_user: dict = Depends(
        get_current_user
    ),
):
    user_id = get_user_id(
        current_user
    )

    deleted = vehicle_service.delete_vehicle(
        vehicle_id,
        user_id,
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found",
        )

    return Response(
        status_code=status.HTTP_204_NO_CONTENT
    )