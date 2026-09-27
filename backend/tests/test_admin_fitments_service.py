from datetime import (
    datetime,
    timezone,
)

import pytest

from app.schemas.admin import (
    AdminFitmentUpdate,
)

from app.services.admin_service import (
    AdminFitmentAlreadyExistsError,
    AdminFitmentService,
    AdminFitmentValidationError,
)


NOW = datetime.now(
    timezone.utc
)


class FakeRepository:
    def __init__(
        self,
    ):
        self.fitments = {
            "fitment-1": {
                "_id":
                    "fitment-1",

                "product_id":
                    "product-1",

                "make":
                    "Honda",

                "model":
                    "CR-V",

                "make_normalized":
                    "honda",

                "model_normalized":
                    "cr-v",

                "year_start":
                    2002,

                "year_end":
                    2006,

                "engine":
                    "2.4L",

                "engine_normalized":
                    "2.4l",

                "transmission":
                    "Automatic",

                "transmission_normalized":
                    "automatic",

                "is_active":
                    True,

                "created_at":
                    NOW,

                "updated_at":
                    NOW,
            },

            "fitment-2": {
                "_id":
                    "fitment-2",

                "product_id":
                    "product-1",

                "make":
                    "Toyota",

                "model":
                    "Camry",

                "make_normalized":
                    "toyota",

                "model_normalized":
                    "camry",

                "year_start":
                    2010,

                "year_end":
                    2015,

                "engine":
                    None,

                "engine_normalized":
                    None,

                "transmission":
                    None,

                "transmission_normalized":
                    None,

                "is_active":
                    False,

                "created_at":
                    NOW,

                "updated_at":
                    NOW,
            },
        }


    def list_fitments(
        self,
    ):
        return list(
            self.fitments
            .values()
        )


    def find_fitment_by_id(
        self,
        fitment_id,
    ):
        return (
            self.fitments.get(
                fitment_id
            )
        )


    def list_fitments_for_product(
        self,
        product_id,
    ):
        return [
            item
            for item
            in self.fitments
            .values()
            if item[
                "product_id"
            ]
            == product_id
        ]


    def update_fitment(
        self,
        fitment_id,
        updates,
    ):
        item = (
            self.fitments.get(
                fitment_id
            )
        )


        if item is None:
            return None


        item.update(
            updates
        )


        return item


class FakeProductRepository:
    def find_by_id(
        self,
        product_id,
    ):
        if (
            product_id
            == "missing"
        ):
            return None


        return {
            "_id":
                product_id,

            "is_active":
                product_id
                != "inactive",
        }


def make_service():
    return (
        AdminFitmentService(
            repository=
                FakeRepository(),

            product_repository=
                FakeProductRepository(),
        )
    )


def test_admin_lists_active_and_inactive_fitments():
    service = (
        make_service()
    )


    result = (
        service.list_fitments()
    )


    assert (
        len(
            result
        )
        == 2
    )


    assert (
        result[
            1
        ][
            "is_active"
        ]
        is False
    )


def test_admin_updates_and_normalizes_fitment():
    service = (
        make_service()
    )


    result = (
        service.update_fitment(
            "fitment-1",
            AdminFitmentUpdate(
                make=
                    "  HONDA  ",

                model=
                    "  Accord  ",

                year_start=
                    2008,

                year_end=
                    2012,

                engine=
                    "  2.4L  ",

                transmission=
                    " Manual ",
            ),
        )
    )


    assert (
        result[
            "make"
        ]
        == "HONDA"
    )


    assert (
        result[
            "make_normalized"
        ]
        == "honda"
    )


    assert (
        result[
            "model_normalized"
        ]
        == "accord"
    )


    assert (
        result[
            "transmission"
        ]
        == "Manual"
    )


def test_admin_can_deactivate_fitment():
    service = (
        make_service()
    )


    result = (
        service.update_fitment(
            "fitment-1",
            AdminFitmentUpdate(
                is_active=
                    False
            ),
        )
    )


    assert (
        result[
            "is_active"
        ]
        is False
    )


def test_admin_rejects_invalid_year_range():
    service = (
        make_service()
    )


    with pytest.raises(
        AdminFitmentValidationError
    ):
        service.update_fitment(
            "fitment-1",
            AdminFitmentUpdate(
                year_start=
                    2020,

                year_end=
                    2010,
            ),
        )


def test_admin_rejects_duplicate_fitment():
    service = (
        make_service()
    )


    with pytest.raises(
        AdminFitmentAlreadyExistsError
    ):
        service.update_fitment(
            "fitment-1",
            AdminFitmentUpdate(
                make=
                    "Toyota",

                model=
                    "Camry",

                year_start=
                    2010,

                year_end=
                    2015,

                engine=
                    None,

                transmission=
                    None,
            ),
        )
