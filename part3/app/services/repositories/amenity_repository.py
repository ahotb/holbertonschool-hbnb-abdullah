# AmenityRepository: persistence for Amenity .
from app.models.amenity import Amenity
from app.persistence.repository import SQLAlchemyRepository


class AmenityRepository(SQLAlchemyRepository):
    """Amenity-specific repository with domain queries."""

    def __init__(self):
        super().__init__(Amenity)

    def get_amenity_by_name(self, name):
        """Return an amenity by name (case-insensitive search)."""
        return self.model.query.filter(
            Amenity.name.ilike(name)
        ).first()
