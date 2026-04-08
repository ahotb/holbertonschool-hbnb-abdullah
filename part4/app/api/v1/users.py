from flask_restx import Namespace, Resource, fields
from flask import request
from sqlalchemy import or_
from app.models.user import User
from app import db
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt

api = Namespace('users', description='User operations')

login_model = api.model('Login', {
    'email': fields.String(required=True),
    'password': fields.String(required=True)
})

user_create_model = api.model('UserCreate', {
    'first_name': fields.String(required=True),
    'last_name': fields.String(required=True),
    'email': fields.String(required=True),
    'password': fields.String(required=True),
    'is_admin': fields.Boolean(default=False)
})

user_update_model = api.model('UserUpdate', {
    'first_name': fields.String,
    'last_name': fields.String,
    'password': fields.String
})

admin_user_update_model = api.model('AdminUserUpdate', {
    'first_name': fields.String,
    'last_name': fields.String,
    'email': fields.String,
    'password': fields.String
})


@api.route('/login')
class Login(Resource):
    @api.expect(login_model)
    def post(self):
        """Authenticate and receive a JWT token"""
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        user = User.query.filter_by(email=email).first()
        if not user or not user.check_password(password):
            return {"error": "Invalid credentials"}, 401

        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={"is_admin": user.is_admin}
        )
        return {"access_token": access_token}, 200

@api.route('/register')
class Register(Resource):
    @api.expect(user_create_model)
    def post(self):
        """Register a new public user"""
        data = request.get_json()
        email = data.get('email')

        existing = User.query.filter_by(email=email).first()
        if existing:
            return {"error": "Email already registered"}, 400

        user = User(
            first_name=data.get('first_name'),
            last_name=data.get('last_name'),
            email=email,
            password=data.get('password'),
            is_admin=False
        )
        db.session.add(user)
        db.session.commit()
        return user.to_dict(), 201


@api.route('/')
class UserList(Resource):
    @jwt_required()
    def get(self):
        """List users (admin only). Query: ?q= free-text search, ?role=admin|user"""
        claims = get_jwt()
        if not claims.get('is_admin'):
            return {"error": "Admin privileges required"}, 403

        q = (request.args.get("q") or "").strip()
        role = (request.args.get("role") or "").strip().lower()
        query = User.query

        if q:
            pattern = f"%{q}%"
            query = query.filter(
                or_(
                    User.email.ilike(pattern),
                    User.first_name.ilike(pattern),
                    User.last_name.ilike(pattern),
                )
            )
        if role == "admin":
            query = query.filter_by(is_admin=True)
        elif role == "user":
            query = query.filter_by(is_admin=False)

        users = query.order_by(User.created_at.desc()).all()
        return [u.to_dict() for u in users], 200

    @jwt_required()
    @api.expect(user_create_model)
    def post(self):
        """Create a new user (admin only)"""
        claims = get_jwt()
        if not claims.get('is_admin'):
            return {"error": "Admin privileges required"}, 403

        data = request.get_json()
        email = data.get('email')

        existing = User.query.filter_by(email=email).first()
        if existing:
            return {"error": "Email already registered"}, 400

        user = User(
            first_name=data.get('first_name'),
            last_name=data.get('last_name'),
            email=email,
            password=data.get('password'),
            is_admin=data.get('is_admin', False)
        )
        db.session.add(user)
        db.session.commit()
        return user.to_dict(), 201


@api.route('/<user_id>')
class UserResource(Resource):
    def get(self, user_id):
        """Retrieve a specific user"""
        user = User.query.filter_by(id=user_id).first()
        if not user:
            return {"error": "User not found"}, 404
        return user.to_dict(), 200

    @jwt_required()
    def put(self, user_id):
        """
        Modify user details.
        - Admins: can modify any user including email.
        - Regular users: can only modify their own first_name / last_name / password.
        """
        claims = get_jwt()
        current_user_id = get_jwt_identity()
        is_admin = claims.get('is_admin', False)

        if not is_admin and str(current_user_id) != str(user_id):
            return {"error": "Unauthorized action"}, 403

        data = request.get_json()
        if not data:
            return {"error": "No data provided"}, 400

        if not is_admin and ('email' in data):
            return {"error": "You cannot modify email"}, 400

        user = User.query.filter_by(id=user_id).first()
        if not user:
            return {"error": "User not found"}, 404

        if is_admin and 'email' in data:
            new_email = data['email']
            existing = User.query.filter_by(email=new_email).first()
            if existing and str(existing.id) != str(user_id):
                return {"error": "Email already in use"}, 400
            user.email = new_email

        if is_admin and 'is_admin' in data:
            new_admin = bool(data['is_admin'])
            if not new_admin and str(user_id) == str(current_user_id):
                admin_count = User.query.filter_by(is_admin=True).count()
                if admin_count <= 1:
                    return {"error": "Cannot remove admin role from the only admin account"}, 400
            user.is_admin = new_admin

        # Efficiently and securely update fields (including automatic password hashing)
        update_data = {}
        if 'first_name' in data: update_data['first_name'] = data['first_name']
        if 'last_name' in data: update_data['last_name'] = data['last_name']
        if 'password' in data and data['password']:
            update_data['password'] = data['password']

        user.update_info(**update_data)

        db.session.commit()
        return user.to_dict(), 200

    @jwt_required()
    def delete(self, user_id):
        """Delete a user (admin only)."""
        claims = get_jwt()
        if not claims.get('is_admin'):
            return {"error": "Admin privileges required"}, 403

        current_user_id = get_jwt_identity()
        if str(current_user_id) == str(user_id):
            return {"error": "You cannot delete your own account"}, 400

        user = User.query.filter_by(id=user_id).first()
        if not user:
            return {"error": "User not found"}, 404

        if user.is_admin:
            admin_count = User.query.filter_by(is_admin=True).count()
            if admin_count <= 1:
                return {"error": "Cannot delete the last admin account"}, 400

        db.session.delete(user)
        db.session.commit()
        return {}, 204
