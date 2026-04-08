#part2/app/persistence/__init__.py
from app.persistence.user_repository import UserRepository

user_repository = UserRepository()

__all__ = ["user_repository"]
