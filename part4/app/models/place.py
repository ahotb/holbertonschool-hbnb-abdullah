# Place model and many-to-many link to amenities.
from app import db
from app.models.BaseModel import BaseModel

# Many-to-many association table between Place and Amenity.
place_amenity = db.Table(
    'place_amenity',
    db.Column('place_id', db.String(36), db.ForeignKey('places.id'), primary_key=True),
    db.Column('amenity_id', db.String(36), db.ForeignKey('amenities.id'), primary_key=True)
)


class Place(BaseModel):
    """Place entity with FK to User and M:M to Amenity."""
    __tablename__ = 'places'

    title = db.Column(db.String(128), nullable=False)
    description = db.Column(db.String(1024), nullable=False, default="")
    price = db.Column(db.Float, nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)

    # Foreign key to users.id (owner of the place).
    owner_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)

    # One-to-many: a Place has many Reviews
    reviews = db.relationship('Review', backref='place', lazy=True,
                              cascade='all, delete-orphan')

    # Many-to-many: a Place has many Amenities (and vice-versa)
    amenities = db.relationship('Amenity', secondary=place_amenity,
                                lazy='subquery',
                                backref=db.backref('places', lazy=True))

    def __init__(self, title="", description="", price=0.0,
                 latitude=0.0, longitude=0.0, owner_id=None, **kwargs):
        super().__init__(**kwargs)
        self.title = title
        self.description = description or ""
        self.price = price
        self.latitude = latitude
        self.longitude = longitude
        self.owner_id = owner_id
        self.validate()

    def validate(self):
        if not isinstance(self.title, str) or self.title.strip() == "":
            raise ValueError("title must be a non-empty string")
        if not isinstance(self.description, str):
            raise ValueError("description must be a string")
        if not isinstance(self.price, (int, float)) or self.price < 0:
            raise ValueError("price must be a positive number")
        if not isinstance(self.latitude, (int, float)) or not (-90 <= self.latitude <= 90):
            raise ValueError("latitude must be between -90 and 90")
        if not isinstance(self.longitude, (int, float)) or not (-180 <= self.longitude <= 180):
            raise ValueError("longitude must be between -180 and 180")
        if self.owner_id is None:
            raise ValueError("owner_id is required")

    def to_dict(self):
        base = super().to_dict()
        base.update({
            "title": self.title,
            "description": self.description,
            "price": self.price,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "owner_id": self.owner_id,
        })
        return base
