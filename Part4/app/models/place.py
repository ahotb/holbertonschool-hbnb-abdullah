#!/usr/bin/python3
"""Place entity implementation."""

from sqlalchemy.orm import validates
from app.extensions import db
from app.models.base_model import BaseModel

place_amenity = db.Table(
    'place_amenity',
    db.Column('place_id', db.String(36), db.ForeignKey('places.id'), primary_key=True),
    db.Column('amenity_id', db.String(36), db.ForeignKey('amenities.id'), primary_key=True),
)


class Place(BaseModel):
    __tablename__ = 'places'

    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(500), nullable=True, default="")
    price = db.Column(db.Float, nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    owner_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)

    owner = db.relationship('User', back_populates='places')
    amenities = db.relationship('Amenity', secondary=place_amenity, back_populates='places', lazy='subquery')

    @validates('title')
    def validate_title(self, key, value):
        if not isinstance(value, str) or not value.strip():
            raise ValueError("title must be a non-empty string")
        if len(value.strip()) > 100:
            raise ValueError("title must be at most 100 characters")
        return value.strip()

    @validates('price')
    def validate_price(self, key, value):
        if not isinstance(value, (int, float)) or float(value) < 0:
            raise ValueError("price must be a non-negative number")
        return float(value)

    @validates('latitude')
    def validate_latitude(self, key, value):
        if not isinstance(value, (int, float)):
            raise ValueError("latitude must be a number")
        value = float(value)
        if value < -90 or value > 90:
            raise ValueError("latitude must be between -90 and 90")
        return value

    @validates('longitude')
    def validate_longitude(self, key, value):
        if not isinstance(value, (int, float)):
            raise ValueError("longitude must be a number")
        value = float(value)
        if value < -180 or value > 180:
            raise ValueError("longitude must be between -180 and 180")
        return value

    @validates('description')
    def validate_description(self, key, value):
        if value is None:
            return ""
        if not isinstance(value, str):
            raise ValueError("description must be a string")
        return value.strip()
