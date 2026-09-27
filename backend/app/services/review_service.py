from datetime import (
    datetime,
    timezone,
)

from app.repositories.order_repository import (
    order_repository,
)

from app.repositories.product_repository import (
    product_repository,
)

from app.repositories.review_repository import (
    review_repository,
)

from app.schemas.review import (
    ReviewCreate,
)


class ReviewAlreadyExistsError(
    Exception
):
    pass


class ReviewNotEligibleError(
    Exception
):
    pass


class ReviewProductNotFoundError(
    Exception
):
    pass


class ReviewService:
    def __init__(
        self,
        *,
        review_repository,
        order_repository,
        product_repository,
    ):
        self.review_repository = (
            review_repository
        )

        self.order_repository = (
            order_repository
        )

        self.product_repository = (
            product_repository
        )


    def list_product_reviews(
        self,
        product_id: str,
    ) -> list[dict]:
        reviews = (
            self.review_repository
            .list_active_by_product(
                product_id
            )
        )


        return [
            self._serialize_public(
                review
            )
            for review
            in reviews
        ]


    def get_eligibility(
        self,
        *,
        user_id: str,
        product_id: str,
    ) -> dict:
        product = (
            self.product_repository
            .find_by_id(
                product_id
            )
        )


        if product is None:
            raise (
                ReviewProductNotFoundError(
                    "Product not found"
                )
            )


        existing = (
            self.review_repository
            .find_by_user_product(
                user_id,
                product_id,
            )
        )


        if existing is not None:
            return {
                "eligible":
                    False,

                "reason":
                    "You already reviewed this product.",

                "review_id":
                    str(
                        existing[
                            "_id"
                        ]
                    ),
            }


        order = (
            self._find_delivered_order(
                user_id=
                    user_id,

                product_id=
                    product_id,
            )
        )


        if order is None:
            return {
                "eligible":
                    False,

                "reason":
                    "Reviews are available after a delivered purchase.",

                "review_id":
                    None,
            }


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
        current_user: dict,
        payload:
            ReviewCreate,
    ) -> dict:
        user_id = str(
            current_user[
                "_id"
            ]
        )


        product = (
            self.product_repository
            .find_by_id(
                payload.product_id
            )
        )


        if product is None:
            raise (
                ReviewProductNotFoundError(
                    "Product not found"
                )
            )


        existing = (
            self.review_repository
            .find_by_user_product(
                user_id,
                payload.product_id,
            )
        )


        if existing is not None:
            raise (
                ReviewAlreadyExistsError(
                    "You already reviewed this product"
                )
            )


        order = (
            self._find_delivered_order(
                user_id=
                    user_id,

                product_id=
                    payload.product_id,
            )
        )


        if order is None:
            raise (
                ReviewNotEligibleError(
                    "A delivered purchase is required before reviewing this product"
                )
            )


        first_name = str(
            current_user.get(
                "first_name",
                "",
            )
            or ""
        ).strip()


        last_name = str(
            current_user.get(
                "last_name",
                "",
            )
            or ""
        ).strip()


        customer_name = (
            f"{first_name} {last_name}"
            .strip()
            or "Verified customer"
        )


        now = datetime.now(
            timezone.utc
        )


        document = {
            "product_id":
                payload.product_id,

            "user_id":
                user_id,

            "order_id":
                str(
                    order[
                        "_id"
                    ]
                ),

            "customer_name":
                customer_name,

            "rating":
                payload.rating,

            "comment":
                payload.comment.strip(),

            "verified_purchase":
                True,

            "is_active":
                True,

            "created_at":
                now,

            "updated_at":
                now,
        }


        created = (
            self.review_repository
            .create(
                document
            )
        )


        self.recalculate_product_rating(
            payload.product_id
        )


        return (
            self._serialize_public(
                created
            )
        )


    def recalculate_product_rating(
        self,
        product_id: str,
    ) -> None:
        (
            rating_average,
            review_count,
        ) = (
            self.review_repository
            .calculate_product_stats(
                product_id
            )
        )


        self.product_repository.update(
            product_id,
            {
                "rating_average":
                    rating_average,

                "review_count":
                    review_count,

                "updated_at":
                    datetime.now(
                        timezone.utc
                    ),
            },
        )


    def _find_delivered_order(
        self,
        *,
        user_id: str,
        product_id: str,
    ):
        orders = (
            self.order_repository
            .find_by_user_id(
                user_id
            )
        )


        for order in orders:
            if (
                order.get(
                    "status"
                )
                != "delivered"
            ):
                continue


            for item in (
                order.get(
                    "items",
                    [],
                )
            ):
                if (
                    str(
                        item.get(
                            "product_id"
                        )
                    )
                    == product_id
                ):
                    return order


        return None


    @staticmethod
    def _serialize_public(
        review: dict,
    ) -> dict:
        return {
            "id":
                str(
                    review[
                        "_id"
                    ]
                ),

            "product_id":
                str(
                    review[
                        "product_id"
                    ]
                ),

            "customer_name":
                review.get(
                    "customer_name",
                    "Verified customer",
                ),

            "rating":
                int(
                    review[
                        "rating"
                    ]
                ),

            "comment":
                review[
                    "comment"
                ],

            "verified_purchase":
                bool(
                    review.get(
                        "verified_purchase",
                        False,
                    )
                ),

            "created_at":
                review[
                    "created_at"
                ],

            "updated_at":
                review[
                    "updated_at"
                ],
        }


review_service = (
    ReviewService(
        review_repository=
            review_repository,

        order_repository=
            order_repository,

        product_repository=
            product_repository,
    )
)
