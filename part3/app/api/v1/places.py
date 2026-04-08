from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.services import facade

api = Namespace('places', description='Place operations')

# Request/response models for Swagger (place payloads).
amenity_model = api.model('PlaceAmenity', {
    'id': fields.String,
    'name': fields.String
})
user_model = api.model('PlaceUser', {
    'id': fields.String,
    'first_name': fields.String,
    'last_name': fields.String,
    'email': fields.String
})
review_model = api.model('PlaceReview', {
    'id': fields.String,
    'text': fields.String,
    'rating': fields.Integer,
    'user_id': fields.String
})
place_model = api.model('Place', {
    'title': fields.String(required=True),
    'description': fields.String,
    'price': fields.Float(required=True),
    'latitude': fields.Float(required=True),
    'longitude': fields.Float(required=True),
    'amenities': fields.List(fields.String)
})
place_update_model = api.model('PlaceUpdate', {
    'title': fields.String,
    'description': fields.String,
    'price': fields.Float,
    'latitude': fields.Float,
    'longitude': fields.Float,
    'amenities': fields.List(fields.String)
})


@api.route('/')
class PlaceList(Resource):
    @jwt_required()
    @api.expect(place_model)
    def post(self):
        """Create a new place (authenticated users only)"""
        current_user_id = get_jwt_identity()
        data = api.payload.copy()
        data['owner_id'] = current_user_id
        try:
            place = facade.create_place(data)
            return {
                "id": place.id,
                "title": place.title,
                "description": place.description,
                "price": place.price,
                "latitude": place.latitude,
                "longitude": place.longitude,
                "owner_id": place.owner_id
            }, 201
        except Exception as e:
            return {"error": str(e)}, 400

    def get(self):
        """Retrieve all places (public)"""
        return facade.get_all_places(), 200


@api.route('/<place_id>')
class PlaceResource(Resource):
    def get(self, place_id):
        """Retrieve a specific place (public)"""
        place = facade.get_place(place_id)
        if not place:
            return {"error": "Place not found"}, 404
        return place, 200

    @jwt_required()
    @api.expect(place_update_model)
    def put(self, place_id):
        """Update a place (owner or admin)"""
        claims = get_jwt()
        current_user_id = get_jwt_identity()
        is_admin = claims.get('is_admin', False)

        place = facade.get_place_obj(place_id)
        if not place:
            return {"error": "Place not found"}, 404

        if not is_admin and str(place.owner_id) != str(current_user_id):
            return {"error": "Unauthorized action"}, 403

        data = api.payload
        try:
            updated = facade.update_place(place_id, data)
        except Exception as e:
            return {"error": str(e)}, 400
        if not updated:
            return {"error": "Place not found"}, 404
        return {"message": "Place updated successfully"}, 200


@api.route('/<place_id>/reviews')
class PlaceReviewList(Resource):
    def get(self, place_id):
        """Get all reviews for a place (public)"""
        reviews = facade.get_reviews_by_place(place_id)
        if reviews is None:
            return {"error": "Place not found"}, 404
        return [
            {"id": r.id, "text": r.comment, "rating": r.rating, "user_id": r.user_id}
            for r in reviews
        ], 200
