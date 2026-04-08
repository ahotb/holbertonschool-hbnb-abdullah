# User model: profile, password hash, admin flag, relationships.
from app import db, bcrypt
from app.models.BaseModel import BaseModel


class User(BaseModel):
    """User entity — one user owns many places and writes many reviews."""
    __tablename__ = 'users'

    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(120), nullable=False, unique=True)
    password = db.Column(db.String(128), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)

    # One-to-many: a User owns many Places
    places = db.relationship('Place', backref='owner', lazy=True,
                             cascade='all, delete-orphan')

    # One-to-many: a User writes many Reviews
    reviews = db.relationship('Review', backref='author', lazy=True,
                              cascade='all, delete-orphan')

    def __init__(self, first_name, last_name, email, password, is_admin=False, **kwargs):
        super().__init__(**kwargs)
        self.first_name = first_name
        self.last_name = last_name
        self.email = email
        self.hash_password(password)
        self.is_admin = is_admin

    def hash_password(self, plain_password):
        """Hash the password before storing it."""
        self.password = bcrypt.generate_password_hash(plain_password).decode('utf-8')

    def verify_password(self, plain_password):
        """Verify the hashed password."""
        return bcrypt.check_password_hash(self.password, plain_password)

    def check_password(self, plain_password):
        """Alias for verify_password (backward compatibility)."""
        return self.verify_password(plain_password)

    def update_info(self, **kwargs):
        """Update allowed fields; password is hashed automatically."""
        for key, value in kwargs.items():
            if key == 'password':
                self.hash_password(value)
            elif hasattr(self, key) and key not in ('id', 'created_at'):
                setattr(self, key, value)

    def to_dict(self):
        return {
            "id": self.id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "email": self.email,
            "is_admin": self.is_admin
        }
