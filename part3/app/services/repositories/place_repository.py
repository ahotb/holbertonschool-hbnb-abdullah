# PlaceRepository: persistence for Place .
from app.models.place import Place
from app.persistence.repository import SQLAlchemyRepository


class PlaceRepository(SQLAlchemyRepository):
    """Place-specific repository with domain queries."""

    def __init__(self):
        super().__init__(Place)

    def get_places_by_owner(self, owner_id):
        """Return all places owned by a given user."""
        return self.model.query.filter_by(owner_id=owner_id).all()
