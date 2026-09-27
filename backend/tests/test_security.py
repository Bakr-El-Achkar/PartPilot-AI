from app.core.security import hash_password, verify_password


from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


def test_access_token_round_trip():
    token = create_access_token(subject="user-123")

    payload = decode_access_token(token)

    assert payload["sub"] == "user-123"



def test_hash_password_does_not_return_plain_password():
    password = "StrongPass123"

    hashed = hash_password(password)

    assert hashed != password


def test_verify_password_accepts_correct_password():
    password = "StrongPass123"
    hashed = hash_password(password)

    assert verify_password(password, hashed) is True


def test_verify_password_rejects_wrong_password():
    hashed = hash_password("StrongPass123")

    assert verify_password("WrongPassword123", hashed) is False