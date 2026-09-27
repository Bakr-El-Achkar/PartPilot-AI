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

from app.services.review_service import (
    ReviewAlreadyExistsError,
    ReviewNotEligibleError,
)

import app.routes.reviews as review_routes


client = TestClient(
    app
)


NOW = datetime.now(
    timezone.utc
)


def sample_review():
    return {
        "id":
            "review-1",

        "product_id":
            "product-1",

        "customer_name":
            "Test Customer",

        "rating":
            5,

        "comment":
            "Excellent product.",

        "verified_purchase":
            True,

        "created_at":
            NOW,

        "updated_at":
            NOW,
    }


class FakeReviewService:
    def list_product_reviews(
        self,
        product_id,
    ):
        return [
            sample_review()
        ]


    def get_eligibility(
        self,
        *,
        user_id,
        product_id,
    ):
        return {
            "eligible":
                True,

            "reason":
                None,

            "review_id":
                None,
        }


    def create_review(
        self,
        current_user,
        payload,
    ):
        if (
            payload.comment
            == "duplicate"
        ):
            raise (
                ReviewAlreadyExistsError(
                    "You already reviewed this product"
                )
            )


        if (
            payload.comment
            == "not eligible"
        ):
            raise (
                ReviewNotEligibleError(
                    "A delivered purchase is required before reviewing this product"
                )
            )


        review = (
            sample_review()
        )


        review[
            "rating"
        ] = payload.rating

        review[
            "comment"
        ] = payload.comment


        return review


ORIGINAL_SERVICE = (
    review_routes
    .review_service
)


def customer_user():
    return {
        "_id":
            "customer-1",

        "first_name":
            "Test",

        "last_name":
            "Customer",

        "role":
            "customer",

        "is_active":
            True,
    }


def setup_function():
    review_routes.review_service = (
        FakeReviewService()
    )


def teardown_function():
    app.dependency_overrides.pop(
        get_current_user,
        None,
    )


    review_routes.review_service = (
        ORIGINAL_SERVICE
    )


def test_product_reviews_are_public():
    response = client.get(
        "/api/reviews/product/product-1"
    )


    assert (
        response.status_code
        == 200
    )


    assert (
        response.json()[
            0
        ][
            "verified_purchase"
        ]
        is True
    )


def test_customer_can_check_review_eligibility():
    app.dependency_overrides[
        get_current_user
    ] = customer_user


    response = client.get(
        "/api/reviews/eligibility/product-1"
    )


    assert (
        response.status_code
        == 200
    )


    assert (
        response.json()[
            "eligible"
        ]
        is True
    )


def test_customer_can_create_review():
    app.dependency_overrides[
        get_current_user
    ] = customer_user


    response = client.post(
        "/api/reviews",
        json={
            "product_id":
                "product-1",

            "rating":
                4,

            "comment":
                "Works very well.",
        },
    )


    assert (
        response.status_code
        == 201
    )


    assert (
        response.json()[
            "rating"
        ]
        == 4
    )


def test_duplicate_review_returns_409():
    app.dependency_overrides[
        get_current_user
    ] = customer_user


    response = client.post(
        "/api/reviews",
        json={
            "product_id":
                "product-1",

            "rating":
                5,

            "comment":
                "duplicate",
        },
    )


    assert (
        response.status_code
        == 409
    )


def test_non_delivered_customer_returns_403():
    app.dependency_overrides[
        get_current_user
    ] = customer_user


    response = client.post(
        "/api/reviews",
        json={
            "product_id":
                "product-1",

            "rating":
                3,

            "comment":
                "not eligible",
        },
    )


    assert (
        response.status_code
        == 403
    )
