from app.schemas.ai_mechanic import (
    AIComponentSuggestion,
)
from app.services.fitment_service import (
    fitment_service,
)


# ============================================================
# AI PRODUCT RECOMMENDATION SERVICE
# ============================================================

class AIProductRecommendationService:
    """
    Deterministically connects trusted AI Mechanic component
    suggestions to real Vehnexa fitment-compatible products.

    IMPORTANT:

    Qwen does NOT choose:

    - product IDs
    - product names
    - SKUs
    - prices
    - stock
    - compatibility
    - fitment

    Those values come only from Vehnexa's real backend data.
    """

    def __init__(
        self,
        *,
        fitment_service,
    ):
        self.fitment_service = (
            fitment_service
        )

    # ========================================================
    # GET PRODUCTS FOR TRUSTED COMPONENTS
    # ========================================================

    def get_for_components(
        self,
        *,
        vehicle_id: str,
        user_id: str,
        components: list[
            AIComponentSuggestion
        ],
    ) -> dict[
        str,
        list[dict],
    ]:
        # ----------------------------------------------------
        # Ask the existing fitment system for ALL products
        # compatible with this authenticated user's vehicle.
        #
        # Vehicle ownership and actual fitment matching remain
        # owned by FitmentService.
        # ----------------------------------------------------

        compatible_products = (
            self.fitment_service
            .get_compatible_products(
                vehicle_id=vehicle_id,
                user_id=user_id,
            )
        )

        # ----------------------------------------------------
        # Index compatible products by their REAL marketplace
        # subcategory.
        #
        # Example:
        #
        # brake-rotors -> [real compatible products]
        # brake-pads   -> [real compatible products]
        # ----------------------------------------------------

        products_by_subcategory: dict[
            str,
            list[dict],
        ] = {}

        for product in (
            compatible_products
        ):
            subcategory_slug = (
                product.get(
                    "subcategory_slug"
                )
            )

            if not isinstance(
                subcategory_slug,
                str,
            ):
                continue

            subcategory_slug = (
                subcategory_slug
                .strip()
                .lower()
            )

            if not subcategory_slug:
                continue

            products_by_subcategory.setdefault(
                subcategory_slug,
                [],
            ).append(
                product
            )

        # ----------------------------------------------------
        # Match trusted component catalog keys against real
        # compatible product subcategories.
        # ----------------------------------------------------

        matches: dict[
            str,
            list[dict],
        ] = {}

        for component in components:
            component_key = (
                component
                .component_key
            )

            catalog_key = (
                component
                .catalog_key
                .strip()
                .lower()
            )

            matches[
                component_key
            ] = list(
                products_by_subcategory.get(
                    catalog_key,
                    [],
                )
            )

        return matches


# ============================================================
# PRODUCTION INSTANCE
# ============================================================

ai_product_recommendation_service = (
    AIProductRecommendationService(
        fitment_service=(
            fitment_service
        ),
    )
)
