from app.models.place import Place
from app.persistence.repository import SQLAlchemyRepository
from sqlalchemy.orm import joinedload


class PlaceRepository(SQLAlchemyRepository):
    def __init__(self):
        super().__init__(Place)

    def get(self, obj_id):
        """Get place with owner, amenities, and reviews eager loaded."""
        return self.model.query.options(
            joinedload(Place.owner),
            joinedload(Place.amenities),
            joinedload(Place.reviews)
        ).get(obj_id)
