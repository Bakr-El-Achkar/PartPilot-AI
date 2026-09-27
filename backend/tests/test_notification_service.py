from datetime import (
    datetime,
    timezone,
)

import pytest

from app.schemas.notification import (
    AdminNotificationCreate,
)

from app.services.notification_service import (
    AdminNotificationService,
    NotificationService,
    NotificationTargetInactiveError,
    NotificationTargetNotFoundError,
)


NOW = datetime.now(
    timezone.utc
)


class FakeNotificationRepository:
    def __init__(
        self,
    ):
        self.counter = 0

        self.notifications = [
            {
                "_id":
                    "notification-1",

                "user_id":
                    "customer-1",

                "category":
                    "general",

                "title":
                    "Welcome",

                "message":
                    "Welcome to Vehnexa.",

                "link":
                    None,

                "source":
                    "admin",

                "created_by_admin_id":
                    "admin-1",

                "is_read":
                    False,

                "read_at":
                    None,

                "created_at":
                    NOW,
            },

            {
                "_id":
                    "notification-2",

                "user_id":
                    "customer-2",

                "category":
                    "general",

                "title":
                    "Other",

                "message":
                    "Another user's notification.",

                "link":
                    None,

                "source":
                    "admin",

                "created_by_admin_id":
                    "admin-1",

                "is_read":
                    False,

                "read_at":
                    None,

                "created_at":
                    NOW,
            },
        ]


    def create(
        self,
        document,
    ):
        self.counter += 1

        created = {
            "_id":
                f"created-{self.counter}",

            **document,
        }


        self.notifications.append(
            created
        )


        return created


    def list_by_user(
        self,
        user_id,
    ):
        return [
            item
            for item
            in self.notifications
            if item[
                "user_id"
            ]
            == str(
                user_id
            )
        ]


    def list_all(
        self,
    ):
        return list(
            self.notifications
        )


    def find_by_id(
        self,
        notification_id,
    ):
        return next(
            (
                item
                for item
                in self.notifications
                if item[
                    "_id"
                ]
                == notification_id
            ),
            None,
        )


    def mark_read(
        self,
        *,
        notification_id,
        user_id,
        read_at,
    ):
        item = next(
            (
                candidate
                for candidate
                in self.notifications
                if (
                    candidate[
                        "_id"
                    ]
                    == notification_id

                    and candidate[
                        "user_id"
                    ]
                    == str(
                        user_id
                    )
                )
            ),
            None,
        )


        if item is None:
            return None


        item[
            "is_read"
        ] = True

        item[
            "read_at"
        ] = read_at


        return item


    def mark_all_read(
        self,
        *,
        user_id,
        read_at,
    ):
        count = 0


        for item in (
            self.notifications
        ):
            if (
                item[
                    "user_id"
                ]
                == str(
                    user_id
                )
                and not item[
                    "is_read"
                ]
            ):
                item[
                    "is_read"
                ] = True

                item[
                    "read_at"
                ] = read_at

                count += 1


        return count


class FakeAdminRepository:
    def __init__(
        self,
    ):
        self.users = {
            "customer-1": {
                "_id":
                    "customer-1",

                "first_name":
                    "First",

                "last_name":
                    "Customer",

                "email":
                    "one@example.com",

                "role":
                    "customer",

                "is_active":
                    True,
            },

            "customer-2": {
                "_id":
                    "customer-2",

                "first_name":
                    "Second",

                "last_name":
                    "Customer",

                "email":
                    "two@example.com",

                "role":
                    "customer",

                "is_active":
                    True,
            },

            "inactive-user": {
                "_id":
                    "inactive-user",

                "first_name":
                    "Inactive",

                "last_name":
                    "Customer",

                "email":
                    "inactive@example.com",

                "role":
                    "customer",

                "is_active":
                    False,
            },

            "admin-1": {
                "_id":
                    "admin-1",

                "first_name":
                    "Admin",

                "last_name":
                    "User",

                "email":
                    "admin@example.com",

                "role":
                    "admin",

                "is_active":
                    True,
            },
        }


    def find_user_by_id(
        self,
        user_id,
    ):
        return (
            self.users.get(
                str(
                    user_id
                )
            )
        )


    def list_users(
        self,
    ):
        return list(
            self.users
            .values()
        )


def customer(
    user_id=
        "customer-1",
):
    return {
        "_id":
            user_id,
    }


def admin():
    return {
        "_id":
            "admin-1",
    }


def test_customer_only_lists_own_notifications():
    repository = (
        FakeNotificationRepository()
    )


    service = (
        NotificationService(
            repository=
                repository,
        )
    )


    result = (
        service.list_for_user(
            customer()
        )
    )


    assert (
        len(
            result
        )
        == 1
    )


    assert (
        result[
            0
        ][
            "user_id"
        ]
        == "customer-1"
    )


def test_customer_can_mark_own_notification_read():
    repository = (
        FakeNotificationRepository()
    )


    service = (
        NotificationService(
            repository=
                repository,
        )
    )


    result = (
        service.mark_read(
            current_user=
                customer(),

            notification_id=
                "notification-1",
        )
    )


    assert (
        result is not None
    )


    assert (
        result[
            "is_read"
        ]
        is True
    )


def test_customer_cannot_mark_another_users_notification_read():
    repository = (
        FakeNotificationRepository()
    )


    service = (
        NotificationService(
            repository=
                repository,
        )
    )


    result = (
        service.mark_read(
            current_user=
                customer(),

            notification_id=
                "notification-2",
        )
    )


    assert (
        result
        is None
    )


def test_customer_can_mark_all_own_notifications_read():
    repository = (
        FakeNotificationRepository()
    )


    service = (
        NotificationService(
            repository=
                repository,
        )
    )


    updated_count = (
        service.mark_all_read(
            customer()
        )
    )


    assert (
        updated_count
        == 1
    )


def test_admin_can_send_notification_to_one_user():
    repository = (
        FakeNotificationRepository()
    )


    service = (
        AdminNotificationService(
            notification_repository=
                repository,

            admin_repository=
                FakeAdminRepository(),
        )
    )


    result = (
        service.create_notifications(
            current_admin=
                admin(),

            payload=
                AdminNotificationCreate(
                    audience=
                        "user",

                    user_id=
                        "customer-1",

                    category=
                        "account",

                    title=
                        "Account notice",

                    message=
                        "Please review your account.",
                ),
        )
    )


    assert (
        len(
            result
        )
        == 1
    )


    assert (
        result[
            0
        ][
            "recipient_email"
        ]
        == "one@example.com"
    )


    assert (
        result[
            0
        ][
            "source"
        ]
        == "admin"
    )


def test_admin_broadcast_only_targets_active_customers():
    repository = (
        FakeNotificationRepository()
    )


    service = (
        AdminNotificationService(
            notification_repository=
                repository,

            admin_repository=
                FakeAdminRepository(),
        )
    )


    result = (
        service.create_notifications(
            current_admin=
                admin(),

            payload=
                AdminNotificationCreate(
                    audience=
                        "all_customers",

                    category=
                        "promotion",

                    title=
                        "New offer",

                    message=
                        "A new offer is available.",
                ),
        )
    )


    assert (
        len(
            result
        )
        == 2
    )


    assert {
        item[
            "user_id"
        ]
        for item
        in result
    } == {
        "customer-1",
        "customer-2",
    }


def test_admin_target_must_exist():
    service = (
        AdminNotificationService(
            notification_repository=
                FakeNotificationRepository(),

            admin_repository=
                FakeAdminRepository(),
        )
    )


    with pytest.raises(
        NotificationTargetNotFoundError
    ):
        service.create_notifications(
            current_admin=
                admin(),

            payload=
                AdminNotificationCreate(
                    audience=
                        "user",

                    user_id=
                        "missing",

                    title=
                        "Notice",

                    message=
                        "Message",
                ),
        )


def test_admin_cannot_target_inactive_user():
    service = (
        AdminNotificationService(
            notification_repository=
                FakeNotificationRepository(),

            admin_repository=
                FakeAdminRepository(),
        )
    )


    with pytest.raises(
        NotificationTargetInactiveError
    ):
        service.create_notifications(
            current_admin=
                admin(),

            payload=
                AdminNotificationCreate(
                    audience=
                        "user",

                    user_id=
                        "inactive-user",

                    title=
                        "Notice",

                    message=
                        "Message",
                ),
        )
