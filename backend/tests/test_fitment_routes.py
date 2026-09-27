from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.dependencies.auth import get_current_user
from app.main import app
import app.routes.fitments as fitment_routes


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
        "_id": "user-1",
        "email": "user@partpilot.com",
        "role": "customer",
        "is_active": True,
    }


def sample_fitment():
    return {
        "id": "fitment-1",
        "product_id": "product-1",
        "make": "Honda",
        "model": "CR-V",
        "make_normalized": "honda",
        "model_normalized": "cr-v",
        "year_start": 2002,
        "year_end": 2006,
        "engine": "2.4L",
        "engine_normalized": "2.4l",
        "transmission": "Automatic",
        "transmission_normalized": "automatic",
        "is_active": True,
        "created_at": NOW,
        "updated_at": NOW,
    }


def sample_product():
    return {
        "id": "product-1",
        "name": "Bosch Brake Pads",
        "slug": "bosch-brake-pads",
        "sku": "BOSCH-BRK-001",
        "part_number": "BP001",
        "brand_id": "brand-1",
        "category_id": "category-1",
        "subcategory_slug": "brake-pads",
        "description": "Premium brake pads.",
        "price": 49.99,
        "sale_price": 44.99,
        "stock_quantity": 20,
        "images": [],
        "specifications": {
            "material": "Ceramic"
        },
        "warranty": "12 months",
        "rating_average": 0,
        "review_count": 0,
        "is_active": True,
        "created_at": NOW,
        "updated_at": NOW,
    }


class FakeFitmentService:
    def create_fitment(
        self,
        fitment,
    ):
        if (
            fitment.product_id
            == "missing-product"
        ):
            raise (
                fitment_routes
                .FitmentReferenceError(
                    "Product not found"
                )
            )

        if (
            fitment.product_id
            == "duplicate-product"
        ):
            raise (
                fitment_routes
                .FitmentAlreadyExistsError(
                    "Fitment already exists"
                )
            )

        result = sample_fitment()

        result.update(
            {
                "product_id": (
                    fitment.product_id
                ),
                "make": fitment.make,
                "model": fitment.model,
                "year_start": (
                    fitment.year_start
                ),
                "year_end": (
                    fitment.year_end
                ),
                "engine": fitment.engine,
                "transmission": (
                    fitment.transmission
                ),
            }
        )

        return result

    def list_product_fitments(
        self,
        product_id,
    ):
        if product_id == "missing":
            return []

        return [
            sample_fitment()
        ]

    def get_compatible_products(
        self,
        *,
        vehicle_id,
        user_id,
    ):
        if vehicle_id == "missing":
            raise (
                fitment_routes
                .FitmentVehicleNotFoundError(
                    "Vehicle not found"
                )
            )

        if (
            vehicle_id == "vehicle-1"
            and user_id != "user-1"
        ):
            raise (
                fitment_routes
                .FitmentVehicleNotFoundError(
                    "Vehicle not found"
                )
            )

        return [
            sample_product()
        ]


def setup_function():
    fitment_routes.fitment_service = (
        FakeFitmentService()
    )

    app.dependency_overrides.clear()


def teardown_function():
    app.dependency_overrides.clear()


def test_product_fitments_are_public():
    response = client.get(
        "/api/fitments/product/product-1"
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1

    assert (
        data[0]["product_id"]
        == "product-1"
    )


def test_customer_can_get_compatible_products():
    app.dependency_overrides[
        get_current_user
    ] = customer_user

    response = client.get(
        "/api/fitments/compatible/vehicle-1"
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1

    assert (
        data[0]["sku"]
        == "BOSCH-BRK-001"
    )


def test_compatible_products_require_authentication():
    app.dependency_overrides.clear()

    response = client.get(
        "/api/fitments/compatible/vehicle-1"
    )

    assert response.status_code in {
        401,
        403,
    }


def test_missing_or_unowned_vehicle_returns_404():
    app.dependency_overrides[
        get_current_user
    ] = customer_user

    response = client.get(
        "/api/fitments/compatible/missing"
    )

    assert response.status_code == 404


def test_admin_can_create_fitment():
    app.dependency_overrides[
        get_current_user
    ] = admin_user

    response = client.post(
        "/api/fitments",
        json={
            "product_id": "product-1",
            "make": "Honda",
            "model": "CR-V",
            "year_start": 2002,
            "year_end": 2006,
            "engine": "2.4L",
            "transmission": "Automatic",
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert (
        data["product_id"]
        == "product-1"
    )

    assert (
        data["make_normalized"]
        == "honda"
    )


def test_customer_cannot_create_fitment():
    app.dependency_overrides[
        get_current_user
    ] = customer_user

    response = client.post(
        "/api/fitments",
        json={
            "product_id": "product-1",
            "make": "Honda",
            "model": "CR-V",
            "year_start": 2002,
            "year_end": 2006,
        },
    )

    assert response.status_code == 403


def test_duplicate_fitment_returns_409():
    app.dependency_overrides[
        get_current_user
    ] = admin_user

    response = client.post(
        "/api/fitments",
        json={
            "product_id": "duplicate-product",
            "make": "Honda",
            "model": "CR-V",
            "year_start": 2002,
            "year_end": 2006,
        },
    )

    assert response.status_code == 409


def test_missing_product_returns_400():
    app.dependency_overrides[
        get_current_user
    ] = admin_user

    response = client.post(
        "/api/fitments",
        json={
            "product_id": "missing-product",
            "make": "Honda",
            "model": "CR-V",
            "year_start": 2002,
            "year_end": 2006,
        },
    )

    assert response.status_code == 400