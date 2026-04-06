#!/usr/bin/python3
"""Review entity implementation."""

from app.models.base_model import BaseModel
from app.models.place import Place
from app.models.user import User
from app.extensions import db
from app.models.base_model import BaseModel

class Review(BaseModel):
    __tablename__ = 'reviews'
    # ... existing columns ...

    # Foreign Keys
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    place_id = db.Column(db.Integer, db.ForeignKey('places.id'), nullable=False)

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    text = db.Column(db.String(1000), nullable=False)
    rating = db.Column(db.Integer, nullable=False) # Should be 1-5
    """Represents a review written by a user for a place."""

    def __init__(self, text, rating, place, user, **kwargs):
        super().__init__(**kwargs)
        self._text = ""
        self._rating = 0

        if not isinstance(place, Place):
            raise ValueError("place must be a Place instance")
        if not isinstance(user, User):
            raise ValueError("user must be a User instance")

        self.place = place
        self.user = user
        self.text = text
        self.rating = rating

    @property
    def text(self):
        return self._text

    @text.setter
    def text(self, value):
        if not isinstance(value, str) or not value.strip():
            raise ValueError("text must be a non-empty string")
        self._text = value.strip()
        self.save()

    @property
    def rating(self):
        return self._rating

    @rating.setter
    def rating(self, value):
        if not isinstance(value, int):
            raise ValueError("rating must be an integer")
        if value < 1 or value > 5:
            raise ValueError("rating must be between 1 and 5")
        self._rating = value
        self.save()

    @property
    def user_id(self):
        return self.user.id

    @property
    def place_id(self):
        return self.place.id

    def update(self, data):
        """Restrict updates to editable review fields only."""
        mutable_fields = {"text", "rating"}
        super().update({key: value for key, value in data.items() if key in mutable_fields})
