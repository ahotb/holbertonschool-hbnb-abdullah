"""Place API endpoints."""

from flask_restx import Namespace, Resource, fields
from app.services import facade
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
api = Namespace('places', description='Place operations')

amenity_model = api.model(
    'PlaceAmenity',
    {
        'id': fields.String(description='Amenity ID'),
        'name': fields.String(description='Name of the amenity'),
    },
)

user_model = api.model(
    'PlaceUser',
    {
        'id': fields.String(description='User ID'),
        'first_name': fields.String(description='First name of the owner'),
        'last_name': fields.String(description='Last name of the owner'),
        'email': fields.String(description='Email of the owner'),
    },
)

review_model = api.model(
    'PlaceReview',
    {
        'id': fields.String(description='Review ID'),
        'text': fields.String(description='Review text'),
        'rating': fields.Integer(description='Review rating'),
        'user_id': fields.String(description='Review author user ID'),
    },
)

place_create_model = api.model(
    'PlaceCreate',
    {
        'title': fields.String(required=True, description='Title of the place'),
        'description': fields.String(required=False, description='Description of the place'),
        'price': fields.Float(required=True, description='Price per night'),
        'latitude': fields.Float(required=True, description='Latitude (-90 to 90)'),
        'longitude': fields.Float(required=True, description='Longitude (-180 to 180)'),
        'owner_id': fields.String(required=True, description='ID of the owner'),
        'amenities': fields.List(fields.String, required=False, description="List of amenity IDs"),
    },
)

place_update_model = api.model(
    'PlaceUpdate',
    {
        'title': fields.String(required=False, description='Title of the place'),
        'description': fields.String(required=False, description='Description of the place'),
        'price': fields.Float(required=False, description='Price per night'),
        'latitude': fields.Float(required=False, description='Latitude (-90 to 90)'),
        'longitude': fields.Float(required=False, description='Longitude (-180 to 180)'),
    },
)


def _serialize_place_summary(place):
    return {
        'id': place.id,
        'title': place.title,
        'latitude': place.latitude,
        'longitude': place.longitude,
    }


def _serialize_place(place):
    return {
        'id': place.id,
        'title': place.title,
        'description': place.description,
        'price': place.price,
        'latitude': place.latitude,
        'longitude': place.longitude,
        'owner_id': place.owner_id,
        'owner': {
            'id': place.owner.id,
            'first_name': place.owner.first_name,
            'last_name': place.owner.last_name,
            'email': place.owner.email,
        },
        'amenities': [{'id': amenity.id, 'name': amenity.name} for amenity in place.amenities],
        'reviews': [
            {'id': review.id, 'text': review.text,
                'rating': review.rating, 'user_id': review.user_id}
            for review in place.reviews
        ],
        'created_at': place.created_at.isoformat(),
        'updated_at': place.updated_at.isoformat(),
    }


@api.route('/')
class PlaceList(Resource):
    @api.expect(place_create_model, validate=True)
    @api.response(201, 'Place successfully created')
    @api.response(400, 'Invalid input data')
    # Adding a new response for documentation
    @api.response(401, 'Authorization required')
    @jwt_required()  # Path protection
    def post(self):
        """Register a new place"""
        try:
            # Retrieve user identity from the JWT (user.id)
            current_user_id = get_jwt_identity()

            # Get the request payload
            data = api.payload

            # Overwrite or set owner_id from the authenticated user for security
            data['owner_id'] = current_user_id
            new_place = facade.create_place(data)
            return _serialize_place(new_place), 201
        except ValueError as exc:
            return {'error': str(exc)}, 400

    @api.response(200, 'List of places retrieved successfully')
    def get(self):
        """Retrieve all places (summary)"""
        places = facade.get_all_places()
        return [_serialize_place_summary(place) for place in places], 200


@api.route('/<place_id>')
class PlaceResource(Resource):
    @api.response(200, 'Place details retrieved successfully')
    @api.response(404, 'Place not found')
    def get(self, place_id):
        """Get place details including owner and amenities"""
        place = facade.get_place(place_id)
        if not place:
            return {'error': 'Place not found'}, 404
        return _serialize_place(place), 200

    @api.expect(place_update_model, validate=True)
    @api.response(200, 'Place updated successfully')
    @api.response(404, 'Place not found')
    @api.response(400, 'Invalid input data')
    @api.response(401, 'Authorization required')
    @api.response(403, 'Unauthorized action')  # New response for documentation
    @jwt_required()  # Modification protection
    def put(self, place_id):
        """Update a place's information"""
        try:
            # 1. Retrieve the identity of the current user
            current_user_id = get_jwt_identity()

            # 2. Fetch the place object to check ownership
            place = facade.get_place(place_id)
            if not place:
                return {'error': 'Place not found'}, 404
            
            jwt_payload = get_jwt()
            is_admin = jwt_payload.get('is_admin', False)

            # 3. Ownership Validation: Check if the current user is the owner

            if not is_admin and place.owner_id != current_user_id:
                return {'error': 'Unauthorized action'}, 403
            
            # 4. Proceed with update if ownership is confirmed
            updated_place = facade.update_place(place_id, api.payload)
            return _serialize_place(updated_place), 200
        except ValueError as exc:
            return {'error': str(exc)}, 400


@api.route('/<place_id>/reviews')
class PlaceReviewList(Resource):
    @api.response(200, 'List of reviews for the place retrieved successfully')
    @api.response(404, 'Place not found')
    def get(self, place_id):
        """Get all reviews for a specific place"""
        place = facade.get_place(place_id)
        if not place:
            return {'error': 'Place not found'}, 404

        reviews = facade.get_reviews_by_place(place_id)
        return [
            {'id': review.id, 'text': review.text, 'rating': review.rating}
            for review in reviews
        ], 200
