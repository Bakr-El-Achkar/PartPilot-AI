from datetime import (
    datetime,
    timezone,
)

from app.repositories.admin_repository import (
    AdminDashboardRepository,
    admin_dashboard_repository,
)

from app.repositories.notification_repository import (
    notification_repository,
)


class NotificationTargetNotFoundError(
    Exception
):
    pass


class NotificationTargetInactiveError(
    Exception
):
    pass


def serialize_notification(
    notification: dict,
) -> dict:
    return {
        "id":
            str(
                notification[
                    "_id"
                ]
            ),

        "user_id":
            str(
                notification.get(
                    "user_id",
                    "",
                )
            ),

        "category":
            notification.get(
                "category",
                "general",
            ),

        "title":
            notification.get(
                "title",
                "",
            ),

        "message":
            notification.get(
                "message",
                "",
            ),

        "link":
            notification.get(
                "link"
            ),

        "source":
            notification.get(
                "source",
                "system",
            ),

        "is_read":
            bool(
                notification.get(
                    "is_read",
                    False,
                )
            ),

        "read_at":
            notification.get(
                "read_at"
            ),

        "created_at":
            notification[
                "created_at"
            ],
    }


class NotificationService:
    def __init__(
        self,
        repository,
    ):
        self.repository = (
            repository
        )


    def list_for_user(
        self,
        current_user: dict,
    ) -> list[dict]:
        user_id = str(
            current_user[
                "_id"
            ]
        )


        return [
            serialize_notification(
                notification
            )
            for notification
            in self.repository
            .list_by_user(
                user_id
            )
        ]


    def mark_read(
        self,
        *,
        current_user: dict,
        notification_id: str,
    ) -> dict | None:
        user_id = str(
            current_user[
                "_id"
            ]
        )


        notification = (
            self.repository
            .mark_read(
                notification_id=
                    notification_id,

                user_id=
                    user_id,

                read_at=
                    datetime.now(
                        timezone.utc
                    ),
            )
        )


        if notification is None:
            return None


        return serialize_notification(
            notification
        )


    def mark_all_read(
        self,
        current_user: dict,
    ) -> int:
        return (
            self.repository
            .mark_all_read(
                user_id=
                    str(
                        current_user[
                            "_id"
                        ]
                    ),

                read_at=
                    datetime.now(
                        timezone.utc
                    ),
            )
        )


class AdminNotificationService:
    def __init__(
        self,
        *,
        notification_repository,
        admin_repository:
            AdminDashboardRepository,
    ):
        self.notification_repository = (
            notification_repository
        )

        self.admin_repository = (
            admin_repository
        )


    def list_notifications(
        self,
    ) -> list[dict]:
        return [
            self._serialize_admin(
                notification
            )
            for notification
            in self.notification_repository
            .list_all()
        ]


    def get_notification(
        self,
        notification_id: str,
    ) -> dict | None:
        notification = (
            self.notification_repository
            .find_by_id(
                notification_id
            )
        )


        if notification is None:
            return None


        return (
            self._serialize_admin(
                notification
            )
        )


    def create_notifications(
        self,
        *,
        current_admin: dict,
        payload,
    ) -> list[dict]:
        if (
            payload.audience
            == "user"
        ):
            recipient = (
                self.admin_repository
                .find_user_by_id(
                    payload.user_id
                )
            )


            if recipient is None:
                raise (
                    NotificationTargetNotFoundError(
                        "Notification recipient not found"
                    )
                )


            if not recipient.get(
                "is_active",
                True,
            ):
                raise (
                    NotificationTargetInactiveError(
                        "Notification recipient is inactive"
                    )
                )


            recipients = [
                recipient
            ]

        else:
            recipients = [
                user
                for user
                in self.admin_repository
                .list_users()
                if (
                    user.get(
                        "role",
                        "customer",
                    )
                    == "customer"

                    and user.get(
                        "is_active",
                        True,
                    )
                )
            ]


        now = datetime.now(
            timezone.utc
        )


        created = []


        for recipient in (
            recipients
        ):
            notification = (
                self.notification_repository
                .create(
                    {
                        "user_id":
                            str(
                                recipient[
                                    "_id"
                                ]
                            ),

                        "category":
                            payload.category,

                        "title":
                            payload.title,

                        "message":
                            payload.message,

                        "link":
                            payload.link,

                        "source":
                            "admin",

                        "created_by_admin_id":
                            str(
                                current_admin[
                                    "_id"
                                ]
                            ),

                        "is_read":
                            False,

                        "read_at":
                            None,

                        "created_at":
                            now,
                    }
                )
            )


            created.append(
                self._serialize_admin(
                    notification
                )
            )


        return created


    def _serialize_admin(
        self,
        notification: dict,
    ) -> dict:
        result = (
            serialize_notification(
                notification
            )
        )


        recipient = (
            self.admin_repository
            .find_user_by_id(
                result[
                    "user_id"
                ]
            )
        )


        if recipient:
            first_name = str(
                recipient.get(
                    "first_name",
                    "",
                )
                or ""
            ).strip()


            last_name = str(
                recipient.get(
                    "last_name",
                    "",
                )
                or ""
            ).strip()


            recipient_name = (
                f"{first_name} {last_name}"
                .strip()
                or "User"
            )


            recipient_email = str(
                recipient.get(
                    "email",
                    "",
                )
                or ""
            )

        else:
            recipient_name = (
                "Unknown user"
            )

            recipient_email = ""


        return {
            **result,

            "recipient_name":
                recipient_name,

            "recipient_email":
                recipient_email,

            "created_by_admin_id":
                (
                    str(
                        notification[
                            "created_by_admin_id"
                        ]
                    )
                    if notification.get(
                        "created_by_admin_id"
                    )
                    is not None
                    else None
                ),
        }


notification_service = (
    NotificationService(
        repository=
            notification_repository,
    )
)


admin_notification_service = (
    AdminNotificationService(
        notification_repository=
            notification_repository,

        admin_repository=
            admin_dashboard_repository,
    )
)
