from fastapi.testclient import TestClient

from app.main import app
from app.routes.auth import get_auth_service
from app.dependencies.auth import get_current_user

class FakeAuthService:
    def register(self, user):
        return {
            "_id": "user-123",
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email.lower(),
            "phone": user.phone,
            "role": "customer",
        }


def override_auth_service():
    return FakeAuthService()


app.dependency_overrides[get_auth_service] = override_auth_service

client = TestClient(app)


def test_register_user_returns_public_customer():
    response = client.post(
        "/api/auth/register",
        json={
            "first_name": "Bakr",
            "last_name": "El Achkar",
            "email": "BAKR@example.com",
            "phone": "+96170123456",
            "password": "StrongPass123",
        },
    )

    assert response.status_code == 201

    body = response.json()

    assert body == {
        "id": "user-123",
        "first_name": "Bakr",
        "last_name": "El Achkar",
        "email": "bakr@example.com",
        "phone": "+96170123456",
        "role": "customer",
    }

    assert "password" not in body
    assert "password_hash" not in body




class DuplicateEmailAuthService:
    def register(self, user):
        raise ValueError("Email already registered")


def test_register_returns_conflict_for_duplicate_email():
    app.dependency_overrides[get_auth_service] = (
        lambda: DuplicateEmailAuthService()
    )

    response = client.post(
        "/api/auth/register",
        json={
            "first_name": "Bakr",
            "last_name": "El Achkar",
            "email": "bakr@example.com",
            "password": "StrongPass123",
        },
    )

    assert response.status_code == 409
    assert response.json() == {
        "detail": "Email already registered"
    }

    app.dependency_overrides[get_auth_service] = override_auth_service



def override_current_user():
    return {
        "_id": "user-123",
        "first_name": "Bakr",
        "last_name": "El Achkar",
        "email": "bakr@example.com",
        "phone": "+96170123456",
        "role": "customer",
        "is_active": True,
    }


def test_get_current_user_returns_authenticated_user():
    app.dependency_overrides[get_current_user] = override_current_user

    response = client.get(
        "/api/auth/me",
        headers={
            "Authorization": "Bearer fake-test-token",
        },
    )

    assert response.status_code == 200

    assert response.json() == {
        "id": "user-123",
        "first_name": "Bakr",
        "last_name": "El Achkar",
        "email": "bakr@example.com",
        "phone": "+96170123456",
        "role": "customer",
    }

    app.dependency_overrides.pop(get_current_user, None)