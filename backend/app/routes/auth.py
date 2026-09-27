from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas.user import UserCreate, UserPublic
from app.services.auth_service import AuthService, auth_service

from app.core.security import create_access_token
from app.schemas.user import (
    TokenResponse,
    UserCreate,
    UserLogin,
    UserPublic,
)
from app.dependencies.auth import get_current_user

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


def get_auth_service() -> AuthService:
    return auth_service


@router.post(
    "/register",
    response_model=UserPublic,
    status_code=status.HTTP_201_CREATED,
)
def register_user(
    user: UserCreate,
    service: AuthService = Depends(get_auth_service),
):
    try:
        created_user = service.register(user)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    return UserPublic(
        id=str(created_user["_id"]),
        first_name=created_user["first_name"],
        last_name=created_user["last_name"],
        email=created_user["email"],
        phone=created_user.get("phone"),
        role=created_user["role"],
    )


@router.post(
    "/login",
    response_model=TokenResponse,
)
def login_user(
    credentials: UserLogin,
    service: AuthService = Depends(get_auth_service),
):
    user = service.authenticate(
        credentials.email,
        credentials.password,
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token(
        subject=str(user["_id"])
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
    )


@router.get(
    "/me",
    response_model=UserPublic,
)
def get_my_profile(
    current_user=Depends(get_current_user),
):
    return UserPublic(
        id=str(current_user["_id"]),
        first_name=current_user["first_name"],
        last_name=current_user["last_name"],
        email=current_user["email"],
        phone=current_user.get("phone"),
        role=current_user["role"],
    )