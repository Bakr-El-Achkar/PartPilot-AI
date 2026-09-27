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


def sample_review(
    *,
    review_id=
        "review-1",

    active=
        True,
):
    return {
        "id":
            review_id,

        "product_id":
            "product-1",

        "product_name":
            "Brake Pads",

        "product_slug":
            "brake-pads",

        "product_sku":
            "PAD-001",

        "user_id":
            "customer-1",

        "customer_name":
            "Test Customer",

        "customer_email":
            "customer@example.com",

        "order_id":
            "order-1",

        "order_number":
            "VHX-1001",

        "rating":
            5,

        "comment":
            "Excellent product.",

        "verified_purchase":
            True,

        "is_active":
            active,

        "created_at":
            NOW,

        "updated_at":
            NOW,
    }


class FakeAdminReviewService:
    def list_reviews(
        self,
    ):
        return [
            sample_review()
        ]


    def get_review(
        self,
        review_id,
    ):
        if (
            review_id
            == "missing"
        ):
            return None


        return sample_review(
            review_id=
                review_id
        )


    def update_status(
        self,
        review_id,
        is_active,
    ):
        if (
            review_id
            == "missing"
        ):
            return None


        return sample_review(
            review_id=
                review_id,

            active=
                is_active,
        )


ORIGINAL_SERVICE = (
    admin_routes
    .admin_review_service
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
    admin_routes.admin_review_service = (
        FakeAdminReviewService()
    )


def teardown_function():
    app.dependency_overrides.pop(
        get_current_user,
        None,
    )


    admin_routes.admin_review_service = (
        ORIGINAL_SERVICE
    )


def test_admin_lists_reviews():
    app.dependency_overrides[
        get_current_user
    ] = admin_user


    response = client.get(
        "/api/admin/reviews"
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


    assert (
        response.json()[
            0
        ][
            "verified_purchase"
        ]
        is True
    )


def test_admin_gets_review():
    app.dependency_overrides[
        get_current_user
    ] = admin_user


    response = client.get(
        "/api/admin/reviews/review-1"
    )


    assert (
        response.status_code
        == 200
    )


def test_admin_can_hide_review():
    app.dependency_overrides[
        get_current_user
    ] = admin_user


    response = client.patch(
        "/api/admin/reviews/review-1/status",
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


def test_admin_can_restore_review():
    app.dependency_overrides[
        get_current_user
    ] = admin_user


    response = client.patch(
        "/api/admin/reviews/review-1/status",
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


def test_missing_review_returns_404():
    app.dependency_overrides[
        get_current_user
    ] = admin_user


    response = client.get(
        "/api/admin/reviews/missing"
    )


    assert (
        response.status_code
        == 404
    )


    response = client.patch(
        "/api/admin/reviews/missing/status",
        json={
            "is_active":
                False,
        },
    )


    assert (
        response.status_code
        == 404
    )


def test_customer_cannot_access_admin_reviews():
    app.dependency_overrides[
        get_current_user
    ] = customer_user


    response = client.get(
        "/api/admin/reviews"
    )


    assert (
        response.status_code
        == 403
    )
