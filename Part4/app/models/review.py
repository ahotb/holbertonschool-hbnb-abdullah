#!/usr/bin/python3
"""Review entity implementation."""

from app.models.base_model import BaseModel
from app.extensions import db
from sqlalchemy import CheckConstraint
from sqlalchemy.orm import validates

class Review(BaseModel):
    __tablename__ = 'reviews'

    text = db.Column(db.String(1000), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    place_id = db.Column(db.String(36), db.ForeignKey('places.id'), nullable=False)

    user = db.relationship(
        'User',
        foreign_keys=[user_id],
        backref=db.backref('reviews', cascade='all, delete-orphan', lazy=True),
    )
    place = db.relationship(
        'Place',
        foreign_keys=[place_id],
        backref=db.backref('reviews', cascade='all, delete-orphan', lazy=True),
    )

    __table_args__ = (CheckConstraint('rating >= 1 AND rating <= 5', name='ck_review_rating_range'),)

    @validates('text')
    def validate_text(self, key, value):
        if not isinstance(value, str) or not value.strip():
            raise ValueError("text must be a non-empty string")
        return value.strip()

    @validates('rating')
    def validate_rating(self, key, value):
        if not isinstance(value, int):
            raise ValueError("rating must be an integer")
        if value < 1 or value > 5:
            raise ValueError("rating must be between 1 and 5")
        return value
