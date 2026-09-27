from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.dependencies.auth import get_current_user
from app.main import app
import app.routes.products as product_routes


client = TestClient(app)

NOW = datetime.now(timezone.utc)


def admin_user():
    return {
        "_id": "admin-1",
        "email": "admin@partpilot.com",
        "role": "admin",
        "is_active": True,
    }


def customer_user():
    return {
        "_id": "customer-1",
        "email": "customer@partpilot.com",
        "role": "customer",
        "is_active": True,
    }


def sample_product():
    return {
        "id": "product-1",
        "name": "Bosch QuietCast Brake Pads",
        "slug": "bosch-quietcast-brake-pads",
        "sku": "BOSCH-BC1212",
        "part_number": "BC1212",
        "brand_id": "brand-1",
        "category_id": "category-1",
        "subcategory_slug": "brake-pads",
        "description": "Premium ceramic brake pads.",
        "price": 49.99,
        "sale_price": 44.99,
        "stock_quantity": 24,
        "images": [
            "https://example.com/brakes.jpg"
        ],
        "specifications": {
            "material": "Ceramic",
            "position": "Front",
        },
        "warranty": "12 months",
        "rating_average": 0,
        "review_count": 0,
        "is_active": True,
        "created_at": NOW,
        "updated_at": NOW,
    }


class FakeProductService:
    def __init__(self):
        self.product = sample_product()

    def list_products(
        self,
        *,
        category_id=None,
        brand_id=None,
        subcategory_slug=None,
    ):
        return [self.product]

    def get_product(
        self,
        product_id,
    ):
        if product_id == "missing":
            return None

        return self.product

    def create_product(
        self,
        product,
    ):
        if product.sku == "DUPLICATE":
            raise (
                product_routes
                .ProductAlreadyExistsError(
                    "Product SKU already exists"
                )
            )

        if product.brand_id == "missing-brand":
            raise (
                product_routes
                .ProductReferenceError(
                    "Brand not found"
                )
            )

        result = self.product.copy()

        result.update(
            {
                "name": product.name,
                "sku": product.sku,
                "part_number": (
                    product.part_number
                ),
                "brand_id": product.brand_id,
                "category_id": (
                    product.category_id
                ),
                "subcategory_slug": (
                    product.subcategory_slug
                ),
                "description": (
                    product.description
                ),
                "price": product.price,
                "sale_price": (
                    product.sale_price
                ),
                "stock_quantity": (
                    product.stock_quantity
                ),
            }
        )

        return result

    def update_product(
        self,
        product_id,
        update,
    ):
        if product_id == "missing":
            return None

        updates = update.model_dump(
            exclude_unset=True
        )

        if (
            updates.get("sale_price")
            is not None
            and updates.get("price")
            is not None
            and updates["sale_price"]
            > updates["price"]
        ):
            raise (
                product_routes
                .ProductValidationError(
                    "Sale price cannot be greater "
                    "than regular price"
                )
            )

        result = self.product.copy()
        result.update(updates)

        return result


def setup_function():
    product_routes.product_service = (
        FakeProductService()
    )

    app.dependency_overrides.clear()


def teardown_function():
    app.dependency_overrides.clear()


def test_list_products_is_public():
    response = client.get(
        "/api/products"
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1

    assert (
        data[0]["sku"]
        == "BOSCH-BC1212"
    )


def test_get_product_is_public():
    response = client.get(
        "/api/products/product-1"
    )

    assert response.status_code == 200

    assert (
        response.json()["name"]
        == "Bosch QuietCast Brake Pads"
    )


def test_missing_product_returns_404():
    response = client.get(
        "/api/products/missing"
    )

    assert response.status_code == 404


def test_admin_can_create_product():
    app.dependency_overrides[
        get_current_user
    ] = admin_user

    response = client.post(
        "/api/products",
        json={
            "name": "Bosch Brake Pads",
            "sku": "BOSCH-NEW-001",
            "part_number": "NEW001",
            "brand_id": "brand-1",
            "category_id": "category-1",
            "subcategory_slug": "brake-pads",
            "description": "Premium brake pads.",
            "price": 55.99,
            "sale_price": 49.99,
            "stock_quantity": 15,
            "images": [],
            "specifications": {
                "material": "Ceramic"
            },
            "warranty": "12 months",
        },
    )

    assert response.status_code == 201

    assert (
        response.json()["sku"]
        == "BOSCH-NEW-001"
    )


def test_customer_cannot_create_product():
    app.dependency_overrides[
        get_current_user
    ] = customer_user

    response = client.post(
        "/api/products",
        json={
            "name": "Bosch Brake Pads",
            "sku": "BOSCH-NEW-001",
            "part_number": "NEW001",
            "brand_id": "brand-1",
            "category_id": "category-1",
            "subcategory_slug": "brake-pads",
            "description": "Brake pads.",
            "price": 55.99,
            "stock_quantity": 15,
        },
    )

    assert response.status_code == 403


def test_duplicate_product_returns_409():
    app.dependency_overrides[
        get_current_user
    ] = admin_user

    response = client.post(
        "/api/products",
        json={
            "name": "Duplicate Product",
            "sku": "DUPLICATE",
            "part_number": "DUP-001",
            "brand_id": "brand-1",
            "category_id": "category-1",
            "subcategory_slug": "brake-pads",
            "description": "Duplicate.",
            "price": 20,
            "stock_quantity": 5,
        },
    )

    assert response.status_code == 409


def test_invalid_reference_returns_400():
    app.dependency_overrides[
        get_current_user
    ] = admin_user

    response = client.post(
        "/api/products",
        json={
            "name": "Invalid Product",
            "sku": "INVALID-001",
            "part_number": "INVALID",
            "brand_id": "missing-brand",
            "category_id": "category-1",
            "subcategory_slug": "brake-pads",
            "description": "Invalid reference.",
            "price": 20,
            "stock_quantity": 5,
        },
    )

    assert response.status_code == 400


def test_admin_can_update_product():
    app.dependency_overrides[
        get_current_user
    ] = admin_user

    response = client.patch(
        "/api/products/product-1",
        json={
            "price": 46.99,
            "stock_quantity": 12,
        },
    )

    assert response.status_code == 200

    assert (
        response.json()["price"]
        == 46.99
    )

    assert (
        response.json()[
            "stock_quantity"
        ]
        == 12
    )


def test_customer_cannot_update_product():
    app.dependency_overrides[
        get_current_user
    ] = customer_user

    response = client.patch(
        "/api/products/product-1",
        json={
            "stock_quantity": 10,
        },
    )

    assert response.status_code == 403


def test_update_missing_product_returns_404():
    app.dependency_overrides[
        get_current_user
    ] = admin_user

    response = client.patch(
        "/api/products/missing",
        json={
            "stock_quantity": 10,
        },
    )

    assert response.status_code == 404