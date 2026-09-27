from datetime import (
    datetime,
    timezone,
)

from app.repositories.fitment_repository import (
    normalize_vehicle_text,
)

from app.repositories.admin_repository import (
    AdminDashboardRepository,
    admin_dashboard_repository,
)


from app.repositories.admin_ai_session_repository import (
    admin_ai_session_repository,
)

from app.schemas.admin import (
    AdminBrandUpdate,
    AdminCategoryUpdate,
)

from app.services.catalog_service import (
    slugify,
)


from app.repositories.product_repository import (
    ProductRepository,
    product_repository,
)


from app.repositories.review_repository import (
    review_repository,
)


class AdminOrderStatusTransitionError(
    Exception
):
    pass


class AdminOrderInventoryError(
    Exception
):
    pass


class AdminDashboardService:
    def __init__(
        self,
        repository:
            AdminDashboardRepository,
    ):
        self.repository = (
            repository
        )


    def get_overview(
        self,
    ) -> dict:
        return {
            "products":
                self.repository
                .count_products(),

            "fitments":
                self.repository
                .count_fitments(),

            "orders":
                self.repository
                .count_orders(),

            "orders_this_month":
                self.repository
                .count_orders_this_month(),

            "processing_orders":
                self.repository
                .count_processing_orders(),

            "users":
                self.repository
                .count_users(),

            "categories":
                self.repository
                .count_categories(),

            "brands":
                self.repository
                .count_brands(),

            "low_stock_items":
                self.repository
                .count_low_stock_products(),

            "revenue":
                self.repository
                .calculate_revenue(),
        }


class AdminOrderService:
    ALLOWED_TRANSITIONS = {
        "processing": {
            "shipped",
            "delivered",
            "cancelled",
        },

        "shipped": {
            "delivered",
        },

        "delivered":
            set(),

        "cancelled":
            set(),
    }


    def __init__(
        self,
        *,
        repository:
            AdminDashboardRepository,

        product_repository:
            ProductRepository,
    ):
        self.repository = (
            repository
        )

        self.product_repository = (
            product_repository
        )


    def list_orders(
        self,
    ) -> list[dict]:
        return [
            self._serialize_order(
                order
            )
            for order
            in self.repository
            .list_orders()
        ]


    def get_order(
        self,
        order_id: str,
    ) -> dict | None:
        order = (
            self.repository
            .find_order_by_id(
                order_id
            )
        )


        if order is None:
            return None


        return (
            self._serialize_order(
                order
            )
        )


    def update_status(
        self,
        order_id: str,
        new_status: str,
    ) -> dict | None:
        order = (
            self.repository
            .find_order_by_id(
                order_id
            )
        )


        if order is None:
            return None


        current_status = (
            order.get(
                "status",
                "processing",
            )
        )


        if (
            new_status
            == current_status
        ):
            return (
                self._serialize_order(
                    order
                )
            )


        allowed = (
            self.ALLOWED_TRANSITIONS
            .get(
                current_status,
                set(),
            )
        )


        if (
            new_status
            not in allowed
        ):
            raise (
                AdminOrderStatusTransitionError(
                    "Order status cannot change "
                    f"from {current_status} "
                    f"to {new_status}"
                )
            )


        updated = (
            self.repository
            .update_order_status(
                order_id,
                new_status,
                current_status,
            )
        )


        if (
            updated is None
        ):
            if self.repository.find_order_by_id(order_id) is None:
                return None

            raise AdminOrderStatusTransitionError(
                "Order status changed while updating. Please retry."
            )


        if new_status == "cancelled":
            restored: list[tuple[str, int]] = []

            try:
                for item in order.get("items", []):
                    product_id = str(item["product_id"])
                    quantity = int(item["quantity"])

                    if not self.product_repository.increment_stock(
                        product_id, quantity
                    ):
                        raise AdminOrderInventoryError(
                            "Unable to restore inventory for the cancelled order"
                        )

                    restored.append((product_id, quantity))
            except Exception:
                for product_id, quantity in reversed(restored):
                    self.product_repository.decrement_stock(
                        product_id, quantity
                    )

                self.repository.update_order_status(
                    order_id, current_status, new_status
                )
                raise


        return (
            self._serialize_order(
                updated
            )
        )


    def _serialize_order(
        self,
        order: dict,
    ) -> dict:
        user_id = str(
            order.get(
                "user_id",
                "",
            )
        )


        user = (
            self.repository
            .find_user_by_id(
                user_id
            )
        )


        if user:
            first_name = str(
                user.get(
                    "first_name",
                    "",
                )
            ).strip()

            last_name = str(
                user.get(
                    "last_name",
                    "",
                )
            ).strip()

            customer_name = (
                f"{first_name} {last_name}"
                .strip()
            ) or "Customer"

            customer_email = str(
                user.get(
                    "email",
                    "",
                )
            )

            customer_phone = (
                user.get(
                    "phone"
                )
            )

        else:
            customer_name = (
                "Unknown customer"
            )

            customer_email = ""

            customer_phone = None


        return {
            "id":
                str(
                    order[
                        "_id"
                    ]
                ),

            "order_number":
                order[
                    "order_number"
                ],

            "user_id":
                user_id,

            "customer_name":
                customer_name,

            "customer_email":
                customer_email,

            "customer_phone":
                customer_phone,

            "vehicle_id":
                order.get(
                    "vehicle_id"
                ),

            "items":
                order.get(
                    "items",
                    [],
                ),

            "subtotal":
                float(
                    order[
                        "subtotal"
                    ]
                ),

            "delivery_fee":
                float(
                    order[
                        "delivery_fee"
                    ]
                ),

            "discount":
                float(
                    order.get(
                        "discount",
                        0,
                    )
                ),

            "total":
                float(
                    order[
                        "total"
                    ]
                ),

            "payment_method":
                order[
                    "payment_method"
                ],

            "payment_status":
                order[
                    "payment_status"
                ],

            "shipping_address":
                order[
                    "shipping_address"
                ],

            "status":
                order[
                    "status"
                ],

            "created_at":
                order[
                    "created_at"
                ],

            "updated_at":
                order[
                    "updated_at"
                ],
        }


class AdminUserSafetyError(
    Exception
):
    pass


class AdminUserService:
    def __init__(
        self,
        repository:
            AdminDashboardRepository,
    ):
        self.repository = (
            repository
        )


    def list_users(
        self,
    ) -> list[dict]:
        return [
            self._serialize_user(
                user
            )
            for user
            in self.repository
            .list_users()
        ]


    def get_user(
        self,
        user_id: str,
    ) -> dict | None:
        user = (
            self.repository
            .find_user_by_id(
                user_id
            )
        )


        if user is None:
            return None


        return (
            self._serialize_user(
                user
            )
        )


    def update_user(
        self,
        user_id: str,
        payload,
        *,
        current_admin_id: str,
    ) -> dict | None:
        existing = (
            self.repository
            .find_user_by_id(
                user_id
            )
        )


        if existing is None:
            return None


        updates = (
            payload.model_dump(
                exclude_unset=True
            )
        )


        if not updates:
            return (
                self._serialize_user(
                    existing
                )
            )


        target_id = str(
            existing[
                "_id"
            ]
        )


        current_admin_id = str(
            current_admin_id
        )


        current_role = (
            existing.get(
                "role",
                "customer",
            )
        )


        current_active = bool(
            existing.get(
                "is_active",
                True,
            )
        )


        # -----------------------------------------------------
        # SELF-LOCKOUT PROTECTION
        # -----------------------------------------------------

        if (
            target_id
            == current_admin_id
        ):
            if (
                "role"
                in updates
                and updates[
                    "role"
                ]
                != current_role
            ):
                raise (
                    AdminUserSafetyError(
                        "You cannot change your own admin role"
                    )
                )


            if (
                updates.get(
                    "is_active"
                )
                is False
            ):
                raise (
                    AdminUserSafetyError(
                        "You cannot deactivate your own account"
                    )
                )


        # -----------------------------------------------------
        # LAST ACTIVE ADMIN PROTECTION
        # -----------------------------------------------------

        removes_active_admin = (
            current_role
            == "admin"

            and current_active

            and (
                updates.get(
                    "role",
                    current_role,
                )
                != "admin"

                or updates.get(
                    "is_active",
                    current_active,
                )
                is False
            )
        )


        if (
            removes_active_admin
            and self.repository
            .count_active_admins()
            <= 1
        ):
            raise (
                AdminUserSafetyError(
                    "At least one active admin account must remain"
                )
            )


        updates[
            "updated_at"
        ] = datetime.now(
            timezone.utc
        )


        updated = (
            self.repository
            .update_user(
                user_id,
                updates,
            )
        )


        if updated is None:
            return None


        return (
            self._serialize_user(
                updated
            )
        )


    @staticmethod
    def _serialize_user(
        user: dict,
    ) -> dict:
        return {
            "id":
                str(
                    user[
                        "_id"
                    ]
                ),

            "first_name":
                user.get(
                    "first_name",
                    "",
                ),

            "last_name":
                user.get(
                    "last_name",
                    "",
                ),

            "email":
                user.get(
                    "email",
                    "",
                ),

            "phone":
                user.get(
                    "phone"
                ),

            "role":
                user.get(
                    "role",
                    "customer",
                ),

            "is_active":
                bool(
                    user.get(
                        "is_active",
                        True,
                    )
                ),

            "created_at":
                user.get(
                    "created_at"
                ),

            "updated_at":
                user.get(
                    "updated_at"
                ),
        }


class AdminFitmentAlreadyExistsError(
    Exception
):
    pass


class AdminFitmentReferenceError(
    Exception
):
    pass


class AdminFitmentValidationError(
    Exception
):
    pass


class AdminFitmentService:
    def __init__(
        self,
        repository:
            AdminDashboardRepository,

        product_repository,
    ):
        self.repository = (
            repository
        )

        self.product_repository = (
            product_repository
        )


    def list_fitments(
        self,
    ) -> list[dict]:
        return [
            self._serialize_fitment(
                fitment
            )
            for fitment
            in self.repository
            .list_fitments()
        ]


    def update_fitment(
        self,
        fitment_id: str,
        payload,
    ) -> dict | None:
        existing = (
            self.repository
            .find_fitment_by_id(
                fitment_id
            )
        )


        if existing is None:
            return None


        updates = (
            payload.model_dump(
                exclude_unset=True
            )
        )


        if not updates:
            return (
                self._serialize_fitment(
                    existing
                )
            )


        compatibility_fields = {
            "product_id",
            "make",
            "model",
            "year_start",
            "year_end",
            "engine",
            "transmission",
        }


        compatibility_changed = any(
            field in updates
            for field
            in compatibility_fields
        )


        if compatibility_changed:
            product_id = str(
                updates.get(
                    "product_id",
                    existing[
                        "product_id"
                    ],
                )
            )


            if (
                "product_id"
                in updates
            ):
                product = (
                    self.product_repository
                    .find_by_id(
                        product_id
                    )
                )


                if product is None:
                    raise (
                        AdminFitmentReferenceError(
                            "Product not found"
                        )
                    )


                if not product.get(
                    "is_active",
                    True,
                ):
                    raise (
                        AdminFitmentReferenceError(
                            "Product is inactive"
                        )
                    )


            make = (
                updates.get(
                    "make",
                    existing[
                        "make"
                    ],
                )
                .strip()
            )


            model = (
                updates.get(
                    "model",
                    existing[
                        "model"
                    ],
                )
                .strip()
            )


            year_start = int(
                updates.get(
                    "year_start",
                    existing[
                        "year_start"
                    ],
                )
            )


            year_end = int(
                updates.get(
                    "year_end",
                    existing[
                        "year_end"
                    ],
                )
            )


            engine = updates.get(
                "engine",
                existing.get(
                    "engine"
                ),
            )


            transmission = (
                updates.get(
                    "transmission",
                    existing.get(
                        "transmission"
                    ),
                )
            )


            if engine is not None:
                engine = (
                    engine.strip()
                    or None
                )


            if (
                transmission
                is not None
            ):
                transmission = (
                    transmission.strip()
                    or None
                )


            make_normalized = (
                normalize_vehicle_text(
                    make
                )
            )


            model_normalized = (
                normalize_vehicle_text(
                    model
                )
            )


            if (
                make_normalized
                is None
                or model_normalized
                is None
            ):
                raise (
                    AdminFitmentValidationError(
                        "Make and model are required"
                    )
                )


            if (
                year_end
                < year_start
            ):
                raise (
                    AdminFitmentValidationError(
                        "year_end cannot be earlier than year_start"
                    )
                )


            engine_normalized = (
                normalize_vehicle_text(
                    engine
                )
            )


            transmission_normalized = (
                normalize_vehicle_text(
                    transmission
                )
            )


            existing_fitments = (
                self.repository
                .list_fitments_for_product(
                    product_id
                )
            )


            for candidate in (
                existing_fitments
            ):
                if (
                    str(
                        candidate[
                            "_id"
                        ]
                    )
                    == str(
                        existing[
                            "_id"
                        ]
                    )
                ):
                    continue


                if (
                    candidate.get(
                        "make_normalized"
                    )
                    == make_normalized

                    and candidate.get(
                        "model_normalized"
                    )
                    == model_normalized

                    and candidate.get(
                        "year_start"
                    )
                    == year_start

                    and candidate.get(
                        "year_end"
                    )
                    == year_end

                    and candidate.get(
                        "engine_normalized"
                    )
                    == engine_normalized

                    and candidate.get(
                        "transmission_normalized"
                    )
                    == transmission_normalized
                ):
                    raise (
                        AdminFitmentAlreadyExistsError(
                            "Fitment already exists"
                        )
                    )


            updates.update(
                {
                    "product_id":
                        product_id,

                    "make":
                        make,

                    "model":
                        model,

                    "make_normalized":
                        make_normalized,

                    "model_normalized":
                        model_normalized,

                    "year_start":
                        year_start,

                    "year_end":
                        year_end,

                    "engine":
                        engine,

                    "engine_normalized":
                        engine_normalized,

                    "transmission":
                        transmission,

                    "transmission_normalized":
                        transmission_normalized,
                }
            )


        updates[
            "updated_at"
        ] = datetime.now(
            timezone.utc
        )


        updated = (
            self.repository
            .update_fitment(
                fitment_id,
                updates,
            )
        )


        if updated is None:
            return None


        return (
            self._serialize_fitment(
                updated
            )
        )


    @staticmethod
    def _serialize_fitment(
        fitment: dict,
    ) -> dict:
        return {
            "id":
                str(
                    fitment[
                        "_id"
                    ]
                ),

            "product_id":
                str(
                    fitment[
                        "product_id"
                    ]
                ),

            "make":
                fitment[
                    "make"
                ],

            "model":
                fitment[
                    "model"
                ],

            "make_normalized":
                fitment[
                    "make_normalized"
                ],

            "model_normalized":
                fitment[
                    "model_normalized"
                ],

            "year_start":
                fitment[
                    "year_start"
                ],

            "year_end":
                fitment[
                    "year_end"
                ],

            "engine":
                fitment.get(
                    "engine"
                ),

            "engine_normalized":
                fitment.get(
                    "engine_normalized"
                ),

            "transmission":
                fitment.get(
                    "transmission"
                ),

            "transmission_normalized":
                fitment.get(
                    "transmission_normalized"
                ),

            "is_active":
                bool(
                    fitment.get(
                        "is_active",
                        True,
                    )
                ),

            "created_at":
                fitment.get(
                    "created_at"
                ),

            "updated_at":
                fitment.get(
                    "updated_at"
                ),
        }


class AdminCatalogAlreadyExistsError(
    Exception
):
    pass


class AdminCatalogValidationError(
    Exception
):
    pass


class AdminCatalogService:
    def __init__(
        self,
        repository:
            AdminDashboardRepository,
    ):
        self.repository = (
            repository
        )


    # =========================================================
    # CATEGORIES
    # =========================================================

    def list_categories(
        self,
    ) -> list[dict]:
        return [
            self._serialize_category(
                category
            )
            for category
            in self.repository
            .list_categories()
        ]


    def update_category(
        self,
        category_id: str,
        payload:
            AdminCategoryUpdate,
    ) -> dict | None:
        existing = (
            self.repository
            .find_category_by_id(
                category_id
            )
        )


        if existing is None:
            return None


        updates = (
            payload.model_dump(
                exclude_unset=True,
                mode="json",
            )
        )


        if not updates:
            return (
                self._serialize_category(
                    existing
                )
            )


        if (
            "name"
            in updates
        ):
            name = (
                updates[
                    "name"
                ]
                .strip()
            )


            new_slug = (
                slugify(
                    name
                )
            )


            duplicate = (
                self.repository
                .find_category_by_slug(
                    new_slug
                )
            )


            if (
                duplicate is not None
                and str(
                    duplicate[
                        "_id"
                    ]
                )
                != str(
                    existing[
                        "_id"
                    ]
                )
            ):
                raise (
                    AdminCatalogAlreadyExistsError(
                        "Category already exists"
                    )
                )


            updates[
                "name"
            ] = name

            updates[
                "slug"
            ] = new_slug


        if (
            "description"
            in updates
            and updates[
                "description"
            ] is not None
        ):
            updates[
                "description"
            ] = (
                updates[
                    "description"
                ]
                .strip()
            )


        if (
            "icon"
            in updates
            and updates[
                "icon"
            ] is not None
        ):
            updates[
                "icon"
            ] = (
                updates[
                    "icon"
                ]
                .strip()
            )


        if (
            "subcategories"
            in updates
        ):
            normalized = []

            seen = set()


            for item in (
                updates[
                    "subcategories"
                ]
                or []
            ):
                name = (
                    item[
                        "name"
                    ]
                    .strip()
                )

                sub_slug = (
                    slugify(
                        name
                    )
                )


                if (
                    sub_slug
                    in seen
                ):
                    raise (
                        AdminCatalogValidationError(
                            "Duplicate subcategory"
                        )
                    )


                seen.add(
                    sub_slug
                )


                normalized.append(
                    {
                        "name":
                            name,

                        "slug":
                            sub_slug,
                    }
                )


            updates[
                "subcategories"
            ] = normalized


        updates[
            "updated_at"
        ] = datetime.now(
            timezone.utc
        )


        updated = (
            self.repository
            .update_category(
                category_id,
                updates,
            )
        )


        if updated is None:
            return None


        return (
            self._serialize_category(
                updated
            )
        )


    # =========================================================
    # BRANDS
    # =========================================================

    def list_brands(
        self,
    ) -> list[dict]:
        return [
            self._serialize_brand(
                brand
            )
            for brand
            in self.repository
            .list_brands()
        ]


    def update_brand(
        self,
        brand_id: str,
        payload:
            AdminBrandUpdate,
    ) -> dict | None:
        existing = (
            self.repository
            .find_brand_by_id(
                brand_id
            )
        )


        if existing is None:
            return None


        updates = (
            payload.model_dump(
                exclude_unset=True,
                mode="json",
            )
        )


        if not updates:
            return (
                self._serialize_brand(
                    existing
                )
            )


        if (
            "name"
            in updates
        ):
            name = (
                updates[
                    "name"
                ]
                .strip()
            )


            new_slug = (
                slugify(
                    name
                )
            )


            duplicate = (
                self.repository
                .find_brand_by_slug(
                    new_slug
                )
            )


            if (
                duplicate is not None
                and str(
                    duplicate[
                        "_id"
                    ]
                )
                != str(
                    existing[
                        "_id"
                    ]
                )
            ):
                raise (
                    AdminCatalogAlreadyExistsError(
                        "Brand already exists"
                    )
                )


            updates[
                "name"
            ] = name

            updates[
                "slug"
            ] = new_slug


        for field in [
            "description",
            "country",
        ]:
            if (
                field
                in updates
                and updates[
                    field
                ] is not None
            ):
                updates[
                    field
                ] = (
                    updates[
                        field
                    ]
                    .strip()
                )


        updates[
            "updated_at"
        ] = datetime.now(
            timezone.utc
        )


        updated = (
            self.repository
            .update_brand(
                brand_id,
                updates,
            )
        )


        if updated is None:
            return None


        return (
            self._serialize_brand(
                updated
            )
        )


    @staticmethod
    def _serialize_category(
        category: dict,
    ) -> dict:
        return {
            "id":
                str(
                    category[
                        "_id"
                    ]
                ),

            "name":
                category[
                    "name"
                ],

            "slug":
                category[
                    "slug"
                ],

            "description":
                category.get(
                    "description"
                ),

            "icon":
                category.get(
                    "icon"
                ),

            "subcategories":
                list(
                    category.get(
                        "subcategories",
                        [],
                    )
                    or []
                ),

            "is_active":
                bool(
                    category.get(
                        "is_active",
                        True,
                    )
                ),

            "created_at":
                category[
                    "created_at"
                ],

            "updated_at":
                category[
                    "updated_at"
                ],
        }


    @staticmethod
    def _serialize_brand(
        brand: dict,
    ) -> dict:
        return {
            "id":
                str(
                    brand[
                        "_id"
                    ]
                ),

            "name":
                brand[
                    "name"
                ],

            "slug":
                brand[
                    "slug"
                ],

            "description":
                brand.get(
                    "description"
                ),

            "country":
                brand.get(
                    "country"
                ),

            "website":
                (
                    str(
                        brand[
                            "website"
                        ]
                    )
                    if brand.get(
                        "website"
                    )
                    else None
                ),

            "logo_url":
                (
                    str(
                        brand[
                            "logo_url"
                        ]
                    )
                    if brand.get(
                        "logo_url"
                    )
                    else None
                ),

            "is_active":
                bool(
                    brand.get(
                        "is_active",
                        True,
                    )
                ),

            "created_at":
                brand[
                    "created_at"
                ],

            "updated_at":
                brand[
                    "updated_at"
                ],
        }


class AdminProductService:
    def __init__(
        self,
        repository:
            AdminDashboardRepository,
    ):
        self.repository = (
            repository
        )


    def list_products(
        self,
    ) -> list[dict]:
        return [
            self._serialize_product(
                product
            )
            for product
            in self.repository
            .list_products()
        ]


    @staticmethod
    def _serialize_product(
        product: dict,
    ) -> dict:
        sale_price = (
            product.get(
                "sale_price"
            )
        )


        return {
            "id":
                str(
                    product[
                        "_id"
                    ]
                ),

            "name":
                product[
                    "name"
                ],

            "slug":
                product[
                    "slug"
                ],

            "sku":
                product[
                    "sku"
                ],

            "part_number":
                product[
                    "part_number"
                ],

            "brand_id":
                str(
                    product[
                        "brand_id"
                    ]
                ),

            "category_id":
                str(
                    product[
                        "category_id"
                    ]
                ),

            "subcategory_slug":
                product[
                    "subcategory_slug"
                ],

            "description":
                product[
                    "description"
                ],

            "price":
                float(
                    product[
                        "price"
                    ]
                ),

            "sale_price":
                (
                    float(
                        sale_price
                    )
                    if sale_price
                    is not None
                    else None
                ),

            "stock_quantity":
                int(
                    product.get(
                        "stock_quantity",
                        0,
                    )
                ),

            "images":
                list(
                    product.get(
                        "images",
                        [],
                    )
                    or []
                ),

            "specifications":
                dict(
                    product.get(
                        "specifications",
                        {},
                    )
                    or {}
                ),

            "warranty":
                product.get(
                    "warranty"
                ),

            "rating_average":
                float(
                    product.get(
                        "rating_average",
                        0,
                    )
                    or 0
                ),

            "review_count":
                int(
                    product.get(
                        "review_count",
                        0,
                    )
                    or 0
                ),

            "is_active":
                bool(
                    product.get(
                        "is_active",
                        True,
                    )
                ),

            "created_at":
                product[
                    "created_at"
                ],

            "updated_at":
                product[
                    "updated_at"
                ],
        }


# =============================================================
# ADMIN AI SESSIONS
# =============================================================

class AdminAISessionService:
    def __init__(
        self,
        *,
        repository,
    ):
        self.repository = (
            repository
        )


    def list_sessions(
        self,
    ) -> list[dict]:
        return [
            self._serialize_session(
                session
            )
            for session
            in self.repository
            .list_sessions()
        ]


    def get_session(
        self,
        session_id: str,
    ) -> dict | None:
        session = (
            self.repository
            .find_session_by_id(
                session_id
            )
        )


        if session is None:
            return None


        return (
            self._serialize_session(
                session
            )
        )


    def _serialize_session(
        self,
        session: dict,
    ) -> dict:
        user_id = str(
            session.get(
                "user_id",
                "",
            )
        )


        vehicle_id = str(
            session.get(
                "vehicle_id",
                "",
            )
        )


        user = (
            self.repository
            .find_user_by_id(
                user_id
            )
            if user_id
            else None
        )


        vehicle = (
            self.repository
            .find_vehicle_by_id(
                vehicle_id
            )
            if vehicle_id
            else None
        )


        if user:
            first_name = str(
                user.get(
                    "first_name",
                    "",
                )
                or ""
            ).strip()


            last_name = str(
                user.get(
                    "last_name",
                    "",
                )
                or ""
            ).strip()


            customer_name = (
                f"{first_name} {last_name}"
                .strip()
                or "Customer"
            )


            customer_email = str(
                user.get(
                    "email",
                    "",
                )
                or ""
            )

        else:
            customer_name = (
                "Unknown customer"
            )

            customer_email = ""


        messages = list(
            session.get(
                "messages",
                [],
            )
            or []
        )


        latest_turn = (
            session.get(
                "latest_turn"
            )
        )


        if (
            latest_turn is not None
            and hasattr(
                latest_turn,
                "model_dump",
            )
        ):
            latest_turn = (
                latest_turn
                .model_dump(
                    mode="python"
                )
            )


        safety_level = None


        if isinstance(
            latest_turn,
            dict,
        ):
            safety = (
                latest_turn.get(
                    "safety"
                )
            )


            if isinstance(
                safety,
                dict,
            ):
                safety_level = (
                    safety.get(
                        "level"
                    )
                )


        vehicle_year = None


        if (
            vehicle
            and vehicle.get(
                "year"
            )
            is not None
        ):
            vehicle_year = int(
                vehicle[
                    "year"
                ]
            )


        return {
            "id":
                str(
                    session[
                        "_id"
                    ]
                ),

            "user_id":
                user_id,

            "customer_name":
                customer_name,

            "customer_email":
                customer_email,

            "vehicle_id":
                vehicle_id,

            "vehicle_year":
                vehicle_year,

            "vehicle_make":
                (
                    str(
                        vehicle.get(
                            "make",
                            "",
                        )
                        or ""
                    )
                    if vehicle
                    else "Unknown"
                ),

            "vehicle_model":
                (
                    str(
                        vehicle.get(
                            "model",
                            "",
                        )
                        or ""
                    )
                    if vehicle
                    else "vehicle"
                ),

            "vehicle_engine":
                (
                    vehicle.get(
                        "engine"
                    )
                    if vehicle
                    else None
                ),

            "vehicle_transmission":
                (
                    vehicle.get(
                        "transmission"
                    )
                    if vehicle
                    else None
                ),

            "vehicle_nickname":
                (
                    vehicle.get(
                        "nickname"
                    )
                    if vehicle
                    else None
                ),

            "status":
                session.get(
                    "status",
                    "waiting_for_user",
                ),

            "messages":
                messages,

            "latest_turn":
                latest_turn,

            "message_count":
                len(
                    messages
                ),

            "safety_level":
                safety_level,

            "created_at":
                session[
                    "created_at"
                ],

            "updated_at":
                session[
                    "updated_at"
                ],
        }


admin_ai_session_service = (
    AdminAISessionService(
        repository=
            admin_ai_session_repository,
    )
)


# =============================================================
# ADMIN REVIEWS
# =============================================================

class AdminReviewService:
    def __init__(
        self,
        *,
        admin_repository:
            AdminDashboardRepository,
        review_repository,
        product_repository:
            ProductRepository,
    ):
        self.admin_repository = (
            admin_repository
        )

        self.review_repository = (
            review_repository
        )

        self.product_repository = (
            product_repository
        )


    def list_reviews(
        self,
    ) -> list[dict]:
        return [
            self._serialize_review(
                review
            )
            for review
            in self.review_repository
            .list_all()
        ]


    def get_review(
        self,
        review_id: str,
    ) -> dict | None:
        review = (
            self.review_repository
            .find_by_id(
                review_id
            )
        )


        if review is None:
            return None


        return (
            self._serialize_review(
                review
            )
        )


    def update_status(
        self,
        review_id: str,
        is_active: bool,
    ) -> dict | None:
        existing = (
            self.review_repository
            .find_by_id(
                review_id
            )
        )


        if existing is None:
            return None


        current_active = bool(
            existing.get(
                "is_active",
                True,
            )
        )


        if (
            current_active
            == is_active
        ):
            return (
                self._serialize_review(
                    existing
                )
            )


        updated = (
            self.review_repository
            .update(
                review_id,
                {
                    "is_active":
                        is_active,

                    "updated_at":
                        datetime.now(
                            timezone.utc
                        ),
                },
            )
        )


        if updated is None:
            return None


        product_id = str(
            updated.get(
                "product_id",
                "",
            )
        )


        if product_id:
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


        return (
            self._serialize_review(
                updated
            )
        )


    def _serialize_review(
        self,
        review: dict,
    ) -> dict:
        product_id = str(
            review.get(
                "product_id",
                "",
            )
        )


        user_id = str(
            review.get(
                "user_id",
                "",
            )
        )


        order_id = str(
            review.get(
                "order_id",
                "",
            )
        )


        product = (
            self.product_repository
            .find_by_id(
                product_id
            )
            if product_id
            else None
        )


        user = (
            self.admin_repository
            .find_user_by_id(
                user_id
            )
            if user_id
            else None
        )


        order = (
            self.admin_repository
            .find_order_by_id(
                order_id
            )
            if order_id
            else None
        )


        if user:
            first_name = str(
                user.get(
                    "first_name",
                    "",
                )
                or ""
            ).strip()


            last_name = str(
                user.get(
                    "last_name",
                    "",
                )
                or ""
            ).strip()


            fallback_name = (
                f"{first_name} {last_name}"
                .strip()
                or "Customer"
            )


            customer_email = str(
                user.get(
                    "email",
                    "",
                )
                or ""
            )

        else:
            fallback_name = (
                "Unknown customer"
            )

            customer_email = ""


        customer_name = str(
            review.get(
                "customer_name",
                fallback_name,
            )
            or fallback_name
        )


        return {
            "id":
                str(
                    review[
                        "_id"
                    ]
                ),

            "product_id":
                product_id,

            "product_name":
                (
                    str(
                        product.get(
                            "name",
                            "",
                        )
                        or ""
                    )
                    if product
                    else "Unknown product"
                ),

            "product_slug":
                (
                    str(
                        product.get(
                            "slug",
                            "",
                        )
                        or ""
                    )
                    if product
                    else ""
                ),

            "product_sku":
                (
                    str(
                        product.get(
                            "sku",
                            "",
                        )
                        or ""
                    )
                    if product
                    else ""
                ),

            "user_id":
                user_id,

            "customer_name":
                customer_name,

            "customer_email":
                customer_email,

            "order_id":
                order_id,

            "order_number":
                (
                    str(
                        order.get(
                            "order_number",
                            "",
                        )
                        or ""
                    )
                    if order
                    else ""
                ),

            "rating":
                int(
                    review.get(
                        "rating",
                        0,
                    )
                ),

            "comment":
                str(
                    review.get(
                        "comment",
                        "",
                    )
                    or ""
                ),

            "verified_purchase":
                bool(
                    review.get(
                        "verified_purchase",
                        False,
                    )
                ),

            "is_active":
                bool(
                    review.get(
                        "is_active",
                        True,
                    )
                ),

            "created_at":
                review.get(
                    "created_at"
                ),

            "updated_at":
                review.get(
                    "updated_at"
                ),
        }


admin_review_service = (
    AdminReviewService(
        admin_repository=
            admin_dashboard_repository,

        review_repository=
            review_repository,

        product_repository=
            product_repository,
    )
)


admin_dashboard_service = (
    AdminDashboardService(
        repository=
            admin_dashboard_repository,
    )
)


admin_user_service = (
    AdminUserService(
        repository=
            admin_dashboard_repository,
    )
)


admin_fitment_service = (
    AdminFitmentService(
        repository=
            admin_dashboard_repository,

        product_repository=
            product_repository,
    )
)


admin_catalog_service = (
    AdminCatalogService(
        repository=
            admin_dashboard_repository,
    )
)


admin_product_service = (
    AdminProductService(
        repository=
            admin_dashboard_repository,
    )
)


admin_order_service = (
    AdminOrderService(
        repository=
            admin_dashboard_repository,

        product_repository=
            product_repository,
    )
)
