from datetime import (
    datetime,
    timezone,
)

import pytest

from app.schemas.admin import (
    AdminUserUpdate,
)

from app.services.admin_service import (
    AdminUserSafetyError,
    AdminUserService,
)


NOW = datetime.now(
    timezone.utc
)


class FakeRepository:
    def __init__(
        self,
    ):
        self.users = {
            "admin-1": {
                "_id":
                    "admin-1",

                "first_name":
                    "Main",

                "last_name":
                    "Admin",

                "email":
                    "admin1@example.com",

                "phone":
                    None,

                "role":
                    "admin",

                "is_active":
                    True,

                "created_at":
                    NOW,

                "updated_at":
                    NOW,
            },

            "admin-2": {
                "_id":
                    "admin-2",

                "first_name":
                    "Second",

                "last_name":
                    "Admin",

                "email":
                    "admin2@example.com",

                "phone":
                    None,

                "role":
                    "admin",

                "is_active":
                    True,

                "created_at":
                    NOW,

                "updated_at":
                    NOW,
            },

            "customer-1": {
                "_id":
                    "customer-1",

                "first_name":
                    "Test",

                "last_name":
                    "Customer",

                "email":
                    "customer@example.com",

                "phone":
                    "+96170000000",

                "role":
                    "customer",

                "is_active":
                    True,

                "created_at":
                    NOW,

                "updated_at":
                    NOW,
            },
        }


    def list_users(
        self,
    ):
        return list(
            self.users
            .values()
        )


    def find_user_by_id(
        self,
        user_id,
    ):
        return (
            self.users.get(
                user_id
            )
        )


    def count_active_admins(
        self,
    ):
        return len(
            [
                user
                for user
                in self.users
                .values()
                if (
                    user.get(
                        "role"
                    )
                    == "admin"

                    and user.get(
                        "is_active",
                        True,
                    )
                )
            ]
        )


    def update_user(
        self,
        user_id,
        updates,
    ):
        user = (
            self.users.get(
                user_id
            )
        )


        if user is None:
            return None


        user.update(
            updates
        )

        return user


def make_service():
    return (
        AdminUserService(
            repository=
                FakeRepository(),
        )
    )


def test_admin_lists_users_without_password_hash():
    service = (
        make_service()
    )


    users = (
        service.list_users()
    )


    assert (
        len(
            users
        )
        == 3
    )


    assert (
        "password_hash"
        not in users[
            0
        ]
    )


def test_admin_can_deactivate_customer():
    service = (
        make_service()
    )


    result = (
        service.update_user(
            "customer-1",
            AdminUserUpdate(
                is_active=
                    False,
            ),
            current_admin_id=
                "admin-1",
        )
    )


    assert (
        result[
            "is_active"
        ]
        is False
    )


def test_admin_can_promote_customer():
    service = (
        make_service()
    )


    result = (
        service.update_user(
            "customer-1",
            AdminUserUpdate(
                role=
                    "admin",
            ),
            current_admin_id=
                "admin-1",
        )
    )


    assert (
        result[
            "role"
        ]
        == "admin"
    )


def test_admin_cannot_deactivate_self():
    service = (
        make_service()
    )


    with pytest.raises(
        AdminUserSafetyError,
        match=
            "deactivate your own",
    ):
        service.update_user(
            "admin-1",
            AdminUserUpdate(
                is_active=
                    False,
            ),
            current_admin_id=
                "admin-1",
        )


def test_admin_cannot_demote_self():
    service = (
        make_service()
    )


    with pytest.raises(
        AdminUserSafetyError,
        match=
            "own admin role",
    ):
        service.update_user(
            "admin-1",
            AdminUserUpdate(
                role=
                    "customer",
            ),
            current_admin_id=
                "admin-1",
        )


def test_last_active_admin_cannot_be_removed():
    service = (
        make_service()
    )


    service.repository.users.pop(
        "admin-2"
    )


    with pytest.raises(
        AdminUserSafetyError,
        match=
            "At least one active admin",
    ):
        service.update_user(
            "admin-1",
            AdminUserUpdate(
                role=
                    "customer",
            ),
            current_admin_id=
                "different-admin",
        )
