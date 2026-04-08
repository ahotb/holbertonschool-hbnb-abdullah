from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_cors import CORS

# Instances
db = SQLAlchemy()
jwt = JWTManager()
bcrypt = Bcrypt()

def create_app(config_class="config.DevelopmentConfig"):
    """
    Application Factory
    """
    app = Flask(__name__)

    # Load configuration
    app.config.from_object(config_class)

    # Enable CORS
    CORS(app, resources={r"/api/v1/*": {"origins": "*"}})

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)

    # Register API Namespaces later
    # from app.api.v1 import api as v1_api
    # v1_api.init_app(app)

    return app
