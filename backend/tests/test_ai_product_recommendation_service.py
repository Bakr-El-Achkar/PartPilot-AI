from app.schemas.ai_mechanic import (
    AIComponentSuggestion,
)
from app.services.ai_product_recommendation_service import (
    AIProductRecommendationService,
)


# ============================================================
# FAKE FITMENT SERVICE
# ============================================================

class FakeFitmentService:
    def __init__(
        self,
        products,
    ):
        self.products = products
        self.calls = []

    def get_compatible_products(
        self,
        *,
        vehicle_id,
        user_id,
    ):
        self.calls.append(
            {
                "vehicle_id":
                    vehicle_id,

                "user_id":
                    user_id,
            }
        )

        return self.products


# ============================================================
# HELPERS
# ============================================================

def make_component(
    *,
    component_key,
    catalog_key,
):
    return AIComponentSuggestion(
        component_key=(
            component_key
        ),
        label="Trusted Label",
        catalog_key=(
            catalog_key
        ),
        hotspot_key=(
            "front_brakes"
        ),
        relevance="high",
        explanation=(
            "Trusted component."
        ),
    )


def make_product(
    *,
    product_id,
    name,
    subcategory_slug,
    price,
    stock_quantity,
):
    return {
        "id": product_id,
        "name": name,
        "subcategory_slug": (
            subcategory_slug
        ),
        "price": price,
        "sale_price": None,
        "stock_quantity": (
            stock_quantity
        ),
        "is_active": True,
    }


# ============================================================
# REAL SUBCATEGORY MATCHING
# ============================================================

def test_matches_component_to_compatible_product():
    rotor = make_product(
        product_id="rotor-1",
        name="Real Brake Rotor",
        subcategory_slug=(
            "brake-rotors"
        ),
        price=89.99,
        stock_quantity=12,
    )

    service = (
        AIProductRecommendationService(
            fitment_service=(
                FakeFitmentService(
                    [rotor]
                )
            ),
        )
    )

    result = service.get_for_components(
        vehicle_id="vehicle-1",
        user_id="user-1",
        components=[
            make_component(
                component_key=(
                    "brake_rotor"
                ),
                catalog_key=(
                    "brake-rotors"
                ),
            )
        ],
    )

    assert (
        len(
            result[
                "brake_rotor"
            ]
        )
        == 1
    )

    assert (
        result[
            "brake_rotor"
        ][0]["id"]
        == "rotor-1"
    )


# ============================================================
# UNRELATED COMPATIBLE PRODUCTS ARE NOT RETURNED
# ============================================================

def test_does_not_mix_product_categories():
    rotor = make_product(
        product_id="rotor-1",
        name="Rotor",
        subcategory_slug=(
            "brake-rotors"
        ),
        price=80,
        stock_quantity=5,
    )

    battery = make_product(
        product_id="battery-1",
        name="Battery",
        subcategory_slug=(
            "batteries"
        ),
        price=120,
        stock_quantity=3,
    )

    service = (
        AIProductRecommendationService(
            fitment_service=(
                FakeFitmentService(
                    [
                        rotor,
                        battery,
                    ]
                )
            ),
        )
    )

    result = service.get_for_components(
        vehicle_id="vehicle-1",
        user_id="user-1",
        components=[
            make_component(
                component_key=(
                    "brake_rotor"
                ),
                catalog_key=(
                    "brake-rotors"
                ),
            )
        ],
    )

    assert (
        len(
            result[
                "brake_rotor"
            ]
        )
        == 1
    )

    assert (
        result[
            "brake_rotor"
        ][0]["id"]
        == "rotor-1"
    )


# ============================================================
# MULTIPLE COMPONENTS
# ============================================================

def test_matches_multiple_components():
    products = [
        make_product(
            product_id="rotor-1",
            name="Rotor",
            subcategory_slug=(
                "brake-rotors"
            ),
            price=80,
            stock_quantity=5,
        ),
        make_product(
            product_id="pad-1",
            name="Pads",
            subcategory_slug=(
                "brake-pads"
            ),
            price=45,
            stock_quantity=10,
        ),
    ]

    service = (
        AIProductRecommendationService(
            fitment_service=(
                FakeFitmentService(
                    products
                )
            ),
        )
    )

    result = service.get_for_components(
        vehicle_id="vehicle-1",
        user_id="user-1",
        components=[
            make_component(
                component_key=(
                    "brake_rotor"
                ),
                catalog_key=(
                    "brake-rotors"
                ),
            ),
            make_component(
                component_key=(
                    "brake_pad"
                ),
                catalog_key=(
                    "brake-pads"
                ),
            ),
        ],
    )

    assert (
        result[
            "brake_rotor"
        ][0]["id"]
        == "rotor-1"
    )

    assert (
        result[
            "brake_pad"
        ][0]["id"]
        == "pad-1"
    )


# ============================================================
# NO PRODUCT MATCH
# ============================================================

def test_component_without_compatible_product_returns_empty_list():
    service = (
        AIProductRecommendationService(
            fitment_service=(
                FakeFitmentService(
                    []
                )
            ),
        )
    )

    result = service.get_for_components(
        vehicle_id="vehicle-1",
        user_id="user-1",
        components=[
            make_component(
                component_key=(
                    "brake_rotor"
                ),
                catalog_key=(
                    "brake-rotors"
                ),
            )
        ],
    )

    assert (
        result[
            "brake_rotor"
        ]
        == []
    )


# ============================================================
# VEHICLE OWNERSHIP CONTEXT IS FORWARDED
# ============================================================

def test_uses_authenticated_vehicle_context():
    fake_fitment_service = (
        FakeFitmentService(
            []
        )
    )

    service = (
        AIProductRecommendationService(
            fitment_service=(
                fake_fitment_service
            ),
        )
    )

    service.get_for_components(
        vehicle_id=(
            "actual-vehicle"
        ),
        user_id=(
            "actual-user"
        ),
        components=[],
    )

    assert (
        fake_fitment_service
        .calls[0]
        == {
            "vehicle_id":
                "actual-vehicle",

            "user_id":
                "actual-user",
        }
    )
