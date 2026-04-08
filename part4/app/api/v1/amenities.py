from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from app.services import facade

amenity_bp = Blueprint("amenities", __name__)


@amenity_bp.route("/amenities", methods=["GET"])
def get_amenities():
    """Retrieve all amenities (public)"""
    amenities = facade.list_amenities()
    return jsonify([a.to_dict() for a in amenities]), 200


@amenity_bp.route("/amenities/<amenity_id>", methods=["GET"])
def get_amenity(amenity_id):
    """Retrieve a specific amenity (public)"""
    amenity = facade.get_amenity(amenity_id)
    if not amenity:
        return jsonify({"error": "Amenity not found"}), 404
    return jsonify(amenity.to_dict()), 200


@amenity_bp.route("/amenities", methods=["POST"])
@jwt_required()
def create_amenity():
    """Add a new amenity (admin only)"""
    claims = get_jwt()
    if not claims.get('is_admin'):
        return jsonify({"error": "Admin privileges required"}), 403

    data = request.get_json()
    if not data or "name" not in data:
        return jsonify({"error": "Name is required"}), 400
    try:
        amenity = facade.create_amenity(data)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    return jsonify(amenity.to_dict()), 201


@amenity_bp.route("/amenities/<amenity_id>", methods=["PUT"])
@jwt_required()
def update_amenity(amenity_id):
    """Modify an amenity (admin only)"""
    claims = get_jwt()
    if not claims.get('is_admin'):
        return jsonify({"error": "Admin privileges required"}), 403

    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    amenity = facade.update_amenity(amenity_id, data)
    if not amenity:
        return jsonify({"error": "Amenity not found"}), 404
    return jsonify(amenity.to_dict()), 200
