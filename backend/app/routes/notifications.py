from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from app.dependencies.auth import (
    get_current_user,
)

from app.schemas.notification import (
    NotificationPublic,
    NotificationReadAllResponse,
)

from app.services.notification_service import (
    notification_service,
)


router = APIRouter(
    prefix="/api",
    tags=[
        "Notifications",
    ],
)


@router.get(
    "/notifications",
    response_model=
        list[
            NotificationPublic
        ],
)
def list_notifications(
    current_user:
        dict = Depends(
            get_current_user
        ),
):
    return (
        notification_service
        .list_for_user(
            current_user
        )
    )


@router.patch(
    "/notifications/read-all",
    response_model=
        NotificationReadAllResponse,
)
def mark_all_notifications_read(
    current_user:
        dict = Depends(
            get_current_user
        ),
):
    updated_count = (
        notification_service
        .mark_all_read(
            current_user
        )
    )


    return {
        "updated_count":
            updated_count,
    }


@router.patch(
    "/notifications/{notification_id}/read",
    response_model=
        NotificationPublic,
)
def mark_notification_read(
    notification_id: str,
    current_user:
        dict = Depends(
            get_current_user
        ),
):
    notification = (
        notification_service
        .mark_read(
            current_user=
                current_user,

            notification_id=
                notification_id,
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
