"""
seed_admin.py -- run once to create the initial admin user.

Usage:
    py -3 seed_admin.py
"""
from config import DevelopmentConfig
from app import create_app, db
from app.models.user import User

app = create_app(DevelopmentConfig)

with app.app_context():
    db.drop_all()   # reset schema (dev only — new FKs / relationships added)
    db.create_all()

    admin_email = "admin@hbnb.io"
    if not User.query.filter_by(email=admin_email).first():
        admin = User(
            first_name="Admin",
            last_name="User",
            email=admin_email,
            password="Admin1234!",
            is_admin=True
        )
        db.session.add(admin)
        db.session.commit()
        print(f"Admin user created: {admin_email}")
    else:
        print("Admin user already exists.")
