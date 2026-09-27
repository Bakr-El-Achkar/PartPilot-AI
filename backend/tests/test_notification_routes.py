from datetime import (
    datetime,
    timezone,
)

from fastapi.testclient import (
    TestClient,
)

from app.dependencies.auth import (
    get_current_user,
)

from app.main import (
    app,
)

import app.routes.admin as admin_routes
import app.routes.notifications as notification_routes


client = TestClient(
    app
)


NOW = datetime.now(
    timezone.utc
)


def sample_notification(
    *,
    notification_id=
        "notification-1",

    user_id=
        "customer-1",

    is_read=
        False,
):
    return {
        "id":
            notification_id,

        "user_id":
            user_id,

        "category":
            "general",

        "title":
            "Test notification",

        "message":
            "This is a notification.",

        "link":
            "/orders",

        "source":
            "admin",

        "is_read":
            is_read,

        "read_at":
            (
                NOW
                if is_read
                else None
            ),

        "created_at":
            NOW,
    }


def sample_admin_notification():
    return {
        **sample_notification(),

        "recipient_name":
            "Test Customer",

        "recipient_email":
            "customer@example.com",

        "created_by_admin_id":
            "admin-1",
    }


class FakeNotificationService:
    def list_for_user(
        self,
        current_user,
    ):
        return [
            sample_notification(
                user_id=
                    str(
                        current_user[
                            "_id"
                        ]
                    )
            )
        ]


    def mark_read(
        self,
        *,
        current_user,
        notification_id,
    ):
        if (
            notification_id
            == "missing"
        ):
            return None


        return sample_notification(
            notification_id=
                notification_id,

            user_id=
                str(
                    current_user[
                        "_id"
                    ]
                ),

            is_read=
                True,
        )


    def mark_all_read(
        self,
        current_user,
    ):
        return 2


class FakeAdminNotificationService:
    def list_notifications(
        self,
    ):
        return [
            sample_admin_notification()
        ]


    def get_notification(
        self,
        notification_id,
    ):
        if (
            notification_id
            == "missing"
        ):
            return None


        return {
            **sample_admin_notification(),

            "id":
                notification_id,
        }


    def create_notifications(
        self,
        *,
        current_admin,
        payload,
    ):
        return [
            sample_admin_notification()
        ]


ORIGINAL_NOTIFICATION_SERVICE = (
    notification_routes
    .notification_service
)

ORIGINAL_ADMIN_SERVICE = (
    admin_routes
    .admin_notification_service
)


def customer_user():
    return {
        "_id":
            "customer-1",

        "email":
            "customer@example.com",

        "role":
            "customer",

        "is_active":
            True,
    }


def admin_user():
    return {
        "_id":
            "admin-1",

        "email":
            "admin@example.com",

        "role":
            "admin",

        "is_active":
            True,
    }


def setup_function():
    notification_routes.notification_service = (
        FakeNotificationService()
    )

    admin_routes.admin_notification_service = (
        FakeAdminNotificationService()
    )


def teardown_function():
    app.dependency_overrides.pop(
        get_current_user,
        None,
    )


    notification_routes.notification_service = (
        ORIGINAL_NOTIFICATION_SERVICE
    )

    admin_routes.admin_notification_service = (
        ORIGINAL_ADMIN_SERVICE
    )


def test_customer_lists_notifications():
    app.dependency_overrides[
        get_current_user
    ] = customer_user


    response = client.get(
        "/api/notifications"
    )


    assert (
        response.status_code
        == 200
    )


    assert (
        len(
            response.json()
        )
        == 1
    )


def test_customer_marks_notification_read():
    app.dependency_overrides[
        get_current_user
    ] = customer_user


    response = client.patch(
        "/api/notifications/notification-1/read"
    )


    assert (
        response.status_code
        == 200
    )


    assert (
        response.json()[
            "is_read"
        ]
        is True
    )


def test_customer_missing_notification_returns_404():
    app.dependency_overrides[
        get_current_user
    ] = customer_user


    response = client.patch(
        "/api/notifications/missing/read"
    )


    assert (
        response.status_code
        == 404
    )


def test_customer_marks_all_notifications_read():
    app.dependency_overrides[
        get_current_user
    ] = customer_user


    response = client.patch(
        "/api/notifications/read-all"
    )


    assert (
        response.status_code
        == 200
    )


    assert (
        response.json()[
            "updated_count"
        ]
        == 2
    )


def test_admin_lists_notifications():
    app.dependency_overrides[
        get_current_user
    ] = admin_user


    response = client.get(
        "/api/admin/notifications"
    )


    assert (
        response.status_code
        == 200
    )


def test_admin_gets_notification():
    app.dependency_overrides[
        get_current_user
    ] = admin_user


    response = client.get(
        "/api/admin/notifications/notification-1"
    )


    assert (
        response.status_code
        == 200
    )


def test_admin_creates_notification():
    app.dependency_overrides[
        get_current_user
    ] = admin_user


    response = client.post(
        "/api/admin/notifications",
        json={
            "audience":
                "user",

            "user_id":
                "customer-1",

            "category":
                "general",

            "title":
                "Test",

            "message":
                "Test notification.",
        },
    )


    assert (
        response.status_code
        == 201
    )


    assert (
        len(
            response.json()
        )
        == 1
    )


def test_customer_cannot_access_admin_notifications():
    app.dependency_overrides[
        get_current_user
    ] = customer_user


    response = client.get(
        "/api/admin/notifications"
    )


    assert (
        response.status_code
        == 403
    )
