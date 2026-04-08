# Persistence package.
from app.persistence.user_repository import UserRepository

user_repository = UserRepository()

__all__ = ["user_repository"]
