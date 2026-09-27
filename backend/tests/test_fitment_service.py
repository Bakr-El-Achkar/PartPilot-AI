from datetime import datetime

import pytest

from app.schemas.fitment import FitmentCreate
from app.services.fitment_service import (
    FitmentAlreadyExistsError,
    FitmentReferenceError,
    FitmentService,
    FitmentVehicleNotFoundError,
)


class FakeFitmentRepository:
    def __init__(self):
        self.documents = []

    def create(
        self,
        fitment_data: dict,
    ):
        document = fitment_data.copy()

        document["_id"] = (
            f"fitment-{len(self.documents) + 1}"
        )

        self.documents.append(
            document
        )

        return document.copy()

    def find_by_product_id(
        self,
        product_id: str,
    ):
        return [
            document.copy()
            for document in self.documents
            if (
                document["product_id"]
                == product_id
            )
        ]

    def find_matching(
        self,
        *,
        year,
        make,
        model,
        engine=None,
        transmission=None,
    ):
        make = (
            make.strip().lower()
        )

        model = (
            model.strip().lower()
        )

        engine = (
            engine.strip().lower()
            if engine
            else None
        )

        transmission = (
            transmission.strip().lower()
            if transmission
            else None
        )

        result = []

        for document in self.documents:
            if not document.get(
                "is_active",
                True,
            ):
                continue

            if (
                document[
                    "make_normalized"
                ]
                != make
            ):
                continue

            if (
                document[
                    "model_normalized"
                ]
                != model
            ):
                continue

            if not (
                document["year_start"]
                <= year
                <= document["year_end"]
            ):
                continue

            fitment_engine = (
                document.get(
                    "engine_normalized"
                )
            )

            if (
                fitment_engine
                is not None
                and fitment_engine
                != engine
            ):
                continue

            fitment_transmission = (
                document.get(
                    "transmission_normalized"
                )
            )

            if (
                fitment_transmission
                is not None
                and fitment_transmission
                != transmission
            ):
                continue

            result.append(
                document.copy()
            )

        return result


class FakeProductService:
    def __init__(self):
        self.products = {
            "product-1": {
                "id": "product-1",
                "name": "Bosch Brake Pads",
                "slug": "bosch-brake-pads",
                "sku": "BOSCH-BRK-001",
                "part_number": "BP001",
                "brand_id": "brand-1",
                "category_id": "category-1",
                "subcategory_slug": (
                    "brake-pads"
                ),
                "description": (
                    "Premium brake pads"
                ),
                "price": 49.99,
                "sale_price": 44.99,
                "stock_quantity": 20,
                "images": [],
                "specifications": {},
                "warranty": "12 months",
                "rating_average": 0,
                "review_count": 0,
                "is_active": True,
            },
            "inactive-product": {
                "id": "inactive-product",
                "name": "Inactive Product",
                "slug": "inactive-product",
                "sku": "INACTIVE-001",
                "part_number": "I001",
                "brand_id": "brand-1",
                "category_id": "category-1",
                "subcategory_slug": (
                    "brake-pads"
                ),
                "description": "Inactive",
                "price": 10,
                "sale_price": None,
                "stock_quantity": 0,
                "images": [],
                "specifications": {},
                "warranty": None,
                "rating_average": 0,
                "review_count": 0,
                "is_active": False,
            },
        }

    def get_product(
        self,
        product_id: str,
    ):
        product = self.products.get(
            product_id
        )

        if product is None:
            return None

        return product.copy()


class FakeVehicleRepository:
    def __init__(self):
        self.vehicles = {
            (
                "vehicle-1",
                "user-1",
            ): {
                "_id": "vehicle-1",
                "user_id": "user-1",
                "year": 2004,
                "make": "Honda",
                "model": "CR-V",
                "engine": "2.4L",
                "transmission": (
                    "Automatic"
                ),
                "is_active": True,
            }
        }

    def find_by_id_for_user(
        self,
        vehicle_id: str,
        user_id: str,
    ):
        vehicle = self.vehicles.get(
            (
                vehicle_id,
                user_id,
            )
        )

        if vehicle is None:
            return None

        return vehicle.copy()


def make_service():
    return FitmentService(
        fitment_repository=(
            FakeFitmentRepository()
        ),
        product_service=(
            FakeProductService()
        ),
        vehicle_repository=(
            FakeVehicleRepository()
        ),
    )


def make_fitment():
    return FitmentCreate(
        product_id="product-1",
        make="Honda",
        model="CR-V",
        year_start=2002,
        year_end=2006,
        engine="2.4L",
        transmission="Automatic",
    )


def test_create_fitment_normalizes_vehicle_data():
    service = make_service()

    fitment = service.create_fitment(
        make_fitment()
    )

    assert fitment["id"] == "fitment-1"

    assert fitment["make"] == "Honda"

    assert (
        fitment["make_normalized"]
        == "honda"
    )

    assert (
        fitment["model_normalized"]
        == "cr-v"
    )

    assert (
        fitment["engine_normalized"]
        == "2.4l"
    )

    assert (
        fitment[
            "transmission_normalized"
        ]
        == "automatic"
    )

    assert fitment["is_active"] is True

    assert isinstance(
        fitment["created_at"],
        datetime,
    )

    assert isinstance(
        fitment["updated_at"],
        datetime,
    )


def test_create_fitment_rejects_missing_product():
    service = make_service()

    payload = FitmentCreate(
        product_id="missing-product",
        make="Honda",
        model="CR-V",
        year_start=2002,
        year_end=2006,
    )

    with pytest.raises(
        FitmentReferenceError
    ):
        service.create_fitment(
            payload
        )


def test_create_fitment_rejects_duplicate():
    service = make_service()

    service.create_fitment(
        make_fitment()
    )

    with pytest.raises(
        FitmentAlreadyExistsError
    ):
        service.create_fitment(
            make_fitment()
        )


def test_list_product_fitments():
    service = make_service()

    service.create_fitment(
        make_fitment()
    )

    fitments = (
        service.list_product_fitments(
            "product-1"
        )
    )

    assert len(fitments) == 1

    assert (
        fitments[0]["product_id"]
        == "product-1"
    )


def test_get_compatible_products_for_owned_vehicle():
    service = make_service()

    service.create_fitment(
        make_fitment()
    )

    products = (
        service.get_compatible_products(
            vehicle_id="vehicle-1",
            user_id="user-1",
        )
    )

    assert len(products) == 1

    assert (
        products[0]["id"]
        == "product-1"
    )

    assert (
        products[0]["sku"]
        == "BOSCH-BRK-001"
    )


def test_compatible_products_deduplicates_product():
    service = make_service()

    first = make_fitment()

    second = FitmentCreate(
        product_id="product-1",
        make="Honda",
        model="CR-V",
        year_start=2003,
        year_end=2005,
        engine=None,
        transmission=None,
    )

    service.create_fitment(
        first
    )

    service.create_fitment(
        second
    )

    products = (
        service.get_compatible_products(
            vehicle_id="vehicle-1",
            user_id="user-1",
        )
    )

    assert len(products) == 1


def test_compatible_products_rejects_unowned_vehicle():
    service = make_service()

    with pytest.raises(
        FitmentVehicleNotFoundError
    ):
        service.get_compatible_products(
            vehicle_id="vehicle-1",
            user_id="other-user",
        )


def test_compatible_products_skips_inactive_products():
    service = make_service()

    payload = FitmentCreate(
        product_id="inactive-product",
        make="Honda",
        model="CR-V",
        year_start=2002,
        year_end=2006,
    )

    # We add this directly because create_fitment
    # should reject inactive products.
    service.fitment_repository.create(
        {
            "product_id": (
                payload.product_id
            ),
            "make": payload.make,
            "model": payload.model,
            "make_normalized": "honda",
            "model_normalized": "cr-v",
            "year_start": 2002,
            "year_end": 2006,
            "engine": None,
            "engine_normalized": None,
            "transmission": None,
            "transmission_normalized": None,
            "is_active": True,
        }
    )

    products = (
        service.get_compatible_products(
            vehicle_id="vehicle-1",
            user_id="user-1",
        )
    )

    assert products == []