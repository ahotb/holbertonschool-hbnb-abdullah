#!/usr/bin/python3
"""
Application factory module.
Initializes Flask app, extensions, API routes, and handles compatibility patches.
"""

# Third-party imports
from flask import Flask
from flask_cors import CORS
from flask_restx import Api
from flask_restx.model import ModelBase

# Local imports
from .extensions import db, bcrypt, jwt

# API Configuration Constants (Centralized for easy updates)
API_VERSION = '1.0'
API_TITLE = 'HBnB API'
API_DESCRIPTION = 'HBnB Application API'
API_DOC_PATH = '/api/v1/'
API_PREFIX = '/api/v1'

# Store original validation method for compatibility patch
_ORIGINAL_RESTX_MODEL_VALIDATE = ModelBase.validate


def _patch_restx_registry_compat():
    """
    Compatibility patch for jsonschema/flask-restx registry argument mismatches.
    Prevents TypeError in newer jsonschema versions while maintaining functionality.
    """
    if getattr(ModelBase.validate, "_registry_compat_patched", False):
        return

    def _validate_with_registry_fallback(self, data, resolver=None, format_checker=None):
        try:
            return _ORIGINAL_RESTX_MODEL_VALIDATE(
                self, data, resolver=resolver, format_checker=format_checker
            )
        except TypeError as exc:
            if "unexpected keyword argument 'registry'" not in str(exc):
                raise
            return _ORIGINAL_RESTX_MODEL_VALIDATE(
                self, data, resolver=None, format_checker=format_checker
            )

    _validate_with_registry_fallback._registry_compat_patched = True
    ModelBase.validate = _validate_with_registry_fallback


def create_app(config_class="config.DevelopmentConfig"):
    """
    Application factory function.
    Creates and configures the Flask application instance.

    Args:
        config_class (str): Dot-notation path to the configuration class.

    Returns:
        Flask: Configured Flask application instance.
    """
    # 1. Initialize Flask App
    app = Flask(__name__)
    app.config.from_object(config_class)

    # 2. Initialize Extensions
    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)

    # 3. Enable CORS for Frontend Integration (Reads from config.py)
    cors_origins = app.config.get('CORS_ORIGINS', [])
    CORS(app, resources={f"{API_PREFIX}/*": {"origins": cors_origins}})

    # 4. Apply RestX Compatibility Patch
    _patch_restx_registry_compat()

    # 5. Setup Flask-RestX API
    api = Api(
        app,
        version=API_VERSION,
        title=API_TITLE,
        description=API_DESCRIPTION,
        doc=API_DOC_PATH
    )

    # 6. Import Namespaces (Lazy import to prevent circular dependencies)
    from app.api.v1.users import api as users_ns
    from app.api.v1.amenities import api as amenities_ns
    from app.api.v1.places import api as places_ns
    from app.api.v1.reviews import api as reviews_ns
    from app.api.v1.auth import api as auth_ns

    # 7. Register Namespaces (Clean & DRY)
    namespaces = [
        (users_ns, '/users'),
        (amenities_ns, '/amenities'),
        (places_ns, '/places'),
        (reviews_ns, '/reviews'),
        (auth_ns, '/auth'),
    ]

    for ns, path in namespaces:
        api.add_namespace(ns, path=f"{API_PREFIX}{path}")

    return app
