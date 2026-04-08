from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.services import facade

api = Namespace('reviews', description='Review operations')

review_model = api.model('Review', {
    'text': fields.String(required=True),
    'rating': fields.Integer(required=True),
    'place_id': fields.String(required=True)
})

review_update_model = api.model('ReviewUpdate', {
    'text': fields.String,
    'rating': fields.Integer
})


@api.route('/')
class ReviewList(Resource):
    @jwt_required()
    @api.expect(review_model)
    def post(self):
        """Create a new review (authenticated users; not admin-only)"""
        current_user_id = get_jwt_identity()
        data = api.payload.copy()

        place_id = data.get('place_id')
        place = facade.get_place_obj(place_id)
        if not place:
            return {"error": "Place not found"}, 404

        if str(place.owner_id) == str(current_user_id):
            return {"error": "You cannot review your own place"}, 400

        if facade.user_already_reviewed(current_user_id, place_id):
            return {"error": "You have already reviewed this place"}, 400

        data['user_id'] = current_user_id
        data['comment'] = data.get('text', '')

        try:
            review = facade.create_review(data)
            return {
                "id": review.id,
                "text": review.comment,
                "rating": review.rating,
                "user_id": review.user_id,
                "place_id": review.place_id
            }, 201
        except Exception as e:
            return {"error": str(e)}, 400

    def get(self):
        """Retrieve all reviews (public)"""
        return [
            {
                "id": r.id,
                "text": r.comment,
                "rating": r.rating,
                "user_id": r.user_id,
                "place_id": r.place_id
            } for r in facade.get_all_reviews()
        ], 200


@api.route('/<string:review_id>')
class ReviewResource(Resource):
    def get(self, review_id):
        """Retrieve a specific review (public)"""
        review = facade.get_review(review_id)
        if not review:
            return {"error": "Review not found"}, 404
        return {
            "id": review.id,
            "text": review.comment,
            "rating": review.rating,
            "user_id": review.user_id,
            "place_id": review.place_id
        }, 200

    @jwt_required()
    @api.expect(review_update_model)
    def put(self, review_id):
        """Update a review (admin only)"""
        claims = get_jwt()
        if not claims.get('is_admin'):
            return {"error": "Admin privileges required"}, 403

        review = facade.get_review(review_id)
        if not review:
            return {"error": "Review not found"}, 404

        updated = facade.update_review(review_id, api.payload)
        if not updated:
            return {"error": "Review not found"}, 404
        return {"message": "Review updated successfully"}, 200

    @jwt_required()
    def delete(self, review_id):
        """Delete a review (admin only)"""
        claims = get_jwt()
        if not claims.get('is_admin'):
            return {"error": "Admin privileges required"}, 403

        review = facade.get_review(review_id)
        if not review:
            return {"error": "Review not found"}, 404

        facade.delete_review(review_id)
        return {"message": "Review deleted successfully"}, 200
