from datetime import datetime, timezone

from app.core.security import hash_password
from app.repositories.user_repository import UserRepository, user_repository
from app.schemas.user import UserCreate
from app.core.security import hash_password, verify_password

class AuthService:
    def __init__(self, repository: UserRepository):
        self.repository = repository

    def register(self, user: UserCreate):
        email = user.email.lower()

        if self.repository.find_by_email(email):
            raise ValueError("Email already registered")

        now = datetime.now(timezone.utc)

        document = {
            "first_name": user.first_name.strip(),
            "last_name": user.last_name.strip(),
            "email": email,
            "phone": user.phone,
            "password_hash": hash_password(user.password),
            "role": "customer",
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        }


        return self.repository.create(document)

    def authenticate(self, email: str, password: str):
        email = email.lower()

        user = self.repository.find_by_email(email)

        if not user:
            return None

        if not user.get("is_active", True):
            return None

        if not verify_password(
            password,
            user["password_hash"],
        ):
            return None

        return user 

    def get_user_by_id(self, user_id: str):
        return self.repository.find_by_id(user_id)


auth_service = AuthService(user_repository)