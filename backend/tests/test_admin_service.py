from app.services.admin_service import (
    AdminDashboardService,
)


class FakeAdminRepository:
    def count_products(
        self,
    ):
        return 500


    def count_fitments(
        self,
    ):
        return 500


    def count_orders(
        self,
    ):
        return 128


    def count_orders_this_month(
        self,
    ):
        return 34


    def count_processing_orders(
        self,
    ):
        return 12


    def count_users(
        self,
    ):
        return 246


    def count_categories(
        self,
    ):
        return 16


    def count_brands(
        self,
    ):
        return 20


    def count_low_stock_products(
        self,
    ):
        return 8


    def calculate_revenue(
        self,
    ):
        return 15320.75


def test_admin_overview_contains_real_metrics():
    service = (
        AdminDashboardService(
            repository=
                FakeAdminRepository(),
        )
    )


    overview = (
        service.get_overview()
    )


    assert overview == {
        "products":
            500,

        "fitments":
            500,

        "orders":
            128,

        "orders_this_month":
            34,

        "processing_orders":
            12,

        "users":
            246,

        "categories":
            16,

        "brands":
            20,

        "low_stock_items":
            8,

        "revenue":
            15320.75,
    }
