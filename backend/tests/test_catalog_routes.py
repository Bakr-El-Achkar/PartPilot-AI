from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.dependencies.auth import get_current_user
from app.main import app
import app.routes.catalog as catalog_routes

client = TestClient(app)

NOW = datetime.now(timezone.utc)


def admin_user():
    return {
        "_id": "admin-1",
        "first_name": "Admin",
        "last_name": "User",
        "email": "admin@partpilot.com",
        "role": "admin",
        "is_active": True,
    }


def customer_user():
    return {
        "_id": "customer-1",
        "first_name": "Customer",
        "last_name": "User",
        "email": "customer@partpilot.com",
        "role": "customer",
        "is_active": True,
    }


class FakeCategoryService:
    def __init__(self):
        self.categories = [
            {
                "id": "category-1",
                "name": "Brakes",
                "slug": "brakes",
                "description": "Brake components",
                "icon": "disc-3",
                "subcategories": [
                    {
                        "name": "Brake Pads",
                        "slug": "brake-pads",
                    }
                ],
                "is_active": True,
                "created_at": NOW,
                "updated_at": NOW,
            }
        ]

    def list_categories(self):
        return self.categories

    def create_category(self, category):
        if category.name == "Duplicate":
            raise catalog_routes.CatalogAlreadyExistsError(
                "Category already exists"
            )

        return {
            "id": "category-2",
            "name": category.name,
            "slug": "engine",
            "description": category.description,
            "icon": category.icon,
            "subcategories": [
                {
                    "name": item.name,
                    "slug": "oil-filters",
                }
                for item in category.subcategories
            ],
            "is_active": True,
            "created_at": NOW,
            "updated_at": NOW,
        }


class FakeBrandService:
    def __init__(self):
        self.brands = [
            {
                "id": "brand-1",
                "name": "Bosch",
                "slug": "bosch",
                "description": "Automotive components",
                "country": "Germany",
                "website": None,
                "logo_url": None,
                "is_active": True,
                "created_at": NOW,
                "updated_at": NOW,
            }
        ]

    def list_brands(self):
        return self.brands

    def create_brand(self, brand):
        if brand.name == "Duplicate":
            raise catalog_routes.CatalogAlreadyExistsError(
                "Brand already exists"
            )

        return {
            "id": "brand-2",
            "name": brand.name,
            "slug": "brembo",
            "description": brand.description,
            "country": brand.country,
            "website": (
                str(brand.website)
                if brand.website
                else None
            ),
            "logo_url": (
                str(brand.logo_url)
                if brand.logo_url
                else None
            ),
            "is_active": True,
            "created_at": NOW,
            "updated_at": NOW,
        }


def setup_function():
    catalog_routes.category_service = (
        FakeCategoryService()
    )

    catalog_routes.brand_service = (
        FakeBrandService()
    )

    app.dependency_overrides.clear()


def teardown_function():
    app.dependency_overrides.clear()


def test_list_categories_is_public():
    response = client.get(
        "/api/catalog/categories"
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["name"] == "Brakes"


def test_list_brands_is_public():
    response = client.get(
        "/api/catalog/brands"
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["name"] == "Bosch"


def test_admin_can_create_category():
    app.dependency_overrides[
        get_current_user
    ] = admin_user

    response = client.post(
        "/api/catalog/categories",
        json={
            "name": "Engine",
            "description": "Engine components",
            "icon": "settings",
            "subcategories": [
                {
                    "name": "Oil Filters"
                }
            ],
        },
    )

    assert response.status_code == 201
    assert response.json()["name"] == "Engine"


def test_customer_cannot_create_category():
    app.dependency_overrides[
        get_current_user
    ] = customer_user

    response = client.post(
        "/api/catalog/categories",
        json={
            "name": "Engine",
            "subcategories": [],
        },
    )

    assert response.status_code == 403


def test_duplicate_category_returns_conflict():
    app.dependency_overrides[
        get_current_user
    ] = admin_user

    response = client.post(
        "/api/catalog/categories",
        json={
            "name": "Duplicate",
            "subcategories": [],
        },
    )

    assert response.status_code == 409


def test_admin_can_create_brand():
    app.dependency_overrides[
        get_current_user
    ] = admin_user

    response = client.post(
        "/api/catalog/brands",
        json={
            "name": "Brembo",
            "country": "Italy",
        },
    )

    assert response.status_code == 201
    assert response.json()["name"] == "Brembo"


def test_customer_cannot_create_brand():
    app.dependency_overrides[
        get_current_user
    ] = customer_user

    response = client.post(
        "/api/catalog/brands",
        json={
            "name": "Brembo",
        },
    )

    assert response.status_code == 403