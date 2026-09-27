from fastapi import (
    APIRouter,
    Query,
)

from app.schemas.vehicle_catalog import (
    VehicleOptionsResponse,
)

from app.services.vehicle_catalog_service import (
    vehicle_catalog_service,
)


router = APIRouter(
    prefix="/api/vehicle-catalog",
    tags=["Vehicle Catalog"],
)


@router.get(
    "/makes",
    response_model=list[str],
)
def get_vehicle_makes():
    return (
        vehicle_catalog_service
        .get_makes()
    )


@router.get(
    "/models",
    response_model=list[str],
)
def get_vehicle_models(
    make: str = Query(
        ...,
        min_length=1,
    ),
):
    return (
        vehicle_catalog_service
        .get_models(
            make=make
        )
    )


@router.get(
    "/years",
    response_model=list[int],
)
def get_vehicle_years(
    make: str = Query(
        ...,
        min_length=1,
    ),
    model: str = Query(
        ...,
        min_length=1,
    ),
):
    return (
        vehicle_catalog_service
        .get_years(
            make=make,
            model=model,
        )
    )


@router.get(
    "/options",
    response_model=VehicleOptionsResponse,
)
def get_vehicle_options(
    make: str = Query(
        ...,
        min_length=1,
    ),
    model: str = Query(
        ...,
        min_length=1,
    ),
    year: int = Query(
        ...,
        ge=1950,
        le=2100,
    ),
):
    return (
        vehicle_catalog_service
        .get_options(
            make=make,
            model=model,
            year=year,
        )
    )