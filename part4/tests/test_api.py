import pytest
from run import app

@pytest.fixture
def client():
    app.testing = True
    return app.test_client()

# HTTP API smoke tests.
def test_login_with_invalid_credentials(client):
    response = client.post(
        "/api/v1/users/login",
        json={"email": "noone@example.com", "password": "wrong"},
    )
    assert response.status_code == 401

def test_get_places(client):
    response = client.get("/api/v1/places/")
    assert response.status_code == 200

def test_get_reviews(client):
    response = client.get("/api/v1/reviews/")
    assert response.status_code == 200


def test_get_amenities(client):
    response = client.get("/api/v1/amenities")
    assert response.status_code == 200
