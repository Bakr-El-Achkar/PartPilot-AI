from bson import (
    ObjectId,
)

from bson.errors import (
    InvalidId,
)

from pymongo.collection import (
    Collection,
)

from app.core.database import (
    database,
)


class ReviewRepository:
    def __init__(
        self,
        collection:
            Collection,
    ):
        self.collection = (
            collection
        )


    def create(
        self,
        document: dict,
    ) -> dict:
        saved = (
            document.copy()
        )


        result = (
            self.collection
            .insert_one(
                saved
            )
        )


        saved[
            "_id"
        ] = result.inserted_id


        return saved


    def find_by_user_product(
        self,
        user_id: str,
        product_id: str,
    ):
        return (
            self.collection
            .find_one(
                {
                    "user_id":
                        user_id,

                    "product_id":
                        product_id,
                }
            )
        )


    def list_active_by_product(
        self,
        product_id: str,
    ) -> list[dict]:
        cursor = (
            self.collection
            .find(
                {
                    "product_id":
                        product_id,

                    "is_active":
                        True,
                }
            )
            .sort(
                "created_at",
                -1,
            )
        )


        return list(
            cursor
        )


    def list_all(
        self,
    ) -> list[dict]:
        return list(
            self.collection
            .find(
                {}
            )
            .sort(
                "created_at",
                -1,
            )
        )


    def find_by_id(
        self,
        review_id: str,
    ):
        return (
            self.collection
            .find_one(
                {
                    "_id":
                        self._parse_id(
                            review_id
                        ),
                }
            )
        )


    def update(
        self,
        review_id: str,
        updates: dict,
    ):
        query_id = (
            self._parse_id(
                review_id
            )
        )


        result = (
            self.collection
            .update_one(
                {
                    "_id":
                        query_id,
                },
                {
                    "$set":
                        updates,
                },
            )
        )


        if (
            result.matched_count
            == 0
        ):
            return None


        return (
            self.collection
            .find_one(
                {
                    "_id":
                        query_id,
                }
            )
        )


    def calculate_product_stats(
        self,
        product_id: str,
    ) -> tuple[
        float,
        int,
    ]:
        pipeline = [
            {
                "$match": {
                    "product_id":
                        product_id,

                    "is_active":
                        True,
                }
            },

            {
                "$group": {
                    "_id":
                        None,

                    "average": {
                        "$avg":
                            "$rating",
                    },

                    "count": {
                        "$sum":
                            1,
                    },
                }
            },
        ]


        result = list(
            self.collection
            .aggregate(
                pipeline
            )
        )


        if not result:
            return (
                0.0,
                0,
            )


        return (
            round(
                float(
                    result[
                        0
                    ].get(
                        "average",
                        0,
                    )
                    or 0
                ),
                2,
            ),

            int(
                result[
                    0
                ].get(
                    "count",
                    0,
                )
                or 0
            ),
        )


    @staticmethod
    def _parse_id(
        review_id: str,
    ):
        try:
            return ObjectId(
                review_id
            )

        except (
            InvalidId,
            TypeError,
        ):
            return review_id


review_repository = (
    ReviewRepository(
        database[
            "reviews"
        ]
    )
)
