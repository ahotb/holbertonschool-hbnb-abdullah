# Amenity model: name and description.
from app import db
from app.models.BaseModel import BaseModel


class Amenity(BaseModel):
    """Amenity entity mapped to the 'amenities' table via SQLAlchemy."""
    __tablename__ = 'amenities'

    name = db.Column(db.String(128), nullable=False)
    description = db.Column(db.String(512), nullable=False, default="")

    def __init__(self, name="", description="", **kwargs):
        super().__init__(**kwargs)
        self.name = name
        self.description = description or ""
        self.validate()

    def validate(self):
        """Validate amenity attributes."""
        if not isinstance(self.name, str) or self.name.strip() == "":
            raise ValueError("name must be a non-empty string")
        if not isinstance(self.description, str):
            raise ValueError("description must be a string")

    def updateAmenity(self, data):
        """Update amenity attributes."""
        if 'name' in data:
            self.name = data['name']
        if 'description' in data:
            self.description = data['description']
        self.validate()
        db.session.commit()

    def to_dict(self):
        base = super().to_dict()
        base.update({
            "name": self.name,
            "description": self.description,
        })
        return base
