from types import SimpleNamespace

from app.repositories.catalog_repository import (
    BrandRepository,
    CategoryRepository,
)


class FakeCollection:
    def __init__(self):
        self.documents = []

    def insert_one(self, document):
        document = document.copy()

        document["_id"] = (
            f"id-{len(self.documents) + 1}"
        )

        self.documents.append(document)

        return SimpleNamespace(
            inserted_id=document["_id"]
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
            if all(
                document.get(key) == value
                for key, value in query.items()
            ):
                results.append(
                    document.copy()
                )

        return results


def test_category_repository_creates_category():
    collection = FakeCollection()

    repository = CategoryRepository(
        collection
    )

    category = repository.create(
        {
            "name": "Brakes",
            "slug": "brakes",
            "is_active": True,
        }
    )

    assert category["_id"] == "id-1"
    assert category["name"] == "Brakes"


def test_category_repository_finds_by_slug():
    collection = FakeCollection()

    repository = CategoryRepository(
        collection
    )

    repository.create(
        {
            "name": "Brakes",
            "slug": "brakes",
            "is_active": True,
        }
    )

    result = repository.find_by_slug(
        "brakes"
    )

    assert result is not None
    assert result["name"] == "Brakes"


def test_category_repository_lists_active_categories():
    collection = FakeCollection()

    repository = CategoryRepository(
        collection
    )

    repository.create(
        {
            "name": "Brakes",
            "slug": "brakes",
            "is_active": True,
        }
    )

    repository.create(
        {
            "name": "Hidden",
            "slug": "hidden",
            "is_active": False,
        }
    )

    result = repository.list_active()

    assert len(result) == 1
    assert result[0]["slug"] == "brakes"


def test_brand_repository_creates_brand():
    collection = FakeCollection()

    repository = BrandRepository(
        collection
    )

    brand = repository.create(
        {
            "name": "Bosch",
            "slug": "bosch",
            "is_active": True,
        }
    )

    assert brand["_id"] == "id-1"
    assert brand["name"] == "Bosch"


def test_brand_repository_finds_by_slug():
    collection = FakeCollection()

    repository = BrandRepository(
        collection
    )

    repository.create(
        {
            "name": "Bosch",
            "slug": "bosch",
            "is_active": True,
        }
    )

    result = repository.find_by_slug(
        "bosch"
    )

    assert result is not None
    assert result["name"] == "Bosch"


def test_brand_repository_lists_active_brands():
    collection = FakeCollection()

    repository = BrandRepository(
        collection
    )

    repository.create(
        {
            "name": "Bosch",
            "slug": "bosch",
            "is_active": True,
        }
    )

    repository.create(
        {
            "name": "Inactive",
            "slug": "inactive",
            "is_active": False,
        }
    )

    result = repository.list_active()

    assert len(result) == 1
    assert result[0]["slug"] == "bosch"


def test_category_repository_finds_by_id():
    collection = FakeCollection()

    repository = CategoryRepository(
        collection
    )

    created = repository.create(
        {
            "name": "Brakes",
            "slug": "brakes",
            "is_active": True,
        }
    )

    result = repository.find_by_id(
        created["_id"]
    )

    assert result is not None
    assert result["name"] == "Brakes"


def test_brand_repository_finds_by_id():
    collection = FakeCollection()

    repository = BrandRepository(
        collection
    )

    created = repository.create(
        {
            "name": "Bosch",
            "slug": "bosch",
            "is_active": True,
        }
    )

    result = repository.find_by_id(
        created["_id"]
    )

    assert result is not None
    assert result["name"] == "Bosch"