from flask_restx import Api
from .users import api as users_ns
from .places import api as places_ns
from .reviews import api as reviews_ns

api = Api(
    title="HBnB API",
    version="1.0",
    description="HBnB Application API"
)

# Register namespaces (amenities uses a Blueprint, registered separately in app/api/__init__.py)
api.add_namespace(users_ns)
api.add_namespace(places_ns, path='/places')
api.add_namespace(reviews_ns, path='/reviews')
