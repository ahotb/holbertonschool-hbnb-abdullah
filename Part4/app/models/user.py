import re
from app.extensions import db, bcrypt
from app.models.base_model import BaseModel
from sqlalchemy.orm import validates


class User(BaseModel):
    __tablename__ = 'users'
    # One-to-Many relationships
    places = db.relationship('Place', back_populates='owner', cascade='all, delete-orphan')

    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)

    def __init__(self, **kwargs):
        # Hash password if it's provided as a plain string in the constructor
        if 'password' in kwargs:
            password = kwargs.pop('password')
            kwargs['password'] = bcrypt.generate_password_hash(password).decode('utf-8')
        super().__init__(**kwargs)

    # --- Validations ---

    @validates('first_name', 'last_name')
    def validate_name(self, key, value):
        if not value or not value.strip():
            raise ValueError(f"{key} must be a non-empty string")
        if len(value) > 50:
            raise ValueError(f"{key} must be at most 50 characters")
        return value.strip()

    @validates('email')
    def validate_email(self, key, value):
        if not value or not re.match(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$", value):
            raise ValueError("Invalid email format")
        return value.strip()

    @validates('is_admin')
    def validate_is_admin(self, key, value):
        if not isinstance(value, bool):
            raise ValueError("is_admin must be a boolean")
        return value

    # --- Security Methods ---

    def hash_password(self, password):
        """Hashes the password using Bcrypt."""
        self.password = bcrypt.generate_password_hash(password).decode('utf-8')

    def verify_password(self, password):
        """Verifies if the provided password matches the hashed password."""
        return bcrypt.check_password_hash(self.password, password)