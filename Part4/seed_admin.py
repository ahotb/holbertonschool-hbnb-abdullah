from app import create_app, db
from app.services import facade

app = create_app()

with app.app_context():
    # هذه الخطوة السحرية اللي كانت ناقصة: بناء الجداول من الصفر
    print("🔨 Creating database tables...")
    db.create_all()
    
    # الآن نبحث عن الأدمن وننشئه
    admin_email = "admin@hbnb.com"
    if not facade.get_user_by_email(admin_email):
        facade.create_user({
            "first_name": "Super",
            "last_name": "Admin",
            "email": admin_email,
            "password": "admin123",
            "is_admin": True
        })
        print(f"✅ Admin {admin_email} created successfully!")
    else:
        print("ℹ️ Admin already exists.")