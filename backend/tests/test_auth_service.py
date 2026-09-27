import pytest

from app.schemas.user import UserCreate
from app.services.auth_service import AuthService
from app.core.security import hash_password

class FakeUserRepository:
    def __init__(self):
        self.users = {}

    def find_by_email(self, email):
        return self.users.get(email)

    def create(self, document):
        document = document.copy()
        document["_id"] = "user-123"

        self.users[document["email"]] = document

        return document


def test_register_creates_customer_with_hashed_password():
    repository = FakeUserRepository()
    service = AuthService(repository)

    user = UserCreate(
        first_name="Bakr",
        last_name="El Achkar",
        email="BAKR@example.com",
        phone="+96170123456",
        password="StrongPass123",
    )

    created = service.register(user)

    assert created["email"] == "bakr@example.com"
    assert created["role"] == "customer"
    assert created["password_hash"] != "StrongPass123"


def test_register_rejects_duplicate_email():
    repository = FakeUserRepository()
    service = AuthService(repository)

    user = UserCreate(
        first_name="Bakr",
        last_name="El Achkar",
        email="bakr@example.com",
        password="StrongPass123",
    )

    service.register(user)

    with pytest.raises(ValueError, match="Email already registered"):
        service.register(user)



def test_authenticate_returns_user_for_correct_credentials():
    repository = FakeUserRepository()
    service = AuthService(repository)

    repository.users["bakr@example.com"] = {
        "_id": "user-123",
        "first_name": "Bakr",
        "last_name": "El Achkar",
        "email": "bakr@example.com",
        "password_hash": hash_password("StrongPass123"),
        "role": "customer",
        "is_active": True,
    }

    user = service.authenticate(
        "bakr@example.com",
        "StrongPass123",
    )

    assert user["_id"] == "user-123"
    assert user["email"] == "bakr@example.com"


def test_authenticate_rejects_wrong_password():
    repository = FakeUserRepository()
    service = AuthService(repository)

    repository.users["bakr@example.com"] = {
        "_id": "user-123",
        "email": "bakr@example.com",
        "password_hash": hash_password("StrongPass123"),
        "role": "customer",
        "is_active": True,
    }

    result = service.authenticate(
        "bakr@example.com",
        "WrongPassword123",
    )

    assert result is None


def test_get_user_by_id_returns_user():
    repository = FakeUserRepository()
    service = AuthService(repository)

    repository.users["bakr@example.com"] = {
        "_id": "user-123",
        "email": "bakr@example.com",
        "role": "customer",
    }

    repository.find_by_id = lambda user_id: next(
        (
            user
            for user in repository.users.values()
            if user["_id"] == user_id
        ),
        None,
    )

    user = service.get_user_by_id("user-123")

    assert user["_id"] == "user-123"