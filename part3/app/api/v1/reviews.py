"""Review API endpoints."""

from flask_restx import Namespace, Resource, fields

from app.services import facade
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
api = Namespace('reviews', description='Review operations')

review_create_model = api.model(
    'ReviewCreate',
    {
        'text': fields.String(required=True, description='Text of the review'),
        'rating': fields.Integer(required=True, description='Rating of the place (1-5)'),
        'place_id': fields.String(required=True, description='ID of the place'),
    },
)

review_update_model = api.model(
    'ReviewUpdate',
    {
        'text': fields.String(required=False, description='Text of the review'),
        'rating': fields.Integer(required=False, description='Rating of the place (1-5)'),
    },
)


def _serialize_review(review):
    return {
        'id': review.id,
        'text': review.text,
        'rating': review.rating,
        'user_id': review.user_id,
        'place_id': review.place_id,
        'created_at': review.created_at.isoformat(),
        'updated_at': review.updated_at.isoformat(),
    }


@api.route('/')
class ReviewList(Resource):
    @api.expect(review_create_model, validate=True)
    @api.response(201, 'Review successfully created')
    @api.response(400, 'Invalid input data')
    @api.response(401, 'Authorization required')
    @jwt_required()
    def post(self):
        """Register a new review"""
        try:
            current_user_id = get_jwt_identity()
            data = api.payload
            place_id = data.get('place_id')

            # 1. Check if the place exists
            place = facade.get_place(place_id)
            if not place:
                return {'error': 'Place not found'}, 404

            # 2. Validation: Users cannot review their own place
            if place.owner.id == current_user_id:
                return {'error': 'You cannot review your own place'}, 400

            # 3. Validation: Users cannot review the same place twice
            existing_reviews = facade.get_reviews_by_place(place_id)
            if any(r.user_id == current_user_id for r in existing_reviews):
                return {'error': 'You have already reviewed this place'}, 400

            # Set the user_id from the token
            data['user_id'] = current_user_id
            new_review = facade.create_review(data)
            return _serialize_review(new_review), 201
        except ValueError as exc:
            return {'error': str(exc)}, 400

    @api.response(200, 'List of reviews retrieved successfully')
    def get(self):
        """Retrieve a list of all reviews"""
        reviews = facade.get_all_reviews()
        return [
            {'id': review.id, 'text': review.text, 'rating': review.rating}
            for review in reviews
        ], 200


@api.route('/<review_id>')
class ReviewResource(Resource):
    @api.response(200, 'Review details retrieved successfully')
    @api.response(404, 'Review not found')
    def get(self, review_id):
        """Get review details by ID"""
        review = facade.get_review(review_id)
        if not review:
            return {'error': 'Review not found'}, 404
        return _serialize_review(review), 200

    @api.expect(review_update_model, validate=True)
    @api.response(200, 'Review updated successfully')
    @api.response(404, 'Review not found')
    @api.response(400, 'Invalid input data')
    @api.response(403, 'Unauthorized action')
    @jwt_required()
    def put(self, review_id):
        """Update a review's information"""
        try:
            current_user_id = get_jwt_identity()
            review = facade.get_review(review_id)
            jwt_payload = get_jwt()
            is_admin = jwt_payload.get('is_admin', False)
            
            if not review:
                return {'error': 'Review not found'}, 404

            # Ownership Validation: Only the creator and admin can modify the review
            if review.user_id != current_user_id and not is_admin:
                return {'error': 'Unauthorized action'}, 403
            
            updated_review = facade.update_review(review_id, api.payload)
            return _serialize_review(updated_review), 200
        except ValueError as exc:
            return {'error': str(exc)}, 400

    @api.response(200, 'Review deleted successfully')
    @api.response(404, 'Review not found')
    @api.response(403, 'Unauthorized action')
    @jwt_required()
    def delete(self, review_id):
        """Delete a review (Creator only)"""
        current_user_id = get_jwt_identity()
        review = facade.get_review(review_id)

        if not review:
            return {'error': 'Review not found'}, 404

        jwt_payload = get_jwt()
        is_admin = jwt_payload.get('is_admin', False)
        
        # Ownership Validation: Only the creator can delete the review
        if review.user_id != current_user_id and not is_admin:
            return {'error': 'Unauthorized action'}, 403

        facade.delete_review(review_id)
        return {'message': 'Review deleted successfully'}, 200
