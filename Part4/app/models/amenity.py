#!/usr/bin/python3
"""Amenity entity implementation."""

from app.models.base_model import BaseModel
from app.extensions import db
from app.models.base_model import BaseModel
from app.models.place import place_amenity


class Amenity(db.Model):
    __tablename__ = 'amenities'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=False)


    places = db.relationship(
        'Place',
        secondary=place_amenity,
        back_populates='amenities'
    )

    """Represents a place amenity such as Wi-Fi or Parking."""

    def __init__(self, name, **kwargs):
        super().__init__(**kwargs)
        self._name = ""
        self.name = name

    @property
    def name(self):
        return self._name

    @name.setter
    def name(self, value):
        if not isinstance(value, str) or not value.strip():
            raise ValueError("name must be a non-empty string")
        if len(value.strip()) > 50:
            raise ValueError("name must be at most 50 characters")
        self._name = value.strip()
        self.save()
