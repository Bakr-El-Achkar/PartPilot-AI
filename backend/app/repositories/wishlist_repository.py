from datetime import (
    datetime,
    timezone,
)

from pymongo.collection import (
    Collection,
)

from app.core.database import (
    database,
)


class WishlistRepository:
    def __init__(
        self,
        collection: Collection,
    ):
        self.collection = collection


    def find_by_user_id(
        self,
        user_id: str,
    ) -> list[dict]:
        cursor = self.collection.find(
            {
                "user_id":
                    user_id,
            }
        )

        try:
            cursor = cursor.sort(
                "created_at",
                -1,
            )
        except (
            AttributeError,
            TypeError,
        ):
            pass

        return list(
            cursor
        )


    def find_by_user_and_product(
        self,
        user_id: str,
        product_id: str,
    ):
        return self.collection.find_one(
            {
                "user_id":
                    user_id,

                "product_id":
                    product_id,
            }
        )


    def add(
        self,
        user_id: str,
        product_id: str,
    ) -> dict:
        existing = (
            self.find_by_user_and_product(
                user_id,
                product_id,
            )
        )


        if existing is not None:
            return existing


        document = {
            "user_id":
                user_id,

            "product_id":
                product_id,

            "created_at":
                datetime.now(
                    timezone.utc
                ),
        }


        result = self.collection.insert_one(
            document
        )


        document["_id"] = (
            result.inserted_id
        )


        return document


    def remove(
        self,
        user_id: str,
        product_id: str,
    ) -> bool:
        result = self.collection.delete_one(
            {
                "user_id":
                    user_id,

                "product_id":
                    product_id,
            }
        )


        return (
            result.deleted_count
            == 1
        )


wishlist_repository = (
    WishlistRepository(
        database[
            "wishlists"
        ]
    )
)
