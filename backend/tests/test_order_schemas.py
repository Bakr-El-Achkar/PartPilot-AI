import pytest
from pydantic import ValidationError

from app.schemas.order import (
    OrderCreate,
)


def test_order_create_accepts_valid_payload():
    payload = OrderCreate(
        items=[
            {
                "product_id":
                    "product-1",
                "quantity": 2,
            }
        ],
        shipping_address=(
            "Tripoli, North Lebanon"
        ),
        payment_method=(
            "cash_on_delivery"
        ),
    )

    assert (
        payload.items[0].quantity
        == 2
    )

    assert (
        payload.shipping_address
        == "Tripoli, North Lebanon"
    )


def test_order_requires_at_least_one_item():
    with pytest.raises(
        ValidationError
    ):
        OrderCreate(
            items=[],
            shipping_address=(
                "Tripoli, Lebanon"
            ),
        )


def test_order_rejects_zero_quantity():
    with pytest.raises(
        ValidationError
    ):
        OrderCreate(
            items=[
                {
                    "product_id":
                        "product-1",
                    "quantity": 0,
                }
            ],
            shipping_address=(
                "Tripoli, Lebanon"
            ),
        )


def test_order_rejects_short_address():
    with pytest.raises(
        ValidationError
    ):
        OrderCreate(
            items=[
                {
                    "product_id":
                        "product-1",
                    "quantity": 1,
                }
            ],
            shipping_address="x",
        )
