from pydantic import ValidationError
import pytest

from app.schemas.catalog import (
    BrandCreate,
    CategoryCreate,
    ProductCreate,
    ProductUpdate,
    SubcategoryInput,
)


def test_category_accepts_subcategories():
    category = CategoryCreate(
        name="Brakes",
        description="Brake system components",
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

    assert category.name == "Brakes"
    assert len(category.subcategories) == 2
    assert (
        category.subcategories[0].name
        == "Brake Pads"
    )


def test_category_requires_name():
    with pytest.raises(ValidationError):
        CategoryCreate(
            name="",
            subcategories=[],
        )


def test_brand_accepts_valid_data():
    brand = BrandCreate(
        name="Bosch",
        description="Automotive components",
        country="Germany",
        website="https://www.bosch.com",
        logo_url="https://example.com/bosch.png",
    )

    assert brand.name == "Bosch"
    assert brand.country == "Germany"


def test_product_accepts_valid_data():
    product = ProductCreate(
        name="QuietCast Ceramic Brake Pads",
        sku="BOSCH-BC1212",
        part_number="BC1212",
        brand_id="brand-1",
        category_id="category-1",
        subcategory_slug="brake-pads",
        description="Premium ceramic brake pads.",
        price=49.99,
        sale_price=44.99,
        stock_quantity=24,
        images=[
            "https://example.com/pad-1.jpg"
        ],
        specifications={
            "material": "Ceramic",
            "position": "Front",
        },
    )

    assert product.price == 49.99
    assert product.stock_quantity == 24
    assert (
        product.specifications["material"]
        == "Ceramic"
    )


def test_product_rejects_negative_price():
    with pytest.raises(ValidationError):
        ProductCreate(
            name="Brake Pads",
            sku="TEST-001",
            part_number="TEST001",
            brand_id="brand-1",
            category_id="category-1",
            subcategory_slug="brake-pads",
            description="Test",
            price=-10,
            stock_quantity=5,
        )


def test_product_rejects_negative_stock():
    with pytest.raises(ValidationError):
        ProductCreate(
            name="Brake Pads",
            sku="TEST-001",
            part_number="TEST001",
            brand_id="brand-1",
            category_id="category-1",
            subcategory_slug="brake-pads",
            description="Test",
            price=20,
            stock_quantity=-2,
        )


def test_sale_price_cannot_exceed_regular_price():
    with pytest.raises(ValidationError):
        ProductCreate(
            name="Brake Pads",
            sku="TEST-001",
            part_number="TEST001",
            brand_id="brand-1",
            category_id="category-1",
            subcategory_slug="brake-pads",
            description="Test",
            price=40,
            sale_price=50,
            stock_quantity=5,
        )


def test_product_update_accepts_partial_update():
    update = ProductUpdate(
        price=39.99,
        stock_quantity=12,
    )

    assert update.price == 39.99
    assert update.stock_quantity == 12
    assert update.name is None