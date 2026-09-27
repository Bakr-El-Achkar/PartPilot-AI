from fastapi.testclient import (
    TestClient,
)

from app.dependencies.auth import (
    get_current_user,
)

from app.main import (
    app,
)

from app.services.admin_service import (
    AdminUserSafetyError,
)

import app.routes.admin as admin_routes


client = TestClient(
    app
)


def sample_user(
    *,
    user_id=
        "customer-1",

    role=
        "customer",

    active=
        True,
):
    return {
        "id":
            user_id,

        "first_name":
            "Test",

        "last_name":
            "User",

        "email":
            "test@example.com",

        "phone":
            None,

        "role":
            role,

        "is_active":
            active,

        "created_at":
            None,

        "updated_at":
            None,
    }


class FakeAdminUserService:
    def list_users(
        self,
    ):
        return [
            sample_user()
        ]


    def get_user(
        self,
        user_id,
    ):
        if (
            user_id
            == "missing"
        ):
            return None


        return sample_user(
            user_id=
                user_id
        )


    def update_user(
        self,
        user_id,
        payload,
        *,
        current_admin_id,
    ):
        if (
            user_id
            == "missing"
        ):
            return None


        if (
            user_id
            == "blocked"
        ):
            raise (
                AdminUserSafetyError(
                    "You cannot deactivate your own account"
                )
            )


        result = (
            sample_user(
                user_id=
                    user_id
            )
        )


        result.update(
            payload.model_dump(
                exclude_unset=True
            )
        )


        return result


ORIGINAL_SERVICE = (
    admin_routes
    .admin_user_service
)


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


def setup_function():
    admin_routes.admin_user_service = (
        FakeAdminUserService()
    )


def teardown_function():
    app.dependency_overrides.pop(
        get_current_user,
        None,
    )


    admin_routes.admin_user_service = (
        ORIGINAL_SERVICE
    )


def test_admin_lists_users():
    app.dependency_overrides[
        get_current_user
    ] = admin_user


    response = client.get(
        "/api/admin/users"
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


def test_admin_gets_user():
    app.dependency_overrides[
        get_current_user
    ] = admin_user


    response = client.get(
        "/api/admin/users/customer-1"
    )


    assert (
        response.status_code
        == 200
    )


def test_admin_updates_user():
    app.dependency_overrides[
        get_current_user
    ] = admin_user


    response = client.patch(
        "/api/admin/users/customer-1",
        json={
            "is_active":
                False,
        },
    )


    assert (
        response.status_code
        == 200
    )


    assert (
        response.json()[
            "is_active"
        ]
        is False
    )


def test_missing_user_returns_404():
    app.dependency_overrides[
        get_current_user
    ] = admin_user


    response = client.get(
        "/api/admin/users/missing"
    )


    assert (
        response.status_code
        == 404
    )


def test_safety_conflict_returns_409():
    app.dependency_overrides[
        get_current_user
    ] = admin_user


    response = client.patch(
        "/api/admin/users/blocked",
        json={
            "is_active":
                False,
        },
    )


    assert (
        response.status_code
        == 409
    )


def test_customer_cannot_list_admin_users():
    app.dependency_overrides[
        get_current_user
    ] = customer_user


    response = client.get(
        "/api/admin/users"
    )


    assert (
        response.status_code
        == 403
    )
