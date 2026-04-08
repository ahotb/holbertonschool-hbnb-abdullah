# HTTP API smoke tests (Part 3).
import pytest
from run import app

@pytest.fixture
def client():
    app.testing = True
    return app.test_client()

# ----- API Tests -----
def test_get_users(client):
    response = client.get("/api/v1/users/")
    assert response.status_code == 200

def test_get_places(client):
    response = client.get("/api/v1/places/")
    assert response.status_code == 200

def test_get_reviews(client):
    response = client.get("/api/v1/reviews/")
    assert response.status_code == 200
