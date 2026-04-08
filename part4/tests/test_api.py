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


def test_list_users_requires_auth(client):
    response = client.get("/api/v1/users/")
    assert response.status_code == 401


def test_list_users_rejects_non_admin(client):
    client.post(
        "/api/v1/users/register",
        json={
            "first_name": "Regular",
            "last_name": "User",
            "email": "regular_list_test@example.com",
            "password": "secretpass1",
        },
    )
    login = client.post(
        "/api/v1/users/login",
        json={"email": "regular_list_test@example.com", "password": "secretpass1"},
    )
    assert login.status_code == 200
    token = login.get_json()["access_token"]
    response = client.get("/api/v1/users/", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403
