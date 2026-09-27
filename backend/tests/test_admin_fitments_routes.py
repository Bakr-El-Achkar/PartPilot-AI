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


client = TestClient(
    app
)


NOW = datetime.now(
    timezone.utc
)


def sample_fitment():
    return {
        "id":
            "fitment-1",

        "product_id":
            "product-1",

        "make":
            "Honda",

        "model":
            "CR-V",

        "make_normalized":
            "honda",

        "model_normalized":
            "cr-v",

        "year_start":
            2002,

        "year_end":
            2006,

        "engine":
            "2.4L",

        "engine_normalized":
            "2.4l",

        "transmission":
            "Automatic",

        "transmission_normalized":
            "automatic",

        "is_active":
            False,

        "created_at":
            NOW,

        "updated_at":
            NOW,
    }


class FakeFitmentService:
    def list_fitments(
        self,
    ):
        return [
            sample_fitment()
        ]


    def update_fitment(
        self,
        fitment_id,
        payload,
    ):
        if (
            fitment_id
            == "missing"
        ):
            return None


        result = (
            sample_fitment()
        )


        result.update(
            payload.model_dump(
                exclude_unset=True
            )
        )


        return result


ORIGINAL_SERVICE = (
    admin_routes
    .admin_fitment_service
)


def admin_user():
    return {
        "_id":
            "admin-1",

        "role":
            "admin",

        "is_active":
            True,
    }


def customer_user():
    return {
        "_id":
            "customer-1",

        "role":
            "customer",

        "is_active":
            True,
    }


def setup_function():
    admin_routes.admin_fitment_service = (
        FakeFitmentService()
    )


def teardown_function():
    app.dependency_overrides.pop(
        get_current_user,
        None,
    )


    admin_routes.admin_fitment_service = (
        ORIGINAL_SERVICE
    )


def test_admin_lists_fitments_including_inactive():
    app.dependency_overrides[
        get_current_user
    ] = admin_user


    response = client.get(
        "/api/admin/fitments"
    )


    assert (
        response.status_code
        == 200
    )


    assert (
        response.json()[
            0
        ][
            "is_active"
        ]
        is False
    )


def test_admin_updates_fitment():
    app.dependency_overrides[
        get_current_user
    ] = admin_user


    response = client.patch(
        "/api/admin/fitments/fitment-1",
        json={
            "is_active":
                True,
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
        is True
    )


def test_missing_fitment_returns_404():
    app.dependency_overrides[
        get_current_user
    ] = admin_user


    response = client.patch(
        "/api/admin/fitments/missing",
        json={
            "is_active":
                False,
        },
    )


    assert (
        response.status_code
        == 404
    )


def test_customer_cannot_manage_fitments():
    app.dependency_overrides[
        get_current_user
    ] = customer_user


    response = client.get(
        "/api/admin/fitments"
    )


    assert (
        response.status_code
        == 403
    )
