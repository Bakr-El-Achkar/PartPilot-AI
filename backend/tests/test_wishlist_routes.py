from datetime import (
    datetime,
    timezone,
)

from bson import (
    ObjectId,
)

from fastapi.testclient import (
    TestClient,
)

from app.dependencies.auth import (
    get_current_user,
)

from app.main import (
    app,
)

import app.routes.wishlist as wishlist_routes


client = TestClient(
    app
)


USER_ID = (
    ObjectId()
)


NOW = datetime.now(
    timezone.utc
)


def fake_current_user():
    return {
        "_id":
            USER_ID,

        "email":
            "customer@example.com",

        "role":
            "customer",

        "is_active":
            True,
    }


def sample_product(
    product_id=
        "product-1",
):
    return {
        "id":
            product_id,

        "name":
            "Bosch Brake Pads",

        "slug":
            "bosch-brake-pads",

        "sku":
            "BOSCH-001",

        "part_number":
            "BP-001",

        "brand_id":
            "brand-1",

        "category_id":
            "category-1",

        "subcategory_slug":
            "brake-pads",

        "description":
            "Brake pads",

        "price":
            49.99,

        "sale_price":
            None,

        "stock_quantity":
            10,

        "images":
            [],

        "specifications":
            {},

        "warranty":
            None,

        "rating_average":
            4.5,

        "review_count":
            10,

        "is_active":
            True,

        "created_at":
            NOW,

        "updated_at":
            NOW,
    }


class FakeWishlistService:
    def __init__(
        self
    ):
        self.products = [
            sample_product()
        ]


    def list_products(
        self,
        user_id,
    ):
        return (
            self.products
        )


    def list_product_ids(
        self,
        user_id,
    ):
        return [
            product[
                "id"
            ]
            for product
            in self.products
        ]


    def add_product(
        self,
        user_id,
        product_id,
    ):
        for product in (
            self.products
        ):
            if (
                product[
                    "id"
                ] == product_id
            ):
                return product


        product = (
            sample_product(
                product_id
            )
        )


        self.products.append(
            product
        )


        return product


    def remove_product(
        self,
        user_id,
        product_id,
    ):
        for product in list(
            self.products
        ):
            if (
                product[
                    "id"
                ] == product_id
            ):
                self.products.remove(
                    product
                )

                return


        raise (
            wishlist_routes
            .WishlistItemNotFoundError(
                "Product is not in wishlist"
            )
        )


ORIGINAL_WISHLIST_SERVICE = (
    wishlist_routes
    .wishlist_service
)


def setup_function():
    app.dependency_overrides[
        get_current_user
    ] = fake_current_user


    wishlist_routes.wishlist_service = (
        FakeWishlistService()
    )


def teardown_function():
    app.dependency_overrides.pop(
        get_current_user,
        None,
    )


    wishlist_routes.wishlist_service = (
        ORIGINAL_WISHLIST_SERVICE
    )


def test_get_wishlist():
    response = client.get(
        "/api/wishlist"
    )


    assert (
        response.status_code
        == 200
    )


    assert (
        len(
            response.json()
        )
        == 1
    )


def test_get_wishlist_product_ids():
    response = client.get(
        "/api/wishlist/product-ids"
    )


    assert (
        response.status_code
        == 200
    )


    assert (
        response.json()
        == [
            "product-1"
        ]
    )


def test_add_to_wishlist():
    response = client.post(
        "/api/wishlist/product-2"
    )


    assert (
        response.status_code
        == 201
    )


    assert (
        response.json()[
            "id"
        ]
        == "product-2"
    )


def test_remove_from_wishlist():
    response = client.delete(
        "/api/wishlist/product-1"
    )


    assert (
        response.status_code
        == 204
    )


def test_remove_missing_wishlist_item():
    response = client.delete(
        "/api/wishlist/missing"
    )


    assert (
        response.status_code
        == 404
    )
