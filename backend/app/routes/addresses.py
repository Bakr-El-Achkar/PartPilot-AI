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
from app.schemas.address import (
    AddressCreate,
    AddressPublic,
    AddressUpdate,
)
from app.services.address_service import (
    address_service,
)


router = APIRouter(
    prefix="/api/addresses",
    tags=["Addresses"],
)


def get_user_id(
    current_user: dict,
) -> str:
    return str(
        current_user[
            "_id"
        ]
    )


@router.post(
    "",
    response_model=AddressPublic,
    status_code=(
        status.HTTP_201_CREATED
    ),
)
def create_address(
    payload:
        AddressCreate,

    current_user:
        dict = Depends(
            get_current_user
        ),
):
    return (
        address_service
        .create_address(
            get_user_id(
                current_user
            ),
            payload,
        )
    )


@router.get(
    "",
    response_model=list[
        AddressPublic
    ],
)
def list_addresses(
    current_user:
        dict = Depends(
            get_current_user
        ),
):
    return (
        address_service
        .list_addresses(
            get_user_id(
                current_user
            )
        )
    )


@router.get(
    "/{address_id}",
    response_model=
        AddressPublic,
)
def get_address(
    address_id: str,
    current_user:
        dict = Depends(
            get_current_user
        ),
):
    address = (
        address_service
        .get_address(
            address_id,
            get_user_id(
                current_user
            ),
        )
    )

    if address is None:
        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,

            detail=
                "Address not found",
        )

    return address


@router.patch(
    "/{address_id}",
    response_model=
        AddressPublic,
)
def update_address(
    address_id: str,
    payload:
        AddressUpdate,

    current_user:
        dict = Depends(
            get_current_user
        ),
):
    address = (
        address_service
        .update_address(
            address_id,
            get_user_id(
                current_user
            ),
            payload,
        )
    )

    if address is None:
        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,

            detail=
                "Address not found",
        )

    return address


@router.patch(
    "/{address_id}/default",
    response_model=
        AddressPublic,
)
def set_default_address(
    address_id: str,
    current_user:
        dict = Depends(
            get_current_user
        ),
):
    address = (
        address_service
        .set_default_address(
            address_id,
            get_user_id(
                current_user
            ),
        )
    )

    if address is None:
        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,

            detail=
                "Address not found",
        )

    return address


@router.delete(
    "/{address_id}",
    status_code=
        status.HTTP_204_NO_CONTENT,
)
def delete_address(
    address_id: str,
    current_user:
        dict = Depends(
            get_current_user
        ),
):
    deleted = (
        address_service
        .delete_address(
            address_id,
            get_user_id(
                current_user
            ),
        )
    )

    if not deleted:
        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,

            detail=
                "Address not found",
        )

    return Response(
        status_code=
            status.HTTP_204_NO_CONTENT
    )
