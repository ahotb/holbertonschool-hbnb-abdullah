#part2/app/api/__init__.py
from flask_restx import Api
from app.api.v1.users import api as users_ns
from app.api.v1.amenities import amenity_bp
from app.api.v1.reviews import api as reviews_ns
from app.api.v1.places import api as places_ns  # assuming places.py exists

def create_api(app):
    api = Api(app, version='1.0', title='HBnB API',
              description='HBnB Evolution REST API', doc='/api/v1/docs')
    api.add_namespace(users_ns, path='/api/v1/users')
    app.register_blueprint(amenity_bp, url_prefix='/api/v1')
    api.add_namespace(reviews_ns, path='/api/v1/reviews')
    api.add_namespace(places_ns, path='/api/v1/places')
    return api
