import pytest
from app.models.user import User
from app.models.place import Place
from app.models.review import Review
from app.models.amenity import Amenity


def test_create_user_and_password_is_hashed():
    user = User(
        first_name="John",
        last_name="Doe",
        email="john@example.com",
        password="securepass",
    )
    assert user.first_name == "John"
    assert user.last_name == "Doe"
    assert user.email == "john@example.com"
    assert user.password != "securepass"
    assert user.verify_password("securepass") is True


def test_missing_user_password_raises():
    with pytest.raises(Exception):
        User(first_name="Jane", last_name="Doe", email="jane@example.com", password=None)


def test_create_amenity():
    amenity = Amenity(name="Pool", description="Outdoor swimming pool")
    assert amenity.name == "Pool"
    assert amenity.description == "Outdoor swimming pool"


def test_invalid_amenity_name():
    with pytest.raises(ValueError):
        Amenity(name="", description="Desc")


def test_create_place():
    user = User(first_name="Owner", last_name="One", email="owner1@example.com", password="pass")
    place = Place(
        title="Hotel",
        description="Nice place",
        price=100.0,
        latitude=21.5,
        longitude=39.2,
        owner_id=user.id,
    )
    assert place.title == "Hotel"
    assert place.price == 100.0
    assert place.owner_id == user.id


def test_invalid_place_title():
    with pytest.raises(ValueError):
        Place(title="", description="Desc", price=50.0, owner_id="user_1")


def test_invalid_place_price():
    with pytest.raises(ValueError):
        Place(title="Test", description="Desc", price=-10, owner_id="user_1")


def test_place_amenity_relationship_uses_list_operations():
    place = Place(title="Resort", description="Sea view", price=200, owner_id="user_2")
    amenity = Amenity(name="Gym", description="Fitness center")
    place.amenities.append(amenity)
    assert amenity in place.amenities
    place.amenities.remove(amenity)
    assert amenity not in place.amenities


def test_create_review():
    user = User(first_name="Rev", last_name="Viewer", email="review@example.com", password="pass")
    place = Place(title="Hotel", description="Nice", price=150, owner_id=user.id)
    review = Review(
        rating=5,
        text="Great place",
        user_id=user.id,
        place_id=place.id,
    )
    assert review.rating == 5
    assert review.text == "Great place"
    assert review.comment == "Great place"


def test_invalid_rating():
    user = User(first_name="User", last_name="X", email="x@example.com", password="pass")
    place = Place(title="Inn", description="Cozy", price=80, owner_id=user.id)
    with pytest.raises(ValueError):
        Review(rating=10, text="Bad", user_id=user.id, place_id=place.id)


def test_missing_user_id():
    place = Place(title="Inn", description="Cozy", price=80, owner_id="user1")
    with pytest.raises(ValueError):
        Review(rating=4, text="Good", user_id=None, place_id=place.id)


def test_missing_place_id():
    user = User(first_name="User", last_name="Y", email="y@example.com", password="pass")
    with pytest.raises(ValueError):
        Review(rating=4, text="Good", user_id=user.id, place_id=None)
