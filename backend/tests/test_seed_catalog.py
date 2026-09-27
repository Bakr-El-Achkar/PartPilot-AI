from app.services.catalog_service import (
    CatalogAlreadyExistsError,
)
from scripts.seed_catalog import (
    BRANDS,
    CATEGORIES,
    seed_catalog,
)


class FakeCategoryService:
    def __init__(self):
        self.names = set()

    def create_category(self, category):
        if category.name in self.names:
            raise CatalogAlreadyExistsError(
                "Category already exists"
            )

        self.names.add(category.name)

        return {
            "name": category.name,
        }


class FakeBrandService:
    def __init__(self):
        self.names = set()

    def create_brand(self, brand):
        if brand.name in self.names:
            raise CatalogAlreadyExistsError(
                "Brand already exists"
            )

        self.names.add(brand.name)

        return {
            "name": brand.name,
        }


def test_seed_contains_large_automotive_foundation():
    assert len(CATEGORIES) >= 15
    assert len(BRANDS) >= 15

    category_names = {
        category["name"]
        for category in CATEGORIES
    }

    assert "Engine" in category_names
    assert "Brakes" in category_names
    assert "Suspension" in category_names
    assert "Transmission & Drivetrain" in category_names
    assert "Electrical & Charging" in category_names


def test_seed_contains_expected_subcategories():
    brakes = next(
        category
        for category in CATEGORIES
        if category["name"] == "Brakes"
    )

    names = set(
        brakes["subcategories"]
    )

    assert "Brake Pads" in names
    assert "Brake Rotors" in names
    assert "Brake Calipers" in names
    assert "ABS Sensors" in names


def test_seed_catalog_creates_foundation():
    category_service = FakeCategoryService()
    brand_service = FakeBrandService()

    result = seed_catalog(
        category_service_instance=category_service,
        brand_service_instance=brand_service,
    )

    assert result["categories_created"] == len(
        CATEGORIES
    )

    assert result["brands_created"] == len(
        BRANDS
    )

    assert result["categories_skipped"] == 0
    assert result["brands_skipped"] == 0


def test_seed_catalog_is_idempotent():
    category_service = FakeCategoryService()
    brand_service = FakeBrandService()

    first = seed_catalog(
        category_service_instance=category_service,
        brand_service_instance=brand_service,
    )

    second = seed_catalog(
        category_service_instance=category_service,
        brand_service_instance=brand_service,
    )

    assert first["categories_created"] == len(
        CATEGORIES
    )

    assert second["categories_created"] == 0
    assert second["brands_created"] == 0

    assert second["categories_skipped"] == len(
        CATEGORIES
    )

    assert second["brands_skipped"] == len(
        BRANDS
    )

    assert len(category_service.names) == len(
        CATEGORIES
    )

    assert len(brand_service.names) == len(
        BRANDS
    )