import pytest
from pydantic import ValidationError

from app.schemas.user import UserCreate


def test_user_create_accepts_valid_data():
    user = UserCreate(
        first_name="Bakr",
        last_name="El Achkar",
        email="bakr@example.com",
        phone="+96170123456",
        password="StrongPass123",
    )

    assert user.first_name == "Bakr"
    assert user.last_name == "El Achkar"
    assert user.email == "bakr@example.com"
    assert user.phone == "+96170123456"


def test_user_create_rejects_invalid_email():
    with pytest.raises(ValidationError):
        UserCreate(
            first_name="Bakr",
            last_name="El Achkar",
            email="not-an-email",
            password="StrongPass123",
        )


def test_user_create_rejects_short_password():
    with pytest.raises(ValidationError):
        UserCreate(
            first_name="Bakr",
            last_name="El Achkar",
            email="bakr@example.com",
            password="123",
        )