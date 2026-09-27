from fastapi import (
    APIRouter,
    Depends,
    Header,
    HTTPException,
    status,
)
from pydantic import UUID4

from app.dependencies.auth import (
    get_current_user,
)
from app.schemas.order import (
    OrderCreate,
    OrderPublic,
)
from app.services.order_service import (
    OrderIdempotencyConflictError,
    OrderProductUnavailableError,
    OrderStockError,
    OrderVehicleNotFoundError,
    order_service,
)


router = APIRouter(
    prefix="/api/orders",
    tags=["Orders"],
)


def get_user_id(
    current_user: dict,
) -> str:
    return str(
        current_user["_id"]
    )


@router.post(
    "",
    response_model=OrderPublic,
    status_code=(
        status.HTTP_201_CREATED
    ),
)
def create_order(
    payload: OrderCreate,
    idempotency_key: UUID4 = Header(alias="Idempotency-Key"),
    current_user: dict = Depends(
        get_current_user
    ),
):
    user_id = get_user_id(
        current_user
    )

    try:
        return (
            order_service.create_order(
                user_id,
                payload,
                str(idempotency_key),
            )
        )

    except (
        OrderVehicleNotFoundError
    ) as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail=str(exc),
        ) from exc

    except (
        OrderProductUnavailableError
    ) as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_409_CONFLICT
            ),
            detail=str(exc),
        ) from exc

    except (OrderStockError, OrderIdempotencyConflictError) as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_409_CONFLICT
            ),
            detail=str(exc),
        ) from exc


@router.get(
    "",
    response_model=list[
        OrderPublic
    ],
)
def list_orders(
    current_user: dict = Depends(
        get_current_user
    ),
):
    user_id = get_user_id(
        current_user
    )

    return (
        order_service.list_orders(
            user_id
        )
    )


@router.get(
    "/{order_id}",
    response_model=OrderPublic,
)
def get_order(
    order_id: str,
    current_user: dict = Depends(
        get_current_user
    ),
):
    user_id = get_user_id(
        current_user
    )

    order = (
        order_service.get_order(
            order_id,
            user_id,
        )
    )

    if order is None:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail="Order not found",
        )

    return order
