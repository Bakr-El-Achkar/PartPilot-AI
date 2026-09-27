from types import SimpleNamespace

from app.repositories.product_repository import (
    ProductRepository,
)


class FakeCollection:
    def __init__(self):
        self.documents = []

    def insert_one(self, document):
        saved = document.copy()

        saved["_id"] = (
            f"product-{len(self.documents) + 1}"
        )

        self.documents.append(saved)

        return SimpleNamespace(
            inserted_id=saved["_id"]
        )

    def find_one(self, query):
        for document in self.documents:
            if all(
                document.get(key) == value
                for key, value in query.items()
            ):
                return document.copy()

        return None

    def find(self, query):
        results = []

        for document in self.documents:
            matches = True

            for key, value in query.items():
                if document.get(key) != value:
                    matches = False
                    break

            if matches:
                results.append(
                    document.copy()
                )

        return results

    def update_one(
        self,
        query,
        update,
    ):
        for index, document in enumerate(
            self.documents
        ):
            if all(
                document.get(key) == value
                for key, value in query.items()
            ):
                updated = document.copy()

                updated.update(
                    update.get("$set", {})
                )

                self.documents[index] = updated

                return SimpleNamespace(
                    matched_count=1
                )

        return SimpleNamespace(
            matched_count=0
        )


def sample_product(
    *,
    sku="BOSCH-BC1212",
    slug="bosch-quietcast-brake-pads",
    brand_id="brand-1",
    category_id="category-1",
    subcategory_slug="brake-pads",
    active=True,
):
    return {
        "name": "Bosch QuietCast Brake Pads",
        "slug": slug,
        "sku": sku,
        "part_number": "BC1212",
        "brand_id": brand_id,
        "category_id": category_id,
        "subcategory_slug": subcategory_slug,
        "description": "Ceramic brake pads",
        "price": 49.99,
        "sale_price": None,
        "stock_quantity": 20,
        "images": [],
        "specifications": {},
        "warranty": None,
        "rating_average": 0,
        "review_count": 0,
        "is_active": active,
    }


def test_product_repository_creates_product():
    collection = FakeCollection()

    repository = ProductRepository(
        collection
    )

    product = repository.create(
        sample_product()
    )

    assert (
        product["_id"]
        == "product-1"
    )

    assert (
        product["sku"]
        == "BOSCH-BC1212"
    )


def test_product_repository_finds_by_sku():
    collection = FakeCollection()

    repository = ProductRepository(
        collection
    )

    repository.create(
        sample_product()
    )

    product = repository.find_by_sku(
        "BOSCH-BC1212"
    )

    assert product is not None

    assert (
        product["name"]
        == "Bosch QuietCast Brake Pads"
    )


def test_product_repository_finds_by_slug():
    collection = FakeCollection()

    repository = ProductRepository(
        collection
    )

    repository.create(
        sample_product()
    )

    product = repository.find_by_slug(
        "bosch-quietcast-brake-pads"
    )

    assert product is not None

    assert (
        product["sku"]
        == "BOSCH-BC1212"
    )


def test_product_repository_lists_only_active():
    collection = FakeCollection()

    repository = ProductRepository(
        collection
    )

    repository.create(
        sample_product(
            sku="ACTIVE-001",
            slug="active-product",
            active=True,
        )
    )

    repository.create(
        sample_product(
            sku="INACTIVE-001",
            slug="inactive-product",
            active=False,
        )
    )

    products = repository.list_active()

    assert len(products) == 1

    assert (
        products[0]["sku"]
        == "ACTIVE-001"
    )


def test_product_repository_filters_by_category():
    collection = FakeCollection()

    repository = ProductRepository(
        collection
    )

    repository.create(
        sample_product(
            sku="BRAKE-001",
            slug="brake-product",
            category_id="brakes",
        )
    )

    repository.create(
        sample_product(
            sku="ENGINE-001",
            slug="engine-product",
            category_id="engine",
        )
    )

    products = repository.list_active(
        category_id="brakes"
    )

    assert len(products) == 1

    assert (
        products[0]["sku"]
        == "BRAKE-001"
    )


def test_product_repository_filters_by_brand():
    collection = FakeCollection()

    repository = ProductRepository(
        collection
    )

    repository.create(
        sample_product(
            sku="BOSCH-001",
            slug="bosch-product",
            brand_id="bosch",
        )
    )

    repository.create(
        sample_product(
            sku="NGK-001",
            slug="ngk-product",
            brand_id="ngk",
        )
    )

    products = repository.list_active(
        brand_id="bosch"
    )

    assert len(products) == 1

    assert (
        products[0]["sku"]
        == "BOSCH-001"
    )


def test_product_repository_filters_by_subcategory():
    collection = FakeCollection()

    repository = ProductRepository(
        collection
    )

    repository.create(
        sample_product(
            sku="PAD-001",
            slug="brake-pad",
            subcategory_slug="brake-pads",
        )
    )

    repository.create(
        sample_product(
            sku="ROTOR-001",
            slug="brake-rotor",
            subcategory_slug="brake-rotors",
        )
    )

    products = repository.list_active(
        subcategory_slug="brake-pads"
    )

    assert len(products) == 1

    assert (
        products[0]["sku"]
        == "PAD-001"
    )


def test_product_repository_updates_product():
    collection = FakeCollection()

    repository = ProductRepository(
        collection
    )

    created = repository.create(
        sample_product()
    )

    updated = repository.update(
        created["_id"],
        {
            "price": 39.99,
            "stock_quantity": 9,
        },
    )

    assert updated is not None

    assert updated["price"] == 39.99

    assert (
        updated["stock_quantity"]
        == 9
    )