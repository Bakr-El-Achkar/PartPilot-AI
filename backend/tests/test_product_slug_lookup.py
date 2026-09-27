from datetime import (
    datetime,
    timezone,
)

from fastapi.testclient import (
    TestClient,
)

from app.main import app
import app.routes.products as product_routes


NOW = datetime.now(
    timezone.utc
)


SAMPLE_PRODUCT = {
    "id": "product-1",
    "name": (
        "Bosch Premium Ceramic "
        "Front Brake Pads"
    ),
    "slug": (
        "bosch-premium-ceramic-"
        "front-brake-pads"
    ),
    "sku": "BOSCH-BRK-001",
    "part_number": "PP-00061",
    "brand_id": "brand-1",
    "category_id": "category-1",
    "subcategory_slug":
        "brake-pads",
    "description": (
        "Premium ceramic brake "
        "pad set."
    ),
    "price": 49.99,
    "sale_price": None,
    "stock_quantity": 20,
    "images": [],
    "specifications": {
        "material": "Ceramic",
        "position": "Front",
    },
    "warranty": "12 months",
    "rating_average": 4.8,
    "review_count": 128,
    "is_active": True,
    "created_at": NOW,
    "updated_at": NOW,
}


class FakeProductService:
    def get_product_by_slug(
        self,
        slug: str,
    ):
        if (
            slug
            == SAMPLE_PRODUCT[
                "slug"
            ]
        ):
            return SAMPLE_PRODUCT

        return None


def setup_function():
    product_routes.product_service = (
        FakeProductService()
    )


def teardown_function():
    app.dependency_overrides.clear()


client = TestClient(
    app
)


def test_get_product_by_slug():
    response = client.get(
        "/api/products/slug/"
        "bosch-premium-ceramic-"
        "front-brake-pads"
    )

    assert (
        response.status_code
        == 200
    )

    data = response.json()

    assert (
        data["id"]
        == "product-1"
    )

    assert (
        data["slug"]
        == (
            "bosch-premium-ceramic-"
            "front-brake-pads"
        )
    )

    assert (
        data["sku"]
        == "BOSCH-BRK-001"
    )


def test_missing_slug_returns_404():
    response = client.get(
        "/api/products/slug/"
        "does-not-exist"
    )

    assert (
        response.status_code
        == 404
    )

    assert (
        response.json()
        == {
            "detail":
                "Product not found"
        }
    )