import pytest

from app.services.wishlist_service import (
    WishlistItemNotFoundError,
    WishlistProductNotFoundError,
    WishlistService,
)


class FakeWishlistRepository:
    def __init__(
        self
    ):
        self.entries = []


    def find_by_user_id(
        self,
        user_id,
    ):
        return [
            entry
            for entry
            in self.entries
            if entry[
                "user_id"
            ] == user_id
        ]


    def find_by_user_and_product(
        self,
        user_id,
        product_id,
    ):
        for entry in (
            self.entries
        ):
            if (
                entry[
                    "user_id"
                ] == user_id
                and
                entry[
                    "product_id"
                ] == product_id
            ):
                return entry

        return None


    def add(
        self,
        user_id,
        product_id,
    ):
        existing = (
            self.find_by_user_and_product(
                user_id,
                product_id,
            )
        )


        if existing:
            return existing


        entry = {
            "_id":
                f"wishlist-{len(self.entries) + 1}",

            "user_id":
                user_id,

            "product_id":
                product_id,
        }


        self.entries.append(
            entry
        )


        return entry


    def remove(
        self,
        user_id,
        product_id,
    ):
        entry = (
            self.find_by_user_and_product(
                user_id,
                product_id,
            )
        )


        if entry is None:
            return False


        self.entries.remove(
            entry
        )


        return True


class FakeProductService:
    def __init__(
        self
    ):
        self.products = {
            "product-1": {
                "id":
                    "product-1",

                "name":
                    "Brake Pads",

                "is_active":
                    True,
            },

            "inactive": {
                "id":
                    "inactive",

                "name":
                    "Inactive Product",

                "is_active":
                    False,
            },
        }


    def get_product(
        self,
        product_id,
    ):
        return self.products.get(
            product_id
        )


def make_service():
    return WishlistService(
        repository=
            FakeWishlistRepository(),

        product_service=
            FakeProductService(),
    )


def test_add_product_to_wishlist():
    service = (
        make_service()
    )


    product = (
        service.add_product(
            "user-1",
            "product-1",
        )
    )


    assert (
        product["id"]
        == "product-1"
    )


    assert (
        service.list_product_ids(
            "user-1"
        )
        == [
            "product-1"
        ]
    )


def test_add_same_product_is_idempotent():
    service = (
        make_service()
    )


    service.add_product(
        "user-1",
        "product-1",
    )


    service.add_product(
        "user-1",
        "product-1",
    )


    assert (
        service.list_product_ids(
            "user-1"
        )
        == [
            "product-1"
        ]
    )


def test_wishlist_is_scoped_to_user():
    service = (
        make_service()
    )


    service.add_product(
        "user-1",
        "product-1",
    )


    assert (
        service.list_product_ids(
            "user-2"
        )
        == []
    )


def test_missing_product_cannot_be_added():
    service = (
        make_service()
    )


    with pytest.raises(
        WishlistProductNotFoundError
    ):
        service.add_product(
            "user-1",
            "missing",
        )


def test_inactive_product_cannot_be_added():
    service = (
        make_service()
    )


    with pytest.raises(
        WishlistProductNotFoundError
    ):
        service.add_product(
            "user-1",
            "inactive",
        )


def test_remove_product():
    service = (
        make_service()
    )


    service.add_product(
        "user-1",
        "product-1",
    )


    service.remove_product(
        "user-1",
        "product-1",
    )


    assert (
        service.list_product_ids(
            "user-1"
        )
        == []
    )


def test_remove_missing_wishlist_item():
    service = (
        make_service()
    )


    with pytest.raises(
        WishlistItemNotFoundError
    ):
        service.remove_product(
            "user-1",
            "product-1",
        )
