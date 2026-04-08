# ReviewRepository: persistence and queries for Review.
from app.models.review import Review
from app.persistence.repository import SQLAlchemyRepository


class ReviewRepository(SQLAlchemyRepository):
    """Review-specific repository with domain queries."""

    def __init__(self):
        super().__init__(Review)

    def get_reviews_by_place(self, place_id):
        """Return all reviews for a given place."""
        return self.model.query.filter_by(place_id=place_id).all()

    def get_reviews_by_user(self, user_id):
        """Return all reviews written by a given user."""
        return self.model.query.filter_by(user_id=user_id).all()

    def user_already_reviewed(self, user_id, place_id):
        """Return True if the user has already reviewed this place."""
        return self.model.query.filter_by(
            user_id=user_id, place_id=place_id
        ).first() is not None
