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
    BrandPublic,
    CategoryPublic,
    ProductPublic,
)

from app.schemas.admin import (
    AdminAISessionPublic,
    AdminReviewPublic,
    AdminReviewStatusUpdate,
    AdminUserPublic,
    AdminUserUpdate,
    AdminFitmentUpdate,
    AdminBrandUpdate,
    AdminCategoryUpdate,
    AdminOrderPublic,
    AdminOrderStatusUpdate,
    AdminOverview,
)

from app.schemas.fitment import (
    FitmentPublic,
)


from app.schemas.notification import (
    AdminNotificationCreate,
    AdminNotificationPublic,
)

from app.services.admin_service import (
    AdminUserSafetyError,
    AdminFitmentAlreadyExistsError,
    AdminFitmentReferenceError,
    AdminFitmentValidationError,
    AdminCatalogAlreadyExistsError,
    AdminCatalogValidationError,
    AdminOrderInventoryError,
    AdminOrderStatusTransitionError,
    admin_ai_session_service,
    admin_catalog_service,
    admin_dashboard_service,
    admin_review_service,
    admin_user_service,
    admin_fitment_service,
    admin_order_service,
    admin_product_service,
)


from app.services.notification_service import (
    NotificationTargetInactiveError,
    NotificationTargetNotFoundError,
    admin_notification_service,
)


router = APIRouter(
    prefix="/api/admin",
    tags=[
        "Admin",
    ],
)


def require_admin(
    current_user:
        dict = Depends(
            get_current_user
        ),
) -> dict:
    if (
        current_user.get(
            "role"
        )
        != "admin"
    ):
        raise HTTPException(
            status_code=
                status.HTTP_403_FORBIDDEN,

            detail=
                "Admin access required",
        )


    return current_user


# =============================================================
# OVERVIEW
# =============================================================

@router.get(
    "/overview",
    response_model=
        AdminOverview,
)
def get_admin_overview(
    _current_user:
        dict = Depends(
            require_admin
        ),
):
    return (
        admin_dashboard_service
        .get_overview()
    )


# =============================================================
# CATEGORIES
# =============================================================

@router.get(
    "/categories",
    response_model=
        list[
            CategoryPublic
        ],
)
def list_admin_categories(
    _current_user:
        dict = Depends(
            require_admin
        ),
):
    return (
        admin_catalog_service
        .list_categories()
    )


@router.patch(
    "/categories/{category_id}",
    response_model=
        CategoryPublic,
)
def update_admin_category(
    category_id: str,
    payload:
        AdminCategoryUpdate,
    _current_user:
        dict = Depends(
            require_admin
        ),
):
    try:
        category = (
            admin_catalog_service
            .update_category(
                category_id,
                payload,
            )
        )

    except (
        AdminCatalogAlreadyExistsError
    ) as exc:
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,

            detail=
                str(exc),
        ) from exc

    except (
        AdminCatalogValidationError
    ) as exc:
        raise HTTPException(
            status_code=
                status.HTTP_400_BAD_REQUEST,

            detail=
                str(exc),
        ) from exc


    if category is None:
        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,

            detail=
                "Category not found",
        )


    return category


# =============================================================
# BRANDS
# =============================================================

@router.get(
    "/brands",
    response_model=
        list[
            BrandPublic
        ],
)
def list_admin_brands(
    _current_user:
        dict = Depends(
            require_admin
        ),
):
    return (
        admin_catalog_service
        .list_brands()
    )


@router.patch(
    "/brands/{brand_id}",
    response_model=
        BrandPublic,
)
def update_admin_brand(
    brand_id: str,
    payload:
        AdminBrandUpdate,
    _current_user:
        dict = Depends(
            require_admin
        ),
):
    try:
        brand = (
            admin_catalog_service
            .update_brand(
                brand_id,
                payload,
            )
        )

    except (
        AdminCatalogAlreadyExistsError
    ) as exc:
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,

            detail=
                str(exc),
        ) from exc


    if brand is None:
        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,

            detail=
                "Brand not found",
        )


    return brand


# =============================================================
# USERS
# =============================================================

@router.get(
    "/users",
    response_model=
        list[
            AdminUserPublic
        ],
)
def list_admin_users(
    _current_user:
        dict = Depends(
            require_admin
        ),
):
    return (
        admin_user_service
        .list_users()
    )


@router.get(
    "/users/{user_id}",
    response_model=
        AdminUserPublic,
)
def get_admin_user(
    user_id: str,
    _current_user:
        dict = Depends(
            require_admin
        ),
):
    user = (
        admin_user_service
        .get_user(
            user_id
        )
    )


    if user is None:
        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,

            detail=
                "User not found",
        )


    return user


@router.patch(
    "/users/{user_id}",
    response_model=
        AdminUserPublic,
)
def update_admin_user(
    user_id: str,
    payload:
        AdminUserUpdate,
    current_user:
        dict = Depends(
            require_admin
        ),
):
    try:
        user = (
            admin_user_service
            .update_user(
                user_id,
                payload,
                current_admin_id=
                    str(
                        current_user[
                            "_id"
                        ]
                    ),
            )
        )

    except (
        AdminUserSafetyError
    ) as exc:
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,

            detail=
                str(exc),
        ) from exc


    if user is None:
        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,

            detail=
                "User not found",
        )


    return user


# =============================================================
# FITMENTS
# =============================================================

@router.get(
    "/fitments",
    response_model=
        list[
            FitmentPublic
        ],
)
def list_admin_fitments(
    _current_user:
        dict = Depends(
            require_admin
        ),
):
    return (
        admin_fitment_service
        .list_fitments()
    )


@router.patch(
    "/fitments/{fitment_id}",
    response_model=
        FitmentPublic,
)
def update_admin_fitment(
    fitment_id: str,
    payload:
        AdminFitmentUpdate,
    _current_user:
        dict = Depends(
            require_admin
        ),
):
    try:
        fitment = (
            admin_fitment_service
            .update_fitment(
                fitment_id,
                payload,
            )
        )

    except (
        AdminFitmentAlreadyExistsError
    ) as exc:
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,

            detail=
                str(exc),
        ) from exc

    except (
        AdminFitmentReferenceError,
        AdminFitmentValidationError,
    ) as exc:
        raise HTTPException(
            status_code=
                status.HTTP_400_BAD_REQUEST,

            detail=
                str(exc),
        ) from exc


    if fitment is None:
        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,

            detail=
                "Fitment not found",
        )


    return fitment


# =============================================================
# NOTIFICATIONS
# =============================================================

@router.get(
    "/notifications",
    response_model=
        list[
            AdminNotificationPublic
        ],
)
def list_admin_notifications(
    _current_user:
        dict = Depends(
            require_admin
        ),
):
    return (
        admin_notification_service
        .list_notifications()
    )


@router.get(
    "/notifications/{notification_id}",
    response_model=
        AdminNotificationPublic,
)
def get_admin_notification(
    notification_id: str,
    _current_user:
        dict = Depends(
            require_admin
        ),
):
    notification = (
        admin_notification_service
        .get_notification(
            notification_id
        )
    )


    if notification is None:
        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,

            detail=
                "Notification not found",
        )


    return notification


@router.post(
    "/notifications",
    response_model=
        list[
            AdminNotificationPublic
        ],
    status_code=
        status.HTTP_201_CREATED,
)
def create_admin_notification(
    payload:
        AdminNotificationCreate,
    current_user:
        dict = Depends(
            require_admin
        ),
):
    try:
        return (
            admin_notification_service
            .create_notifications(
                current_admin=
                    current_user,

                payload=
                    payload,
            )
        )

    except (
        NotificationTargetNotFoundError
    ) as exc:
        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,

            detail=
                str(
                    exc
                ),
        ) from exc

    except (
        NotificationTargetInactiveError
    ) as exc:
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,

            detail=
                str(
                    exc
                ),
        ) from exc


# =============================================================
# AI SESSIONS
# =============================================================

@router.get(
    "/ai-sessions",
    response_model=
        list[
            AdminAISessionPublic
        ],
)
def list_admin_ai_sessions(
    _current_user:
        dict = Depends(
            require_admin
        ),
):
    return (
        admin_ai_session_service
        .list_sessions()
    )


@router.get(
    "/ai-sessions/{session_id}",
    response_model=
        AdminAISessionPublic,
)
def get_admin_ai_session(
    session_id: str,
    _current_user:
        dict = Depends(
            require_admin
        ),
):
    session = (
        admin_ai_session_service
        .get_session(
            session_id
        )
    )


    if session is None:
        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,

            detail=
                "AI session not found",
        )


    return session


# =============================================================
# REVIEWS
# =============================================================

@router.get(
    "/reviews",
    response_model=
        list[
            AdminReviewPublic
        ],
)
def list_admin_reviews(
    _current_user:
        dict = Depends(
            require_admin
        ),
):
    return (
        admin_review_service
        .list_reviews()
    )


@router.get(
    "/reviews/{review_id}",
    response_model=
        AdminReviewPublic,
)
def get_admin_review(
    review_id: str,
    _current_user:
        dict = Depends(
            require_admin
        ),
):
    review = (
        admin_review_service
        .get_review(
            review_id
        )
    )


    if review is None:
        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,

            detail=
                "Review not found",
        )


    return review


@router.patch(
    "/reviews/{review_id}/status",
    response_model=
        AdminReviewPublic,
)
def update_admin_review_status(
    review_id: str,
    payload:
        AdminReviewStatusUpdate,
    _current_user:
        dict = Depends(
            require_admin
        ),
):
    review = (
        admin_review_service
        .update_status(
            review_id,
            payload.is_active,
        )
    )


    if review is None:
        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,

            detail=
                "Review not found",
        )


    return review


# =============================================================
# PRODUCTS
# =============================================================

@router.get(
    "/products",
    response_model=
        list[
            ProductPublic
        ],
)
def list_admin_products(
    _current_user:
        dict = Depends(
            require_admin
        ),
):
    return (
        admin_product_service
        .list_products()
    )


# =============================================================
# ORDERS
# =============================================================

@router.get(
    "/orders",
    response_model=
        list[
            AdminOrderPublic
        ],
)
def list_admin_orders(
    _current_user:
        dict = Depends(
            require_admin
        ),
):
    return (
        admin_order_service
        .list_orders()
    )


@router.get(
    "/orders/{order_id}",
    response_model=
        AdminOrderPublic,
)
def get_admin_order(
    order_id: str,
    _current_user:
        dict = Depends(
            require_admin
        ),
):
    order = (
        admin_order_service
        .get_order(
            order_id
        )
    )


    if order is None:
        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,

            detail=
                "Order not found",
        )


    return order


@router.patch(
    "/orders/{order_id}/status",
    response_model=
        AdminOrderPublic,
)
def update_admin_order_status(
    order_id: str,
    payload:
        AdminOrderStatusUpdate,
    _current_user:
        dict = Depends(
            require_admin
        ),
):
    try:
        order = (
            admin_order_service
            .update_status(
                order_id,
                payload.status,
            )
        )

    except (
        AdminOrderStatusTransitionError
    ) as exc:
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,

            detail=
                str(exc),
        ) from exc

    except (
        AdminOrderInventoryError
    ) as exc:
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,

            detail=
                str(exc),
        ) from exc


    if order is None:
        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,

            detail=
                "Order not found",
        )


    return order
