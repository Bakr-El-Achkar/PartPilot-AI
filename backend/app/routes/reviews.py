from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from app.dependencies.auth import (
    get_current_user,
)

from app.schemas.review import (
    ReviewCreate,
    ReviewEligibility,
    ReviewPublic,
)

from app.services.review_service import (
    ReviewAlreadyExistsError,
    ReviewNotEligibleError,
    ReviewProductNotFoundError,
    review_service,
)


router = APIRouter(
    prefix=
        "/api/reviews",

    tags=[
        "Reviews",
    ],
)


@router.get(
    "/product/{product_id}",
    response_model=
        list[
            ReviewPublic
        ],
)
def list_product_reviews(
    product_id: str,
):
    return (
        review_service
        .list_product_reviews(
            product_id
        )
    )


@router.get(
    "/eligibility/{product_id}",
    response_model=
        ReviewEligibility,
)
def get_review_eligibility(
    product_id: str,
    current_user:
        dict = Depends(
            get_current_user
        ),
):
    try:
        return (
            review_service
            .get_eligibility(
                user_id=
                    str(
                        current_user[
                            "_id"
                        ]
                    ),

                product_id=
                    product_id,
            )
        )

    except (
        ReviewProductNotFoundError
    ) as exc:
        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,

            detail=
                str(exc),
        ) from exc


@router.post(
    "",
    response_model=
        ReviewPublic,

    status_code=
        status.HTTP_201_CREATED,
)
def create_review(
    payload:
        ReviewCreate,

    current_user:
        dict = Depends(
            get_current_user
        ),
):
    try:
        return (
            review_service
            .create_review(
                current_user,
                payload,
            )
        )

    except (
        ReviewProductNotFoundError
    ) as exc:
        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,

            detail=
                str(exc),
        ) from exc

    except (
        ReviewAlreadyExistsError
    ) as exc:
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,

            detail=
                str(exc),
        ) from exc

    except (
        ReviewNotEligibleError
    ) as exc:
        raise HTTPException(
            status_code=
                status.HTTP_403_FORBIDDEN,

            detail=
                str(exc),
        ) from exc
