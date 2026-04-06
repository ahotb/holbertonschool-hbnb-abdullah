#!/usr/bin/python3
"""Amenity entity implementation."""

from app.extensions import db
from app.models.place import place_amenity
from app.models.base_model import BaseModel
from sqlalchemy.orm import validates


class Amenity(BaseModel):
    __tablename__ = 'amenities'

    name = db.Column(db.String(128), nullable=False, unique=True)
    places = db.relationship('Place', secondary=place_amenity, back_populates='amenities')

    @validates('name')
    def validate_name(self, key, value):
        if not isinstance(value, str) or not value.strip():
            raise ValueError("name must be a non-empty string")
        if len(value.strip()) > 128:
            raise ValueError("name must be at most 128 characters")
        return value.strip()
