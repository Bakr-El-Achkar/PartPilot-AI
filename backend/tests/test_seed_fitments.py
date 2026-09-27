from app.services.fitment_service import (
    FitmentAlreadyExistsError,
)
from scripts.seed_fitments import (
    FITMENTS,
    TOTAL_FITMENT_COUNT,
    seed_fitments,
)


class FakeProductRepository:
    def __init__(self):
        self.products = {
            "BOSCH-BRK-001": {
                "_id": "product-1",
                "sku": "BOSCH-BRK-001",
                "is_active": True,
            },
            "NGK-ENG-001": {
                "_id": "product-2",
                "sku": "NGK-ENG-001",
                "is_active": True,
            },
        }

    def find_by_sku(
        self,
        sku: str,
    ):
        return self.products.get(
            sku
        )


class FakeFitmentService:
    def __init__(self):
        self.created = []

    def create_fitment(
        self,
        fitment,
    ):
        key = (
            fitment.product_id,
            fitment.make.strip().lower(),
            fitment.model.strip().lower(),
            fitment.year_start,
            fitment.year_end,
            (
                fitment.engine.strip().lower()
                if fitment.engine
                else None
            ),
            (
                fitment.transmission
                .strip()
                .lower()
                if fitment.transmission
                else None
            ),
        )

        for item in self.created:
            if item["key"] == key:
                raise (
                    FitmentAlreadyExistsError(
                        "Fitment already exists"
                    )
                )

        self.created.append(
            {
                "key": key,
                "product_id": (
                    fitment.product_id
                ),
            }
        )

        return {
            "id": (
                f"fitment-"
                f"{len(self.created)}"
            ),
            "product_id": (
                fitment.product_id
            ),
        }


def test_fitment_seed_contains_exactly_500_records():
    assert TOTAL_FITMENT_COUNT == 500

    assert len(FITMENTS) == 500


def test_fitment_seed_has_unique_records():
    keys = [
        (
            item["product_sku"],
            item["make"],
            item["model"],
            item["year_start"],
            item["year_end"],
            item.get("engine"),
            item.get(
                "transmission"
            ),
        )
        for item in FITMENTS
    ]

    assert len(keys) == len(
        set(keys)
    )


def test_fitment_seed_covers_many_vehicle_makes():
    makes = {
        item["make"]
        for item in FITMENTS
    }

    expected_makes = {
        "Honda",
        "Toyota",
        "Nissan",
        "Hyundai",
        "Kia",
        "Ford",
        "Chevrolet",
        "Volkswagen",
        "BMW",
        "Mercedes-Benz",
    }

    assert expected_makes.issubset(
        makes
    )


def test_fitment_seed_contains_honda_crv_2004():
    matches = [
        item
        for item in FITMENTS
        if (
            item["make"]
            == "Honda"
            and item["model"]
            == "CR-V"
            and item["year_start"]
            <= 2004
            <= item["year_end"]
        )
    ]

    assert len(matches) > 0


def test_some_fitments_allow_any_engine():
    assert any(
        item.get("engine") is None
        for item in FITMENTS
    )


def test_some_fitments_allow_any_transmission():
    assert any(
        item.get(
            "transmission"
        )
        is None
        for item in FITMENTS
    )


def test_every_fitment_has_required_fields():
    required_fields = {
        "product_sku",
        "make",
        "model",
        "year_start",
        "year_end",
    }

    for item in FITMENTS:
        assert (
            required_fields
            .issubset(
                item.keys()
            )
        )

        assert (
            item["year_start"]
            <= item["year_end"]
        )


def test_seed_fitments_creates_fitments():
    fitments = [
        {
            "product_sku": (
                "BOSCH-BRK-001"
            ),
            "make": "Honda",
            "model": "CR-V",
            "year_start": 2002,
            "year_end": 2006,
            "engine": None,
            "transmission": None,
        },
        {
            "product_sku": (
                "NGK-ENG-001"
            ),
            "make": "Toyota",
            "model": "Corolla",
            "year_start": 2003,
            "year_end": 2008,
            "engine": None,
            "transmission": None,
        },
    ]

    service = (
        FakeFitmentService()
    )

    result = seed_fitments(
        fitments=fitments,
        fitment_service_instance=(
            service
        ),
        product_repository_instance=(
            FakeProductRepository()
        ),
    )

    assert (
        result[
            "fitments_created"
        ]
        == 2
    )

    assert (
        result[
            "fitments_skipped"
        ]
        == 0
    )

    assert (
        result[
            "fitments_failed"
        ]
        == 0
    )


def test_seed_fitments_is_idempotent():
    fitments = [
        {
            "product_sku": (
                "BOSCH-BRK-001"
            ),
            "make": "Honda",
            "model": "CR-V",
            "year_start": 2002,
            "year_end": 2006,
            "engine": None,
            "transmission": None,
        }
    ]

    service = (
        FakeFitmentService()
    )

    product_repository = (
        FakeProductRepository()
    )

    first = seed_fitments(
        fitments=fitments,
        fitment_service_instance=(
            service
        ),
        product_repository_instance=(
            product_repository
        ),
    )

    second = seed_fitments(
        fitments=fitments,
        fitment_service_instance=(
            service
        ),
        product_repository_instance=(
            product_repository
        ),
    )

    assert (
        first[
            "fitments_created"
        ]
        == 1
    )

    assert (
        second[
            "fitments_created"
        ]
        == 0
    )

    assert (
        second[
            "fitments_skipped"
        ]
        == 1
    )


def test_missing_product_counts_as_failure():
    fitments = [
        {
            "product_sku": (
                "DOES-NOT-EXIST"
            ),
            "make": "Honda",
            "model": "CR-V",
            "year_start": 2002,
            "year_end": 2006,
            "engine": None,
            "transmission": None,
        }
    ]

    result = seed_fitments(
        fitments=fitments,
        fitment_service_instance=(
            FakeFitmentService()
        ),
        product_repository_instance=(
            FakeProductRepository()
        ),
    )

    assert (
        result[
            "fitments_created"
        ]
        == 0
    )

    assert (
        result[
            "fitments_failed"
        ]
        == 1
    )