from datetime import (
    datetime,
    timezone,
)

import pytest

from app.schemas.review import (
    ReviewCreate,
)

from app.services.review_service import (
    ReviewAlreadyExistsError,
    ReviewNotEligibleError,
    ReviewService,
)


NOW = datetime.now(
    timezone.utc
)


class FakeReviewRepository:
    def __init__(
        self,
    ):
        self.reviews = []


    def create(
        self,
        document,
    ):
        created = {
            **document,

            "_id":
                f"review-{len(self.reviews) + 1}",
        }


        self.reviews.append(
            created
        )


        return created


    def find_by_user_product(
        self,
        user_id,
        product_id,
    ):
        return next(
            (
                review
                for review
                in self.reviews
                if (
                    review[
                        "user_id"
                    ]
                    == user_id

                    and review[
                        "product_id"
                    ]
                    == product_id
                )
            ),
            None,
        )


    def list_active_by_product(
        self,
        product_id,
    ):
        return [
            review
            for review
            in self.reviews
            if (
                review[
                    "product_id"
                ]
                == product_id

                and review.get(
                    "is_active",
                    True,
                )
            )
        ]


    def calculate_product_stats(
        self,
        product_id,
    ):
        ratings = [
            review[
                "rating"
            ]
            for review
            in self.reviews
            if (
                review[
                    "product_id"
                ]
                == product_id

                and review.get(
                    "is_active",
                    True,
                )
            )
        ]


        if not ratings:
            return (
                0.0,
                0,
            )


        return (
            round(
                sum(
                    ratings
                )
                /
                len(
                    ratings
                ),
                2,
            ),

            len(
                ratings
            ),
        )


class FakeOrderRepository:
    def __init__(
        self,
        *,
        delivered=True,
    ):
        self.delivered = (
            delivered
        )


    def find_by_user_id(
        self,
        user_id,
    ):
        return [
            {
                "_id":
                    "order-1",

                "user_id":
                    user_id,

                "status":
                    (
                        "delivered"
                        if self.delivered
                        else "processing"
                    ),

                "items": [
                    {
                        "product_id":
                            "product-1",
                    }
                ],
            }
        ]


class FakeProductRepository:
    def __init__(
        self,
    ):
        self.product = {
            "_id":
                "product-1",

            "name":
                "Brake Pads",

            "rating_average":
                0,

            "review_count":
                0,
        }


    def find_by_id(
        self,
        product_id,
    ):
        if (
            product_id
            != "product-1"
        ):
            return None


        return self.product


    def update(
        self,
        product_id,
        updates,
    ):
        if (
            product_id
            != "product-1"
        ):
            return None


        self.product.update(
            updates
        )


        return self.product


def make_service(
    *,
    delivered=True,
):
    reviews = (
        FakeReviewRepository()
    )

    products = (
        FakeProductRepository()
    )


    service = (
        ReviewService(
            review_repository=
                reviews,

            order_repository=
                FakeOrderRepository(
                    delivered=
                        delivered,
                ),

            product_repository=
                products,
        )
    )


    return (
        service,
        reviews,
        products,
    )


def current_user():
    return {
        "_id":
            "customer-1",

        "first_name":
            "Test",

        "last_name":
            "Customer",
    }


def test_delivered_customer_can_review_product():
    (
        service,
        _reviews,
        products,
    ) = make_service()


    review = (
        service.create_review(
            current_user(),
            ReviewCreate(
                product_id=
                    "product-1",

                rating=
                    5,

                comment=
                    "Excellent brake pads.",
            ),
        )
    )


    assert (
        review[
            "rating"
        ]
        == 5
    )


    assert (
        review[
            "verified_purchase"
        ]
        is True
    )


    assert (
        products.product[
            "rating_average"
        ]
        == 5.0
    )


    assert (
        products.product[
            "review_count"
        ]
        == 1
    )


def test_customer_cannot_review_before_delivery():
    (
        service,
        _reviews,
        _products,
    ) = make_service(
        delivered=
            False
    )


    with pytest.raises(
        ReviewNotEligibleError
    ):
        service.create_review(
            current_user(),
            ReviewCreate(
                product_id=
                    "product-1",

                rating=
                    4,

                comment=
                    "Good product.",
            ),
        )


def test_customer_cannot_review_same_product_twice():
    (
        service,
        _reviews,
        _products,
    ) = make_service()


    payload = ReviewCreate(
        product_id=
            "product-1",

        rating=
            5,

        comment=
            "Excellent.",
    )


    service.create_review(
        current_user(),
        payload,
    )


    with pytest.raises(
        ReviewAlreadyExistsError
    ):
        service.create_review(
            current_user(),
            payload,
        )


def test_review_eligibility_requires_delivered_order():
    (
        service,
        _reviews,
        _products,
    ) = make_service(
        delivered=
            False
    )


    result = (
        service.get_eligibility(
            user_id=
                "customer-1",

            product_id=
                "product-1",
        )
    )


    assert (
        result[
            "eligible"
        ]
        is False
    )


def test_review_eligibility_true_after_delivery():
    (
        service,
        _reviews,
        _products,
    ) = make_service()


    result = (
        service.get_eligibility(
            user_id=
                "customer-1",

            product_id=
                "product-1",
        )
    )


    assert (
        result[
            "eligible"
        ]
        is True
    )
