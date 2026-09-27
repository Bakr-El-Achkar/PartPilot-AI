from app.services.product_service import (
    ProductAlreadyExistsError,
)
from scripts.seed_products import (
    PRODUCTS,
    TOTAL_PRODUCT_COUNT,
    seed_products,
)


class FakeCategoryRepository:
    def __init__(self):
        self.categories = {
            "brakes": {
                "_id": "category-brakes",
                "name": "Brakes",
                "slug": "brakes",
                "subcategories": [
                    {
                        "name": "Brake Pads",
                        "slug": "brake-pads",
                    },
                    {
                        "name": "Brake Rotors",
                        "slug": "brake-rotors",
                    },
                    {
                        "name": "Brake Calipers",
                        "slug": "brake-calipers",
                    },
                ],
                "is_active": True,
            },
            "engine": {
                "_id": "category-engine",
                "name": "Engine",
                "slug": "engine",
                "subcategories": [
                    {
                        "name": "Spark Plugs",
                        "slug": "spark-plugs",
                    },
                    {
                        "name": "Oil Filters",
                        "slug": "oil-filters",
                    },
                    {
                        "name": "Ignition Coils",
                        "slug": "ignition-coils",
                    },
                ],
                "is_active": True,
            },
        }

    def find_by_slug(
        self,
        slug: str,
    ):
        return self.categories.get(
            slug
        )


class FakeBrandRepository:
    def __init__(self):
        self.brands = {
            "bosch": {
                "_id": "brand-bosch",
                "name": "Bosch",
                "slug": "bosch",
                "is_active": True,
            },
            "ngk": {
                "_id": "brand-ngk",
                "name": "NGK",
                "slug": "ngk",
                "is_active": True,
            },
        }

    def find_by_slug(
        self,
        slug: str,
    ):
        return self.brands.get(
            slug
        )


class FakeProductService:
    def __init__(self):
        self.products = {}

    def create_product(
        self,
        product,
    ):
        if product.sku in self.products:
            raise ProductAlreadyExistsError(
                "Product SKU already exists"
            )

        self.products[
            product.sku
        ] = product

        return {
            "sku": product.sku,
            "name": product.name,
        }


def test_product_seed_contains_exactly_500_products():
    assert TOTAL_PRODUCT_COUNT == 500
    assert len(PRODUCTS) == 500


def test_product_seed_has_unique_skus():
    skus = [
        product["sku"]
        for product in PRODUCTS
    ]

    assert len(skus) == len(
        set(skus)
    )


def test_product_seed_has_unique_part_numbers():
    part_numbers = [
        product["part_number"]
        for product in PRODUCTS
    ]

    assert len(part_numbers) == len(
        set(part_numbers)
    )


def test_every_seed_product_has_required_fields():
    required_fields = {
        "name",
        "sku",
        "part_number",
        "brand_slug",
        "category_slug",
        "subcategory_slug",
        "description",
        "price",
        "stock_quantity",
        "images",
        "specifications",
    }

    for product in PRODUCTS:
        assert (
            required_fields
            .issubset(
                product.keys()
            )
        )


def test_product_seed_covers_all_catalog_areas():
    category_slugs = {
        product["category_slug"]
        for product in PRODUCTS
    }

    expected_categories = {
        "engine",
        "brakes",
        "suspension",
        "steering",
        "transmission-drivetrain",
        "cooling-heating",
        "electrical-charging",
        "fuel-air-intake",
        "exhaust-emissions",
        "hvac-climate-control",
        "lighting",
        "body-exterior",
        "interior-controls",
        "wheels-tires",
        "fluids-maintenance",
        "sensors-engine-management",
    }

    assert expected_categories.issubset(
        category_slugs
    )


def test_old_seed_skus_are_preserved():
    skus = {
        product["sku"]
        for product in PRODUCTS
    }

    expected = {
        "BOSCH-BRK-001",
        "NGK-ENG-001",
        "MONROE-SUS-001",
        "MOOG-STR-001",
        "DENSO-CLG-001",
        "BOSCH-ELC-001",
        "DELPHI-FUL-001",
        "BOSCH-EXH-001",
        "DENSO-HVAC-001",
        "PHILIPS-LGT-001",
        "BOSCH-BDY-001",
        "CONTINENTAL-WHL-001",
        "MOBIL1-MNT-001",
        "BOSCH-SEN-001",
    }

    assert expected.issubset(
        skus
    )


def test_seed_products_creates_products():
    products = [
        {
            "name": (
                "Bosch Ceramic Brake Pads"
            ),
            "sku": "BOSCH-PAD-TEST",
            "part_number": "BP-TEST",
            "brand_slug": "bosch",
            "category_slug": "brakes",
            "subcategory_slug": (
                "brake-pads"
            ),
            "description": (
                "Ceramic brake pads."
            ),
            "price": 49.99,
            "stock_quantity": 20,
            "images": [],
            "specifications": {
                "material": "Ceramic"
            },
            "warranty": "12 months",
        },
        {
            "name": (
                "NGK Iridium Spark Plug"
            ),
            "sku": "NGK-SPARK-TEST",
            "part_number": "SP-TEST",
            "brand_slug": "ngk",
            "category_slug": "engine",
            "subcategory_slug": (
                "spark-plugs"
            ),
            "description": (
                "Iridium spark plug."
            ),
            "price": 12.99,
            "stock_quantity": 50,
            "images": [],
            "specifications": {
                "type": "Iridium"
            },
            "warranty": None,
        },
    ]

    product_service = (
        FakeProductService()
    )

    result = seed_products(
        products=products,
        product_service_instance=(
            product_service
        ),
        category_repository_instance=(
            FakeCategoryRepository()
        ),
        brand_repository_instance=(
            FakeBrandRepository()
        ),
    )

    assert (
        result["products_created"]
        == 2
    )

    assert (
        result["products_skipped"]
        == 0
    )

    assert (
        result["products_failed"]
        == 0
    )


def test_seed_products_is_idempotent():
    products = [
        {
            "name": (
                "Bosch Ceramic Brake Pads"
            ),
            "sku": "BOSCH-PAD-TEST",
            "part_number": "BP-TEST",
            "brand_slug": "bosch",
            "category_slug": "brakes",
            "subcategory_slug": (
                "brake-pads"
            ),
            "description": (
                "Ceramic brake pads."
            ),
            "price": 49.99,
            "stock_quantity": 20,
            "images": [],
            "specifications": {},
            "warranty": None,
        }
    ]

    product_service = (
        FakeProductService()
    )

    first = seed_products(
        products=products,
        product_service_instance=(
            product_service
        ),
        category_repository_instance=(
            FakeCategoryRepository()
        ),
        brand_repository_instance=(
            FakeBrandRepository()
        ),
    )

    second = seed_products(
        products=products,
        product_service_instance=(
            product_service
        ),
        category_repository_instance=(
            FakeCategoryRepository()
        ),
        brand_repository_instance=(
            FakeBrandRepository()
        ),
    )

    assert (
        first["products_created"]
        == 1
    )

    assert (
        second["products_created"]
        == 0
    )

    assert (
        second["products_skipped"]
        == 1
    )


def test_seed_product_fails_when_category_missing():
    products = [
        {
            "name": "Unknown Product",
            "sku": "UNKNOWN-TEST",
            "part_number": "UNK-TEST",
            "brand_slug": "bosch",
            "category_slug": (
                "does-not-exist"
            ),
            "subcategory_slug": (
                "unknown"
            ),
            "description": (
                "Test product."
            ),
            "price": 10,
            "stock_quantity": 1,
            "images": [],
            "specifications": {},
            "warranty": None,
        }
    ]

    result = seed_products(
        products=products,
        product_service_instance=(
            FakeProductService()
        ),
        category_repository_instance=(
            FakeCategoryRepository()
        ),
        brand_repository_instance=(
            FakeBrandRepository()
        ),
    )

    assert (
        result["products_created"]
        == 0
    )

    assert (
        result["products_failed"]
        == 1
    )