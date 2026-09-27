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

from app.schemas.catalog import (
    ProductPublic,
)

from app.services.wishlist_service import (
    WishlistItemNotFoundError,
    WishlistProductNotFoundError,
    wishlist_service,
)


router = APIRouter(
    prefix="/api/wishlist",
    tags=[
        "Wishlist",
    ],
)


def get_user_id(
    current_user: dict,
) -> str:
    return str(
        current_user[
            "_id"
        ]
    )


@router.get(
    "",
    response_model=list[
        ProductPublic
    ],
)
def get_wishlist(
    current_user:
        dict = Depends(
            get_current_user
        ),
):
    return (
        wishlist_service
        .list_products(
            get_user_id(
                current_user
            )
        )
    )


@router.get(
    "/product-ids",
    response_model=list[
        str
    ],
)
def get_wishlist_product_ids(
    current_user:
        dict = Depends(
            get_current_user
        ),
):
    return (
        wishlist_service
        .list_product_ids(
            get_user_id(
                current_user
            )
        )
    )


@router.post(
    "/{product_id}",
    response_model=
        ProductPublic,

    status_code=
        status.HTTP_201_CREATED,
)
def add_to_wishlist(
    product_id: str,

    current_user:
        dict = Depends(
            get_current_user
        ),
):
    try:
        return (
            wishlist_service
            .add_product(
                get_user_id(
                    current_user
                ),
                product_id,
            )
        )

    except (
        WishlistProductNotFoundError
    ) as exc:
        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,

            detail=
                str(
                    exc
                ),
        ) from exc


@router.delete(
    "/{product_id}",
    status_code=
        status.HTTP_204_NO_CONTENT,
)
def remove_from_wishlist(
    product_id: str,

    current_user:
        dict = Depends(
            get_current_user
        ),
):
    try:
        wishlist_service.remove_product(
            get_user_id(
                current_user
            ),
            product_id,
        )

    except (
        WishlistItemNotFoundError
    ) as exc:
        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,

            detail=
                str(
                    exc
                ),
        ) from exc


    return Response(
        status_code=
            status.HTTP_204_NO_CONTENT
    )
