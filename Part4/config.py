import os
from datetime import timedelta


class Config:
    # 🔐 Security: Secret keys (from environment variables or default for development only)
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-key-change-in-production')
    JWT_SECRET_KEY = os.getenv(
        'JWT_SECRET_KEY', 'dev-jwt-key-change-in-production')

    # ⚙️ General settings
    DEBUG = False

    # 🔗 Database settings
    SQLALCHEMY_TRACK_MODIFICATIONS = False  # Disable to save memory

    # 🕐 JWT settings (for authentication)
    # Access token expires after 1 hour
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)

    # 🌐 CORS settings for frontend integration
    CORS_ORIGINS = os.getenv(
        'CORS_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000').split(',')


class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///development.db'
    # SQLALCHEMY_ECHO = True  # ← Uncomment to log SQL queries to console (useful for debugging)


class TestingConfig(Config):
    TESTING = True
    # Temporary in-memory database for tests
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'


# 📦 Configuration dictionary to select the environment
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig  # Can be changed to 'production' later
}
