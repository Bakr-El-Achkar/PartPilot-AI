from datetime import (
    datetime,
    timezone,
)

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

from app.repositories.catalog_repository import (
    brand_repository,
    category_repository,
)

from app.repositories.fitment_repository import (
    fitment_repository,
)

from app.repositories.product_repository import (
    product_repository,
)

from app.repositories.user_repository import (
    user_repository,
)


class AdminDashboardRepository:
    def __init__(
        self,
        *,
        users: Collection,
        products: Collection,
        categories: Collection,
        brands: Collection,
        fitments: Collection,
        orders: Collection,
    ):
        self.users = users
        self.products = products
        self.categories = categories
        self.brands = brands
        self.fitments = fitments
        self.orders = orders


    # =========================================================
    # DASHBOARD METRICS
    # =========================================================

    def count_users(
        self,
    ) -> int:
        return int(
            self.users.count_documents(
                {}
            )
        )


    def count_products(
        self,
    ) -> int:
        return int(
            self.products.count_documents(
                {}
            )
        )


    def count_categories(
        self,
    ) -> int:
        return int(
            self.categories.count_documents(
                {}
            )
        )


    def count_brands(
        self,
    ) -> int:
        return int(
            self.brands.count_documents(
                {}
            )
        )


    def count_fitments(
        self,
    ) -> int:
        return int(
            self.fitments.count_documents(
                {}
            )
        )


    def count_orders(
        self,
    ) -> int:
        return int(
            self.orders.count_documents(
                {}
            )
        )


    def count_processing_orders(
        self,
    ) -> int:
        return int(
            self.orders.count_documents(
                {
                    "status":
                        "processing",
                }
            )
        )


    def count_low_stock_products(
        self,
        threshold: int = 5,
    ) -> int:
        return int(
            self.products.count_documents(
                {
                    "is_active":
                        True,

                    "stock_quantity": {
                        "$lte":
                            threshold,
                    },
                }
            )
        )


    def count_orders_this_month(
        self,
    ) -> int:
        now = datetime.now(
            timezone.utc
        )


        month_start = datetime(
            year=
                now.year,

            month=
                now.month,

            day=
                1,

            tzinfo=
                timezone.utc,
        )


        return int(
            self.orders.count_documents(
                {
                    "created_at": {
                        "$gte":
                            month_start,
                    }
                }
            )
        )


    def calculate_revenue(
        self,
    ) -> float:
        pipeline = [
            {
                "$match": {
                    "status": {
                        "$ne":
                            "cancelled",
                    }
                }
            },

            {
                "$group": {
                    "_id":
                        None,

                    "total": {
                        "$sum":
                            "$total",
                    },
                }
            },
        ]


        result = list(
            self.orders.aggregate(
                pipeline
            )
        )


        if not result:
            return 0.0


        return float(
            result[0].get(
                "total",
                0,
            )
            or 0
        )


    # =========================================================
    # ADMIN ORDERS
    # =========================================================

    def list_orders(
        self,
    ) -> list[dict]:
        cursor = (
            self.orders
            .find(
                {}
            )
            .sort(
                "created_at",
                -1,
            )
        )


        return list(
            cursor
        )


    def find_order_by_id(
        self,
        order_id: str,
    ):
        query_id = (
            self._parse_id(
                order_id
            )
        )


        return (
            self.orders.find_one(
                {
                    "_id":
                        query_id,
                }
            )
        )


    def update_order_status(
        self,
        order_id: str,
        new_status: str,
        expected_status: str,
    ):
        query_id = (
            self._parse_id(
                order_id
            )
        )


        result = (
            self.orders.update_one(
                {
                    "_id":
                        query_id,
                    "status":
                        expected_status,
                },
                {
                    "$set": {
                        "status":
                            new_status,

                        "updated_at":
                            datetime.now(
                                timezone.utc
                            ),
                    }
                },
            )
        )


        if (
            result.matched_count
            == 0
        ):
            return None


        return (
            self.orders.find_one(
                {
                    "_id":
                        query_id,
                }
            )
        )


    def find_user_by_id(
        self,
        user_id: str,
    ):
        parsed = (
            self._parse_id(
                user_id
            )
        )


        user = (
            self.users.find_one(
                {
                    "_id":
                        parsed,
                }
            )
        )


        if (
            user is None
            and parsed != user_id
        ):
            user = (
                self.users.find_one(
                    {
                        "_id":
                            user_id,
                    }
                )
            )


        return user


    # =========================================================
    # ADMIN PRODUCTS
    # =========================================================

    def list_products(
        self,
    ) -> list[dict]:
        cursor = (
            self.products
            .find(
                {}
            )
            .sort(
                "updated_at",
                -1,
            )
        )


        return list(
            cursor
        )


    # =========================================================
    # ADMIN CATEGORIES
    # =========================================================

    def list_categories(
        self,
    ) -> list[dict]:
        return list(
            self.categories
            .find(
                {}
            )
            .sort(
                "name",
                1,
            )
        )


    def find_category_by_id(
        self,
        category_id: str,
    ):
        return (
            self.categories
            .find_one(
                {
                    "_id":
                        self._parse_id(
                            category_id
                        ),
                }
            )
        )


    def find_category_by_slug(
        self,
        slug: str,
    ):
        return (
            self.categories
            .find_one(
                {
                    "slug":
                        slug,
                }
            )
        )


    def update_category(
        self,
        category_id: str,
        updates: dict,
    ):
        query_id = (
            self._parse_id(
                category_id
            )
        )


        result = (
            self.categories
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
            self.categories
            .find_one(
                {
                    "_id":
                        query_id,
                }
            )
        )


    # =========================================================
    # ADMIN BRANDS
    # =========================================================

    def list_brands(
        self,
    ) -> list[dict]:
        return list(
            self.brands
            .find(
                {}
            )
            .sort(
                "name",
                1,
            )
        )


    def find_brand_by_id(
        self,
        brand_id: str,
    ):
        return (
            self.brands
            .find_one(
                {
                    "_id":
                        self._parse_id(
                            brand_id
                        ),
                }
            )
        )


    def find_brand_by_slug(
        self,
        slug: str,
    ):
        return (
            self.brands
            .find_one(
                {
                    "slug":
                        slug,
                }
            )
        )


    def update_brand(
        self,
        brand_id: str,
        updates: dict,
    ):
        query_id = (
            self._parse_id(
                brand_id
            )
        )


        result = (
            self.brands
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
            self.brands
            .find_one(
                {
                    "_id":
                        query_id,
                }
            )
        )


    # =========================================================
    # ADMIN FITMENTS
    # =========================================================

    def list_fitments(
        self,
    ) -> list[dict]:
        return list(
            self.fitments
            .find(
                {}
            )
            .sort(
                "updated_at",
                -1,
            )
        )


    def find_fitment_by_id(
        self,
        fitment_id: str,
    ):
        return (
            self.fitments
            .find_one(
                {
                    "_id":
                        self._parse_id(
                            fitment_id
                        ),
                }
            )
        )


    def list_fitments_for_product(
        self,
        product_id: str,
    ) -> list[dict]:
        return list(
            self.fitments
            .find(
                {
                    "product_id":
                        product_id,
                }
            )
        )


    def update_fitment(
        self,
        fitment_id: str,
        updates: dict,
    ):
        query_id = (
            self._parse_id(
                fitment_id
            )
        )


        result = (
            self.fitments
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
            self.fitments
            .find_one(
                {
                    "_id":
                        query_id,
                }
            )
        )


    # =========================================================
    # ADMIN USERS
    # =========================================================

    def list_users(
        self,
    ) -> list[dict]:
        return list(
            self.users
            .find(
                {}
            )
            .sort(
                "email",
                1,
            )
        )


    def count_active_admins(
        self,
    ) -> int:
        return int(
            self.users
            .count_documents(
                {
                    "role":
                        "admin",

                    "is_active": {
                        "$ne":
                            False,
                    },
                }
            )
        )


    def update_user(
        self,
        user_id: str,
        updates: dict,
    ):
        query_id = (
            self._parse_id(
                user_id
            )
        )


        result = (
            self.users
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
            self.users
            .find_one(
                {
                    "_id":
                        query_id,
                }
            )
        )


    @staticmethod
    def _parse_id(
        value: str | ObjectId,
    ) -> ObjectId | str:
        if isinstance(
            value,
            ObjectId,
        ):
            return value


        try:
            return ObjectId(
                value
            )

        except (
            InvalidId,
            TypeError,
        ):
            return value


admin_dashboard_repository = (
    AdminDashboardRepository(
        users=
            user_repository.collection,

        products=
            product_repository.collection,

        categories=
            category_repository.collection,

        brands=
            brand_repository.collection,

        fitments=
            fitment_repository.collection,

        orders=
            database[
                "orders"
            ],
    )
)
