from datetime import (
    datetime,
    timezone,
)

from app.services.admin_service import (
    AdminReviewService,
)


NOW = datetime.now(
    timezone.utc
)


class FakeReviewRepository:
    def __init__(
        self,
    ):
        self.reviews = {
            "review-1": {
                "_id":
                    "review-1",

                "product_id":
                    "product-1",

                "user_id":
                    "customer-1",

                "order_id":
                    "order-1",

                "customer_name":
                    "Test Customer",

                "rating":
                    5,

                "comment":
                    "Excellent product.",

                "verified_purchase":
                    True,

                "is_active":
                    True,

                "created_at":
                    NOW,

                "updated_at":
                    NOW,
            },

            "review-2": {
                "_id":
                    "review-2",

                "product_id":
                    "product-1",

                "user_id":
                    "customer-2",

                "order_id":
                    "order-2",

                "customer_name":
                    "Second Customer",

                "rating":
                    3,

                "comment":
                    "It works.",

                "verified_purchase":
                    True,

                "is_active":
                    True,

                "created_at":
                    NOW,

                "updated_at":
                    NOW,
            },
        }


    def list_all(
        self,
    ):
        return list(
            self.reviews
            .values()
        )


    def find_by_id(
        self,
        review_id,
    ):
        return (
            self.reviews.get(
                review_id
            )
        )


    def update(
        self,
        review_id,
        updates,
    ):
        review = (
            self.reviews.get(
                review_id
            )
        )


        if review is None:
            return None


        review.update(
            updates
        )


        return review


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
            .values()
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


class FakeProductRepository:
    def __init__(
        self,
    ):
        self.product = {
            "_id":
                "product-1",

            "name":
                "Brake Pads",

            "slug":
                "brake-pads",

            "sku":
                "PAD-001",

            "rating_average":
                4.0,

            "review_count":
                2,
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


class FakeAdminRepository:
    def find_user_by_id(
        self,
        user_id,
    ):
        return {
            "_id":
                user_id,

            "first_name":
                "Test",

            "last_name":
                "Customer",

            "email":
                f"{user_id}@example.com",
        }


    def find_order_by_id(
        self,
        order_id,
    ):
        return {
            "_id":
                order_id,

            "order_number":
                f"VHX-{order_id}",
        }


def make_service():
    reviews = (
        FakeReviewRepository()
    )

    products = (
        FakeProductRepository()
    )


    service = (
        AdminReviewService(
            admin_repository=
                FakeAdminRepository(),

            review_repository=
                reviews,

            product_repository=
                products,
        )
    )


    return (
        service,
        reviews,
        products,
    )


def test_admin_lists_active_and_hidden_reviews():
    (
        service,
        reviews,
        _products,
    ) = make_service()


    reviews.reviews[
        "review-2"
    ][
        "is_active"
    ] = False


    result = (
        service.list_reviews()
    )


    assert (
        len(
            result
        )
        == 2
    )


    assert (
        result[
            0
        ][
            "product_name"
        ]
        == "Brake Pads"
    )


    assert (
        result[
            0
        ][
            "customer_email"
        ]
        == "customer-1@example.com"
    )


    assert (
        result[
            1
        ][
            "is_active"
        ]
        is False
    )


def test_admin_can_hide_review_and_rating_is_recalculated():
    (
        service,
        _reviews,
        products,
    ) = make_service()


    result = (
        service.update_status(
            "review-1",
            False,
        )
    )


    assert (
        result[
            "is_active"
        ]
        is False
    )


    assert (
        products.product[
            "rating_average"
        ]
        == 3.0
    )


    assert (
        products.product[
            "review_count"
        ]
        == 1
    )


def test_admin_can_restore_review_and_rating_is_recalculated():
    (
        service,
        reviews,
        products,
    ) = make_service()


    reviews.reviews[
        "review-1"
    ][
        "is_active"
    ] = False


    result = (
        service.update_status(
            "review-1",
            True,
        )
    )


    assert (
        result[
            "is_active"
        ]
        is True
    )


    assert (
        products.product[
            "rating_average"
        ]
        == 4.0
    )


    assert (
        products.product[
            "review_count"
        ]
        == 2
    )


def test_missing_review_returns_none():
    (
        service,
        _reviews,
        _products,
    ) = make_service()


    assert (
        service.get_review(
            "missing"
        )
        is None
    )


    assert (
        service.update_status(
            "missing",
            False,
        )
        is None
    )
