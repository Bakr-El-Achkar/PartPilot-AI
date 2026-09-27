from fastapi import FastAPI

from fastapi.middleware.cors import (
    CORSMiddleware,
)

from app.core.config import settings

from app.routes.auth import (
    router as auth_router,
)

from app.routes.addresses import (
    router as addresses_router,
)

from app.routes.catalog import (
    router as catalog_router,
)

from app.routes.fitments import (
    router as fitments_router,
)

from app.routes.products import (
    router as products_router,
)

from app.routes.orders import (
    router as orders_router,
)

from app.routes.vehicles import (
    router as vehicles_router,
)

from app.routes.vehicle_catalog import (
    router as vehicle_catalog_router,
)


from app.routes.ai_mechanic import (
    router as ai_mechanic_router,
)


from app.routes.wishlist import (
    router as wishlist_router,
)


from app.routes.admin import (
    router as admin_router,
)


from app.routes.reviews import (
    router as reviews_router,
)


from app.routes.notifications import (
    router as notifications_router,
)


app = FastAPI(
    title="Vehnexa API",
    version="1.0.0",
)


cors_origins = [
    origin.strip()
    for origin in settings.cors_origins.split(",")
    if origin.strip()
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(
    auth_router
)

app.include_router(
    addresses_router
)

app.include_router(
    vehicles_router
)

app.include_router(
    vehicle_catalog_router
)

app.include_router(
    catalog_router
)

app.include_router(
    products_router
)

app.include_router(
    orders_router
)

app.include_router(
    fitments_router
)

app.include_router(
    ai_mechanic_router
)

app.include_router(
    wishlist_router
)


app.include_router(
    admin_router
)


app.include_router(
    reviews_router
)


app.include_router(
    notifications_router
)


@app.get(
    "/api/health"
)
def health_check():
    return {
        "status": "ok",
        "service": "Vehnexa API",
    }