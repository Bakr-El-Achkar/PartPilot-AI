from datetime import datetime

import pytest

from app.schemas.catalog import (
    BrandCreate,
    CategoryCreate,
    SubcategoryInput,
)
from app.services.catalog_service import (
    BrandService,
    CatalogAlreadyExistsError,
    CategoryService,
)


class FakeCategoryRepository:
    def __init__(self):
        self.documents = []

    def find_by_slug(self, slug: str):
        for document in self.documents:
            if document["slug"] == slug:
                return document.copy()

        return None

    def create(self, category_data: dict):
        document = category_data.copy()
        document["_id"] = (
            f"category-{len(self.documents) + 1}"
        )

        self.documents.append(document)

        return document.copy()

    def list_active(self):
        return [
            document.copy()
            for document in self.documents
            if document.get("is_active") is True
        ]


class FakeBrandRepository:
    def __init__(self):
        self.documents = []

    def find_by_slug(self, slug: str):
        for document in self.documents:
            if document["slug"] == slug:
                return document.copy()

        return None

    def create(self, brand_data: dict):
        document = brand_data.copy()
        document["_id"] = (
            f"brand-{len(self.documents) + 1}"
        )

        self.documents.append(document)

        return document.copy()

    def list_active(self):
        return [
            document.copy()
            for document in self.documents
            if document.get("is_active") is True
        ]


def test_category_service_generates_slugs():
    repository = FakeCategoryRepository()

    service = CategoryService(repository)

    category = service.create_category(
        CategoryCreate(
            name="Brake & Wheel",
            description=(
                "Brake and wheel components"
            ),
            icon="disc-3",
            subcategories=[
                SubcategoryInput(
                    name="Brake Pads"
                ),
                SubcategoryInput(
                    name="Brake Rotors"
                ),
            ],
        )
    )

    assert category["id"] == "category-1"

    assert (
        category["slug"]
        == "brake-wheel"
    )

    assert (
        category["subcategories"][0]["slug"]
        == "brake-pads"
    )

    assert (
        category["subcategories"][1]["slug"]
        == "brake-rotors"
    )

    assert category["is_active"] is True

    assert isinstance(
        category["created_at"],
        datetime,
    )

    assert isinstance(
        category["updated_at"],
        datetime,
    )


def test_category_service_rejects_duplicate():
    repository = FakeCategoryRepository()

    service = CategoryService(repository)

    payload = CategoryCreate(
        name="Brakes",
        subcategories=[],
    )

    service.create_category(payload)

    with pytest.raises(
        CatalogAlreadyExistsError
    ):
        service.create_category(payload)


def test_category_service_lists_active_categories():
    repository = FakeCategoryRepository()

    service = CategoryService(repository)

    service.create_category(
        CategoryCreate(
            name="Brakes",
            subcategories=[
                SubcategoryInput(
                    name="Brake Pads"
                )
            ],
        )
    )

    categories = (
        service.list_categories()
    )

    assert len(categories) == 1
    assert categories[0]["name"] == "Brakes"
    assert categories[0]["slug"] == "brakes"


def test_brand_service_generates_slug():
    repository = FakeBrandRepository()

    service = BrandService(repository)

    brand = service.create_brand(
        BrandCreate(
            name="AC Delco",
            description=(
                "Automotive replacement parts"
            ),
            country="United States",
            website=(
                "https://www.acdelco.com"
            ),
            logo_url=(
                "https://example.com/acdelco.png"
            ),
        )
    )

    assert brand["id"] == "brand-1"

    assert (
        brand["slug"]
        == "ac-delco"
    )

    assert brand["is_active"] is True

    assert (
        brand["website"]
        == "https://www.acdelco.com/"
    )

    assert isinstance(
        brand["created_at"],
        datetime,
    )


def test_brand_service_rejects_duplicate():
    repository = FakeBrandRepository()

    service = BrandService(repository)

    payload = BrandCreate(
        name="Bosch"
    )

    service.create_brand(payload)

    with pytest.raises(
        CatalogAlreadyExistsError
    ):
        service.create_brand(payload)


def test_brand_service_lists_active_brands():
    repository = FakeBrandRepository()

    service = BrandService(repository)

    service.create_brand(
        BrandCreate(
            name="Bosch",
            country="Germany",
        )
    )

    brands = service.list_brands()

    assert len(brands) == 1
    assert brands[0]["name"] == "Bosch"
    assert brands[0]["slug"] == "bosch"