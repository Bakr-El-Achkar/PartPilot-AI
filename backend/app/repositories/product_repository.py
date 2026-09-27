import re
from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from pymongo.collection import Collection

from app.repositories.catalog_repository import (
    database,
)


class ProductRepository:
    def __init__(
        self,
        collection: Collection,
    ):
        self.collection = collection

    # =========================================================
    # CREATE
    # =========================================================

    def create(
        self,
        product_data: dict,
    ):
        result = self.collection.insert_one(
            product_data
        )

        return self.collection.find_one(
            {
                "_id": result.inserted_id,
            }
        )

    # =========================================================
    # FIND BY SKU
    # =========================================================

    def find_by_sku(
        self,
        sku: str,
    ):
        return self.collection.find_one(
            {
                "sku": sku,
            }
        )

    # =========================================================
    # FIND BY SLUG
    # =========================================================

    def find_by_slug(
        self,
        slug: str,
    ):
        return self.collection.find_one(
            {
                "slug": slug,
            }
        )

    # =========================================================
    # FIND BY ID
    # =========================================================

    def find_by_id(
        self,
        product_id: str,
    ):
        query_id = self._parse_id(
            product_id
        )

        return self.collection.find_one(
            {
                "_id": query_id,
            }
        )

    # =========================================================
    # LIST ACTIVE PRODUCTS
    # =========================================================

    def list_active(
        self,
        *,
        category_id: str | None = None,
        brand_id: str | None = None,
        subcategory_slug: str | None = None,
        search: str | None = None,
        min_price: float | None = None,
        max_price: float | None = None,
        in_stock: bool | None = None,
        sort: str = "recommended",
    ) -> list[dict]:
        query: dict = {
            "is_active": True,
        }

        # -----------------------------------------------------
        # CATEGORY
        # -----------------------------------------------------

        if category_id:
            query["category_id"] = (
                category_id
            )

        # -----------------------------------------------------
        # BRAND
        # -----------------------------------------------------

        if brand_id:
            query["brand_id"] = (
                brand_id
            )

        # -----------------------------------------------------
        # SUBCATEGORY
        # -----------------------------------------------------

        if subcategory_slug:
            query[
                "subcategory_slug"
            ] = subcategory_slug

        # -----------------------------------------------------
        # SEARCH
        # -----------------------------------------------------

        if (
            search
            and search.strip()
        ):
            escaped_search = re.escape(
                search.strip()
            )

            query["$or"] = [
                {
                    "name": {
                        "$regex": (
                            escaped_search
                        ),
                        "$options": "i",
                    }
                },
                {
                    "sku": {
                        "$regex": (
                            escaped_search
                        ),
                        "$options": "i",
                    }
                },
                {
                    "part_number": {
                        "$regex": (
                            escaped_search
                        ),
                        "$options": "i",
                    }
                },
                {
                    "description": {
                        "$regex": (
                            escaped_search
                        ),
                        "$options": "i",
                    }
                },
            ]

        # -----------------------------------------------------
        # EFFECTIVE SELLING PRICE
        #
        # sale_price if available,
        # otherwise regular price.
        # -----------------------------------------------------

        effective_price = {
            "$ifNull": [
                "$sale_price",
                "$price",
            ]
        }

        # -----------------------------------------------------
        # PRICE RANGE
        # -----------------------------------------------------

        if (
            min_price is not None
            and max_price is not None
        ):
            query["$expr"] = {
                "$and": [
                    {
                        "$gte": [
                            effective_price,
                            min_price,
                        ]
                    },
                    {
                        "$lte": [
                            effective_price,
                            max_price,
                        ]
                    },
                ]
            }

        elif min_price is not None:
            query["$expr"] = {
                "$gte": [
                    effective_price,
                    min_price,
                ]
            }

        elif max_price is not None:
            query["$expr"] = {
                "$lte": [
                    effective_price,
                    max_price,
                ]
            }

        # -----------------------------------------------------
        # STOCK
        # -----------------------------------------------------

        if in_stock is True:
            query[
                "stock_quantity"
            ] = {
                "$gt": 0,
            }

        # -----------------------------------------------------
        # PRICE SORT
        #
        # We need aggregation because Shop pricing uses:
        #
        # sale_price ?? price
        # -----------------------------------------------------

        if sort in {
            "price_asc",
            "price_desc",
        }:
            direction = (
                1
                if sort == "price_asc"
                else -1
            )

            pipeline = [
                {
                    "$match": query,
                },
                {
                    "$addFields": {
                        "_effective_price": {
                            "$ifNull": [
                                "$sale_price",
                                "$price",
                            ]
                        }
                    }
                },
                {
                    "$sort": {
                        "_effective_price": (
                            direction
                        )
                    }
                },
                {
                    "$unset": (
                        "_effective_price"
                    )
                },
            ]

            products = (
                self.collection.aggregate(
                    pipeline
                )
            )

            return list(products)

        # -----------------------------------------------------
        # STANDARD QUERY
        # -----------------------------------------------------

        products = (
            self.collection.find(
                query
            )
        )

        # -----------------------------------------------------
        # RATING SORT
        # -----------------------------------------------------

        if sort == "rating":
            products = products.sort(
                "rating_average",
                -1,
            )

        # -----------------------------------------------------
        # NEWEST SORT
        # -----------------------------------------------------

        elif sort == "newest":
            products = products.sort(
                "created_at",
                -1,
            )

        # -----------------------------------------------------
        # RECOMMENDED
        #
        # Keep existing catalog order for Release 1.
        # -----------------------------------------------------

        return list(products)

    # =========================================================
    # UPDATE
    # =========================================================

    def update(
        self,
        product_id: str,
        updates: dict,
    ):
        query_id = self._parse_id(
            product_id
        )

        result = self.collection.update_one(
            {
                "_id": query_id,
            },
            {
                "$set": updates,
            },
        )

        if result.matched_count == 0:
            return None

        return self.collection.find_one(
            {
                "_id": query_id,
            }
        )

    # =========================================================
    # ATOMIC STOCK RESERVATION
    # =========================================================

    def decrement_stock(
        self,
        product_id: str,
        quantity: int,
        *,
        session=None,
    ) -> bool:
        if quantity <= 0:
            return False

        query_id = self._parse_id(
            product_id
        )

        result = self.collection.update_one(
            {
                "_id": query_id,
                "is_active": True,
                "stock_quantity": {
                    "$gte": quantity,
                },
            },
            {
                "$inc": {
                    "stock_quantity":
                        -quantity,
                },
                "$set": {
                    "updated_at":
                        datetime.now(
                            timezone.utc
                        ),
                },
            },
            session=session,
        )

        return (
            result.modified_count
            == 1
        )

    def increment_stock(
        self,
        product_id: str,
        quantity: int,
    ) -> bool:
        if quantity <= 0:
            return False

        query_id = self._parse_id(
            product_id
        )

        result = self.collection.update_one(
            {
                "_id": query_id,
            },
            {
                "$inc": {
                    "stock_quantity":
                        quantity,
                },
                "$set": {
                    "updated_at":
                        datetime.now(
                            timezone.utc
                        ),
                },
            },
        )

        return (
            result.modified_count
            == 1
        )

    # =========================================================
    # ID PARSER
    #
    # Real MongoDB product IDs are ObjectIds.
    #
    # Tests and some development repositories may use string
    # IDs such as "product-1", so invalid ObjectId strings must
    # be preserved instead of converted to None.
    # =========================================================

    @staticmethod
    def _parse_id(
        product_id: str | ObjectId,
    ) -> ObjectId | str:
        if isinstance(
            product_id,
            ObjectId,
        ):
            return product_id

        try:
            return ObjectId(
                product_id
            )

        except (
            InvalidId,
            TypeError,
        ):
            return product_id


# =============================================================
# DEFAULT PRODUCT REPOSITORY
# =============================================================

product_repository = ProductRepository(
    database["products"]
)
