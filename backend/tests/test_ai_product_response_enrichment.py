from datetime import (
    datetime,
    timezone,
)

from bson import ObjectId

from app.schemas.ai_mechanic import (
    AIComponentSuggestion,
    AIMechanicTurn,
    AIPossibleCause,
    AISafety,
)
from app.services.ai_mechanic_service import (
    AIMechanicService,
)


NOW = datetime.now(
    timezone.utc
)


# ============================================================
# FAKE PRODUCT RECOMMENDATION SERVICE
# ============================================================

class FakeProductRecommendationService:
    def __init__(
        self,
        matches,
    ):
        self.matches = matches
        self.calls = []

    def get_for_components(
        self,
        *,
        vehicle_id,
        user_id,
        components,
    ):
        self.calls.append(
            {
                "vehicle_id":
                    vehicle_id,

                "user_id":
                    user_id,

                "components":
                    components,
            }
        )

        return self.matches


# ============================================================
# HELPERS
# ============================================================

def make_product():
    return {
        "id": "product-1",
        "name": (
            "Bosch Brake Rotor"
        ),
        "slug": (
            "bosch-brake-rotor"
        ),
        "sku": "BOSCH-ROTOR-1",
        "part_number": "R1",
        "brand_id": "brand-1",
        "category_id": "category-1",
        "subcategory_slug": (
            "brake-rotors"
        ),
        "description": (
            "Real catalog brake rotor."
        ),
        "price": 89.99,
        "sale_price": None,
        "stock_quantity": 6,
        "images": [],
        "specifications": {},
        "warranty": None,
        "rating_average": 0,
        "review_count": 0,
        "is_active": True,
        "created_at": NOW,
        "updated_at": NOW,
    }


def make_analysis_turn():
    return AIMechanicTurn(
        response_type="analysis",
        assistant_message=(
            "The braking system should "
            "be inspected."
        ),
        follow_up_question=None,
        possible_causes=[
            AIPossibleCause(
                cause=(
                    "Brake rotor variation"
                ),
                explanation=(
                    "Rotor variation may "
                    "cause vibration."
                ),
                relevance="high",
            )
        ],
        components=[
            AIComponentSuggestion(
                component_key=(
                    "brake_rotor"
                ),
                label=(
                    "Brake Rotors"
                ),
                catalog_key=(
                    "brake-rotors"
                ),
                hotspot_key=(
                    "front_brakes"
                ),
                relevance="high",
                explanation=(
                    "Inspect the rotors."
                ),
            )
        ],
        safety=AISafety(
            level="caution",
            message=(
                "Have the braking system "
                "inspected."
            ),
        ),
    )


def make_follow_up_turn():
    return AIMechanicTurn(
        response_type="follow_up",
        assistant_message=(
            "I need another detail."
        ),
        follow_up_question=(
            "Do you feel pedal pulsation?"
        ),
        possible_causes=[],
        components=[],
        safety=AISafety(
            level="normal",
            message=(
                "Provide more information."
            ),
        ),
    )


def make_session(
    turn,
):
    return {
        "_id": ObjectId(),
        "user_id": ObjectId(),
        "vehicle_id": ObjectId(),
        "status": (
            "analysis_ready"
            if (
                turn.response_type
                == "analysis"
            )
            else "waiting_for_user"
        ),
        "messages": [],
        "latest_turn": (
            turn.model_dump(
                mode="python"
            )
        ),
        "created_at": NOW,
        "updated_at": NOW,
    }


def make_service(
    recommendation_service=None,
):
    return AIMechanicService(
        session_repository=None,
        vehicle_repository=None,
        ai_engine=None,
        product_recommendation_service=(
            recommendation_service
        ),
    )


# ============================================================
# QWEN SCHEMA MUST NOT CONTAIN PRODUCTS
# ============================================================

def test_qwen_turn_schema_excludes_products():
    schema = (
        AIMechanicTurn
        .model_json_schema()
    )

    assert (
        "product_recommendations"
        not in schema[
            "properties"
        ]
    )

    assert (
        "compatible_products"
        not in schema[
            "properties"
        ]
    )


# ============================================================
# ANALYSIS RESPONSE IS ENRICHED
# ============================================================

def test_analysis_session_contains_real_products():
    product = make_product()

    recommender = (
        FakeProductRecommendationService(
            {
                "brake_rotor": [
                    product
                ]
            }
        )
    )

    service = make_service(
        recommender
    )

    session = make_session(
        make_analysis_turn()
    )

    result = service._to_public(
        session
    )

    assert (
        len(
            result
            .product_recommendations
        )
        == 1
    )

    recommendation = (
        result
        .product_recommendations[0]
    )

    assert (
        recommendation.component_key
        == "brake_rotor"
    )

    assert (
        recommendation.catalog_key
        == "brake-rotors"
    )

    assert (
        len(
            recommendation
            .compatible_products
        )
        == 1
    )

    assert (
        recommendation
        .compatible_products[0]
        .id
        == "product-1"
    )

    assert (
        recommendation
        .compatible_products[0]
        .price
        == 89.99
    )

    assert (
        recommendation
        .compatible_products[0]
        .stock_quantity
        == 6
    )


# ============================================================
# AUTHENTICATED VEHICLE CONTEXT IS USED
# ============================================================

def test_enrichment_uses_session_vehicle_and_user():
    recommender = (
        FakeProductRecommendationService(
            {
                "brake_rotor": []
            }
        )
    )

    service = make_service(
        recommender
    )

    session = make_session(
        make_analysis_turn()
    )

    service._to_public(
        session
    )

    assert (
        recommender.calls[0][
            "vehicle_id"
        ]
        == str(
            session[
                "vehicle_id"
            ]
        )
    )

    assert (
        recommender.calls[0][
            "user_id"
        ]
        == str(
            session[
                "user_id"
            ]
        )
    )


# ============================================================
# FOLLOW-UP DOES NOT QUERY PRODUCTS
# ============================================================

def test_follow_up_does_not_query_products():
    recommender = (
        FakeProductRecommendationService(
            {}
        )
    )

    service = make_service(
        recommender
    )

    result = service._to_public(
        make_session(
            make_follow_up_turn()
        )
    )

    assert (
        result.product_recommendations
        == []
    )

    assert (
        recommender.calls
        == []
    )


# ============================================================
# NO MATCH REMAINS EMPTY, NOT INVENTED
# ============================================================

def test_no_compatible_product_returns_empty_group():
    recommender = (
        FakeProductRecommendationService(
            {
                "brake_rotor": []
            }
        )
    )

    service = make_service(
        recommender
    )

    result = service._to_public(
        make_session(
            make_analysis_turn()
        )
    )

    assert (
        len(
            result
            .product_recommendations
        )
        == 1
    )

    assert (
        result
        .product_recommendations[0]
        .compatible_products
        == []
    )


# ============================================================
# PRODUCT DATA IS NEVER STORED INSIDE AI TURN
# ============================================================

def test_product_data_is_not_added_to_persisted_turn():
    recommender = (
        FakeProductRecommendationService(
            {
                "brake_rotor": [
                    make_product()
                ]
            }
        )
    )

    service = make_service(
        recommender
    )

    session = make_session(
        make_analysis_turn()
    )

    service._to_public(
        session
    )

    latest_turn = session[
        "latest_turn"
    ]

    assert (
        "product_recommendations"
        not in latest_turn
    )

    for component in (
        latest_turn[
            "components"
        ]
    ):
        assert (
            "compatible_products"
            not in component
        )
