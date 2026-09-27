from datetime import (
    datetime,
    timezone,
)

from app.services.admin_service import (
    AdminProductService,
)


class FakeAdminRepository:
    def list_products(
        self,
    ):
        now = datetime.now(
            timezone.utc
        )


        return [
            {
                "_id":
                    "product-active",

                "name":
                    "Active Brake Pads",

                "slug":
                    "active-brake-pads",

                "sku":
                    "PAD-001",

                "part_number":
                    "P001",

                "brand_id":
                    "brand-1",

                "category_id":
                    "category-1",

                "subcategory_slug":
                    "brake-pads",

                "description":
                    "Active test product",

                "price":
                    50.0,

                "sale_price":
                    45.0,

                "stock_quantity":
                    4,

                "images":
                    [],

                "specifications":
                    {},

                "warranty":
                    None,

                "rating_average":
                    4.5,

                "review_count":
                    5,

                "is_active":
                    True,

                "created_at":
                    now,

                "updated_at":
                    now,
            },

            {
                "_id":
                    "product-inactive",

                "name":
                    "Inactive Rotor",

                "slug":
                    "inactive-rotor",

                "sku":
                    "ROT-001",

                "part_number":
                    "R001",

                "brand_id":
                    "brand-1",

                "category_id":
                    "category-1",

                "subcategory_slug":
                    "rotors",

                "description":
                    "Inactive test product",

                "price":
                    80.0,

                "sale_price":
                    None,

                "stock_quantity":
                    12,

                "images":
                    [],

                "specifications":
                    {},

                "warranty":
                    None,

                "rating_average":
                    0,

                "review_count":
                    0,

                "is_active":
                    False,

                "created_at":
                    now,

                "updated_at":
                    now,
            },
        ]


def test_admin_products_include_active_and_inactive():
    service = (
        AdminProductService(
            repository=
                FakeAdminRepository(),
        )
    )


    products = (
        service.list_products()
    )


    assert (
        len(
            products
        )
        == 2
    )


    assert (
        products[
            0
        ][
            "is_active"
        ]
        is True
    )


    assert (
        products[
            1
        ][
            "is_active"
        ]
        is False
    )


def test_admin_product_serializes_inventory_fields():
    service = (
        AdminProductService(
            repository=
                FakeAdminRepository(),
        )
    )


    product = (
        service.list_products()[
            0
        ]
    )


    assert (
        product[
            "stock_quantity"
        ]
        == 4
    )


    assert (
        product[
            "sale_price"
        ]
        == 45.0
    )


    assert (
        product[
            "sku"
        ]
        == "PAD-001"
    )
