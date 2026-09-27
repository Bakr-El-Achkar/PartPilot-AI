from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from app.dependencies.auth import (
    get_current_user,
)
from app.schemas.ai_mechanic import (
    AIMechanicContinueRequest,
    AIMechanicSessionPublic,
    AIMechanicStartRequest,
)
from app.services.ai_mechanic_service import (
    AIMechanicSessionClosedError,
    AIMechanicSessionNotFoundError,
    AIMechanicVehicleNotFoundError,
    ai_mechanic_service,
)
from app.services.ollama_ai_mechanic_engine import (
    AIMechanicEngineError,
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api/ai-mechanic",
    tags=["AI Mechanic"],
)


# ============================================================
# START DIAGNOSTIC SESSION
# ============================================================

@router.post(
    "/sessions",
    response_model=AIMechanicSessionPublic,
    status_code=status.HTTP_201_CREATED,
)
def start_ai_mechanic_session(
    payload: AIMechanicStartRequest,
    current_user: dict = Depends(
        get_current_user
    ),
) -> AIMechanicSessionPublic:
    """
    Start a new AI Mechanic diagnostic session.

    The selected vehicle must belong to the
    authenticated user.
    """

    try:
        return (
            ai_mechanic_service
            .start_session(
                current_user,
                payload,
            )
        )

    except (
        AIMechanicVehicleNotFoundError
    ) as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail=str(exc),
        ) from exc

    except AIMechanicEngineError as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_503_SERVICE_UNAVAILABLE
            ),
            detail=(
                "AI Mechanic is temporarily "
                "unavailable."
            ),
        ) from exc


# ============================================================
# CONTINUE DIAGNOSTIC SESSION
# ============================================================

@router.post(
    "/sessions/{session_id}/messages",
    response_model=AIMechanicSessionPublic,
    status_code=status.HTTP_200_OK,
)
def continue_ai_mechanic_session(
    session_id: str,
    payload: AIMechanicContinueRequest,
    current_user: dict = Depends(
        get_current_user
    ),
) -> AIMechanicSessionPublic:
    """
    Add another user message to an existing
    AI Mechanic session and request the next
    diagnostic turn.
    """

    try:
        return (
            ai_mechanic_service
            .continue_session(
                current_user,
                session_id,
                payload,
            )
        )

    except (
        AIMechanicSessionNotFoundError
    ) as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail=str(exc),
        ) from exc

    except (
        AIMechanicVehicleNotFoundError
    ) as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail=str(exc),
        ) from exc

    except (
        AIMechanicSessionClosedError
    ) as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_409_CONFLICT
            ),
            detail=str(exc),
        ) from exc

    except AIMechanicEngineError as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_503_SERVICE_UNAVAILABLE
            ),
            detail=(
                "AI Mechanic is temporarily "
                "unavailable."
            ),
        ) from exc


# ============================================================
# GET DIAGNOSTIC SESSION
# ============================================================

@router.get(
    "/sessions/{session_id}",
    response_model=AIMechanicSessionPublic,
    status_code=status.HTTP_200_OK,
)
def get_ai_mechanic_session(
    session_id: str,
    current_user: dict = Depends(
        get_current_user
    ),
) -> AIMechanicSessionPublic:
    """
    Retrieve one AI Mechanic session owned
    by the authenticated user.
    """

    try:
        return (
            ai_mechanic_service
            .get_session(
                current_user,
                session_id,
            )
        )

    except (
        AIMechanicSessionNotFoundError
    ) as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail=str(exc),
        ) from exc