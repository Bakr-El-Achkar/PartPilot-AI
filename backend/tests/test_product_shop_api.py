from datetime import (
    datetime,
    timezone,
)

from fastapi.testclient import TestClient

from app.main import app
import app.routes.products as product_routes

from app.services.product_service import (
    ProductService,
)


client = TestClient(app)

NOW = datetime.now(
    timezone.utc
)


# ============================================================
# SERVICE TEST HELPERS
# ============================================================


class RecordingProductRepository:
    def __init__(self):
        self.last_list_kwargs = None

    def list_active(
        self,
        **kwargs,
    ):
        self.last_list_kwargs = kwargs

        return []


class UnusedCategoryRepository:
    pass


class UnusedBrandRepository:
    pass


# ============================================================
# ROUTE TEST HELPERS
# ============================================================


def sample_product():
    return {
        "id": "product-1",
        "name": (
            "Bosch QuietCast Brake Pads"
        ),
        "slug": (
            "bosch-quietcast-brake-pads"
        ),
        "sku": "BOSCH-BC1212",
        "part_number": "BC1212",
        "brand_id": "brand-1",
        "category_id": "category-1",
        "subcategory_slug": (
            "brake-pads"
        ),
        "description": (
            "Premium ceramic brake pads."
        ),
        "price": 49.99,
        "sale_price": 44.99,
        "stock_quantity": 24,
        "images": [],
        "specifications": {
            "material": "Ceramic",
        },
        "warranty": "12 months",
        "rating_average": 4.7,
        "review_count": 18,
        "is_active": True,
        "created_at": NOW,
        "updated_at": NOW,
    }


class RecordingProductService:
    def __init__(self):
        self.last_list_kwargs = None

    def list_products(
        self,
        **kwargs,
    ):
        self.last_list_kwargs = kwargs

        return [
            sample_product()
        ]


# ============================================================
# PRODUCT SERVICE — SHOP QUERY CONTRACT
# ============================================================


def test_product_service_forwards_shop_query_options():
    repository = (
        RecordingProductRepository()
    )

    service = ProductService(
        product_repository=repository,
        category_repository=(
            UnusedCategoryRepository()
        ),
        brand_repository=(
            UnusedBrandRepository()
        ),
    )

    result = service.list_products(
        category_id="category-1",
        brand_id="brand-1",
        subcategory_slug="brake-pads",
        search="ceramic",
        min_price=20,
        max_price=80,
        in_stock=True,
        sort="price_asc",
    )

    assert result == []

    assert (
        repository.last_list_kwargs
        == {
            "category_id": (
                "category-1"
            ),
            "brand_id": (
                "brand-1"
            ),
            "subcategory_slug": (
                "brake-pads"
            ),
            "search": "ceramic",
            "min_price": 20,
            "max_price": 80,
            "in_stock": True,
            "sort": "price_asc",
        }
    )


# ============================================================
# GET /api/products — QUERY FORWARDING
# ============================================================


def test_product_route_forwards_shop_query_parameters(
    monkeypatch,
):
    fake_service = (
        RecordingProductService()
    )

    monkeypatch.setattr(
        product_routes,
        "product_service",
        fake_service,
    )

    response = client.get(
        "/api/products",
        params={
            "category_id": (
                "category-1"
            ),
            "brand_id": "brand-1",
            "subcategory_slug": (
                "brake-pads"
            ),
            "search": "ceramic",
            "min_price": 20,
            "max_price": 80,
            "in_stock": "true",
            "sort": "price_asc",
        },
    )

    assert response.status_code == 200

    assert (
        fake_service.last_list_kwargs
        == {
            "category_id": (
                "category-1"
            ),
            "brand_id": (
                "brand-1"
            ),
            "subcategory_slug": (
                "brake-pads"
            ),
            "search": "ceramic",
            "min_price": 20.0,
            "max_price": 80.0,
            "in_stock": True,
            "sort": "price_asc",
        }
    )


# ============================================================
# SORT VALIDATION
# ============================================================


def test_product_route_rejects_invalid_sort():
    response = client.get(
        "/api/products",
        params={
            "sort": "random",
        },
    )

    assert response.status_code == 422


# ============================================================
# PRICE VALIDATION
# ============================================================


def test_product_route_rejects_negative_min_price():
    response = client.get(
        "/api/products",
        params={
            "min_price": -1,
        },
    )

    assert response.status_code == 422


def test_product_route_rejects_negative_max_price():
    response = client.get(
        "/api/products",
        params={
            "max_price": -1,
        },
    )

    assert response.status_code == 422


def test_product_route_rejects_min_price_above_max_price():
    response = client.get(
        "/api/products",
        params={
            "min_price": 100,
            "max_price": 20,
        },
    )

    assert response.status_code == 422


# ============================================================
# PUBLIC ACCESS MUST REMAIN AVAILABLE
# ============================================================


def test_shop_product_query_remains_public(
    monkeypatch,
):
    fake_service = (
        RecordingProductService()
    )

    monkeypatch.setattr(
        product_routes,
        "product_service",
        fake_service,
    )

    response = client.get(
        "/api/products",
        params={
            "search": "brake",
            "sort": "rating",
        },
    )

    assert response.status_code == 200

    assert (
        response.json()[0]["sku"]
        == "BOSCH-BC1212"
    )