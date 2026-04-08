# Review model: rating and text linked to user and place.
from app import db
from app.models.BaseModel import BaseModel


class Review(BaseModel):
    """Review entity with FK to both User and Place."""
    __tablename__ = 'reviews'

    text = db.Column(db.String(1024), nullable=False)
    rating = db.Column(db.Integer, nullable=False)

    # Foreign key to users.id (author of the review).
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    # Foreign key to places.id.
    place_id = db.Column(db.String(36), db.ForeignKey('places.id'), nullable=False)

    def __init__(self, rating=0, text="", comment=None,
                 user_id=None, place_id=None, **kwargs):
        super().__init__(**kwargs)
        self.rating = rating
        self.text = text or comment or ""
        self.user_id = user_id
        self.place_id = place_id
        self.validate()

    # Backward-compat alias used by older API/facade code
    @property
    def comment(self):
        return self.text

    @comment.setter
    def comment(self, value):
        self.text = value

    def validate(self):
        if not isinstance(self.rating, int) or not (1 <= self.rating <= 5):
            raise ValueError("rating must be an integer between 1 and 5")
        if not isinstance(self.text, str):
            raise ValueError("text must be a string")
        if self.user_id is None:
            raise ValueError("user_id is required")
        if self.place_id is None:
            raise ValueError("place_id is required")

    def updateReview(self, data):
        if 'text' in data:
            self.text = data['text']
        if 'comment' in data:
            self.text = data['comment']
        if 'rating' in data:
            self.rating = data['rating']
        self.validate()
        db.session.commit()

    def to_dict(self):
        base = super().to_dict()
        base.update({
            "text": self.text,
            "rating": self.rating,
            "user_id": self.user_id,
            "place_id": self.place_id,
        })
        return base
