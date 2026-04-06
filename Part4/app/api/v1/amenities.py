"""Amenity API endpoints."""

from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt
from app.services import facade

api = Namespace('amenities', description='Amenity operations')

amenity_model = api.model(
    'Amenity',
    {'name': fields.String(required=True, description='Name of the amenity')},
)


def _serialize_amenity(amenity):
    return {'id': amenity.id, 'name': amenity.name}


@api.route('/')
class AmenityList(Resource):
    @api.expect(amenity_model, validate=True)
    @api.response(201, 'Amenity successfully created')
    @api.response(400, 'Invalid input data')
    @api.response(403, 'Admin privileges required')
    @jwt_required() 
    def post(self):
        """Register a new amenity"""
        current_user = get_jwt()
        
        # 2.check if it is admin
        if not current_user.get('is_admin'):
            return {'error': 'Admin privileges required'}, 403

        try:
            new_amenity = facade.create_amenity(api.payload)
            return _serialize_amenity(new_amenity), 201
        except ValueError as exc:
            # Transform model/facade validation failures into 400 responses.
            return {'error': str(exc)}, 400

    @api.response(200, 'List of amenities retrieved successfully')
    def get(self):
        """Retrieve a list of all amenities"""
        amenities = facade.get_all_amenities()
        return [_serialize_amenity(amenity) for amenity in amenities], 200


@api.route('/<amenity_id>')
class AmenityResource(Resource):
    @api.response(200, 'Amenity details retrieved successfully')
    @api.response(404, 'Amenity not found')
    def get(self, amenity_id):
        """Get amenity details by ID"""
        amenity = facade.get_amenity(amenity_id)
        if not amenity:
            return {'error': 'Amenity not found'}, 404
        return _serialize_amenity(amenity), 200

    @api.expect(amenity_model, validate=True)
    @api.response(200, 'Amenity updated successfully')
    @api.response(404, 'Amenity not found')
    @api.response(400, 'Invalid input data')
    @api.response(403, 'Admin privileges required')
    @jwt_required()
    def put(self, amenity_id):
        """Update an amenity's information"""
        current_user = get_jwt()
        if not current_user.get('is_admin'):
            return {'error': 'Admin privileges required'}, 403
        try:
            updated_amenity = facade.update_amenity(amenity_id, api.payload)
            if not updated_amenity:
                return {'error': 'Amenity not found'}, 404
            return {'message': 'Amenity updated successfully'}, 200
        except ValueError as exc:
            return {'error': str(exc)}, 400
