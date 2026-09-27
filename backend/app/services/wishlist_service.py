from app.repositories.wishlist_repository import (
    WishlistRepository,
    wishlist_repository,
)

from app.services.product_service import (
    ProductService,
    product_service,
)


class WishlistProductNotFoundError(
    Exception
):
    pass


class WishlistItemNotFoundError(
    Exception
):
    pass


class WishlistService:
    def __init__(
        self,
        repository:
            WishlistRepository,

        product_service:
            ProductService,
    ):
        self.repository = (
            repository
        )

        self.product_service = (
            product_service
        )


    def list_products(
        self,
        user_id: str,
    ) -> list[dict]:
        entries = (
            self.repository
            .find_by_user_id(
                user_id
            )
        )


        products: list[dict] = []


        for entry in entries:
            product = (
                self.product_service
                .get_product(
                    entry[
                        "product_id"
                    ]
                )
            )


            if (
                product is None
                or not product.get(
                    "is_active",
                    True,
                )
            ):
                continue


            products.append(
                product
            )


        return products


    def list_product_ids(
        self,
        user_id: str,
    ) -> list[str]:
        return [
            entry[
                "product_id"
            ]
            for entry
            in self.repository
            .find_by_user_id(
                user_id
            )
        ]


    def add_product(
        self,
        user_id: str,
        product_id: str,
    ) -> dict:
        product = (
            self.product_service
            .get_product(
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
                WishlistProductNotFoundError(
                    "Product not found"
                )
            )


        self.repository.add(
            user_id,
            product_id,
        )


        return product


    def remove_product(
        self,
        user_id: str,
        product_id: str,
    ) -> None:
        removed = (
            self.repository.remove(
                user_id,
                product_id,
            )
        )


        if not removed:
            raise (
                WishlistItemNotFoundError(
                    "Product is not in wishlist"
                )
            )


wishlist_service = (
    WishlistService(
        repository=
            wishlist_repository,

        product_service=
            product_service,
    )
)
