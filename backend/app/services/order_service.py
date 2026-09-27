from datetime import (
    datetime,
    timezone,
)
from uuid import uuid4
from hashlib import sha256
import json

from pymongo.errors import PyMongoError

from app.repositories.order_repository import (
    OrderRepository,
    order_repository,
)
from app.repositories.product_repository import (
    ProductRepository,
    product_repository,
)
from app.repositories.vehicle_repository import (
    VehicleRepository,
    vehicle_repository,
)
from app.schemas.order import (
    OrderCreate,
)


DELIVERY_FEE = 5.0


class OrderProductUnavailableError(
    Exception
):
    pass


class OrderStockError(
    Exception
):
    pass


class OrderVehicleNotFoundError(
    Exception
):
    pass


class OrderIdempotencyConflictError(Exception):
    pass


class OrderService:
    def __init__(
        self,
        order_repository:
            OrderRepository,
        product_repository:
            ProductRepository,
        vehicle_repository:
            VehicleRepository,
    ):
        self.order_repository = (
            order_repository
        )

        self.product_repository = (
            product_repository
        )

        self.vehicle_repository = (
            vehicle_repository
        )

    def create_order(
        self,
        user_id: str,
        payload: OrderCreate,
        idempotency_key: str,
    ) -> dict:
        fingerprint = self._request_fingerprint(payload)
        self.order_repository.ensure_idempotency_index()
        prior = self.order_repository.find_by_idempotency_key(
            user_id, idempotency_key,
        )
        if prior is not None:
            return self._serialize(self._matching_order(prior, fingerprint))

        if payload.vehicle_id:
            vehicle = (
                self.vehicle_repository
                .find_by_id_for_user(
                    payload.vehicle_id,
                    user_id,
                )
            )

            if vehicle is None:
                raise (
                    OrderVehicleNotFoundError(
                        "Vehicle not found"
                    )
                )

        requested_quantities: dict[
            str,
            int,
        ] = {}

        for item in payload.items:
            requested_quantities[
                item.product_id
            ] = (
                requested_quantities.get(
                    item.product_id,
                    0,
                )
                + item.quantity
            )

        prepared_items: list[
            dict
        ] = []

        subtotal = 0.0

        for (
            product_id,
            quantity,
        ) in requested_quantities.items():
            product = (
                self.product_repository
                .find_by_id(
                    product_id
                )
            )

            if (
                product is None
                or not product.get(
                    "is_active",
                    True,
                )
            ):
                raise (
                    OrderProductUnavailableError(
                        "One or more products "
                        "are no longer available"
                    )
                )

            stock_quantity = int(
                product.get(
                    "stock_quantity",
                    0,
                )
            )

            if quantity > stock_quantity:
                raise OrderStockError(
                    f"Insufficient stock for "
                    f"{product.get('name', 'product')}"
                )

            sale_price = (
                product.get(
                    "sale_price"
                )
            )

            unit_price = float(
                sale_price
                if sale_price is not None
                else product["price"]
            )

            line_total = round(
                unit_price
                * quantity,
                2,
            )

            subtotal = round(
                subtotal
                + line_total,
                2,
            )

            images = (
                product.get(
                    "images",
                    [],
                )
                or []
            )

            prepared_items.append(
                {
                    "product_id":
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

                    "image_url":
                        (
                            images[0]
                            if images
                            else None
                        ),

                    "unit_price":
                        unit_price,

                    "quantity":
                        quantity,

                    "line_total":
                        line_total,
                }
            )

        now = datetime.now(timezone.utc)
        delivery_fee = DELIVERY_FEE
        discount = 0.0
        total = round(subtotal + delivery_fee - discount, 2)

        document = {
            "order_number": self._new_order_number(),
            "user_id": user_id,
            "idempotency_key": idempotency_key,
            "request_fingerprint": fingerprint,
            "vehicle_id": payload.vehicle_id,
            "items": prepared_items,
            "subtotal": subtotal,
            "delivery_fee": delivery_fee,
            "discount": discount,
            "total": total,
            "payment_method": payload.payment_method,
            "payment_status": "pending",
            "shipping_address": payload.shipping_address,
            "status": "processing",
            "created_at": now,
            "updated_at": now,
        }

        def reserve_and_create(session):
            existing = self.order_repository.find_by_idempotency_key(
                user_id, idempotency_key, session=session,
            )
            if existing is not None:
                return self._matching_order(existing, fingerprint)

            for item in prepared_items:
                reserved_ok = self.product_repository.decrement_stock(
                    item["product_id"],
                    item["quantity"],
                    session=session,
                )

                if not reserved_ok:
                    raise OrderStockError(
                        "Stock changed while placing the order. "
                        "Please review your cart."
                    )

            return self.order_repository.create(document, session=session)

        try:
            created = self.order_repository.run_transaction(reserve_and_create)
        except PyMongoError:
            prior = self.order_repository.find_by_idempotency_key(
                user_id, idempotency_key,
            )
            if prior is None:
                raise
            created = self._matching_order(prior, fingerprint)

        return self._serialize(
            created
        )

    @staticmethod
    def _request_fingerprint(payload: OrderCreate) -> str:
        quantities = {}
        for item in payload.items:
            quantities[item.product_id] = (
                quantities.get(item.product_id, 0) + item.quantity
            )
        request = {
            "items": sorted(quantities.items()),
            "shipping_address": payload.shipping_address,
            "payment_method": payload.payment_method,
            "vehicle_id": payload.vehicle_id,
        }
        canonical = json.dumps(
            request, sort_keys=True, separators=(",", ":"),
            ensure_ascii=False,
        )
        return sha256(canonical.encode("utf-8")).hexdigest()

    @staticmethod
    def _matching_order(order: dict, fingerprint: str) -> dict:
        if order.get("request_fingerprint") != fingerprint:
            raise OrderIdempotencyConflictError(
                "Idempotency key was already used for another order request"
            )
        return order

    def list_orders(
        self,
        user_id: str,
    ) -> list[dict]:
        orders = (
            self.order_repository
            .find_by_user_id(
                user_id
            )
        )

        return [
            self._serialize(
                order
            )
            for order in orders
        ]

    def get_order(
        self,
        order_id: str,
        user_id: str,
    ) -> dict | None:
        order = (
            self.order_repository
            .find_by_id_for_user(
                order_id,
                user_id,
            )
        )

        if order is None:
            return None

        return self._serialize(
            order
        )

    @staticmethod
    def _new_order_number() -> str:
        return (
            "VHX-"
            + uuid4()
            .hex[:8]
            .upper()
        )

    @staticmethod
    def _serialize(
        order: dict,
    ) -> dict:
        return {
            "id":
                str(
                    order["_id"]
                ),

            "order_number":
                order[
                    "order_number"
                ],

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


order_service = OrderService(
    order_repository=(
        order_repository
    ),
    product_repository=(
        product_repository
    ),
    vehicle_repository=(
        vehicle_repository
    ),
)
