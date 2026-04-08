# Unit tests for Part 3 domain models (User, Place, Review, Amenity).
import pytest
from app.models.user import User
from app.models.place import Place
from app.models.review import Review
from app.models.amenity import Amenity

# ------------------ User Tests ------------------
def test_create_user():
    user = User(
        first_name="John",
        last_name="Doe",
        email="john@example.com",
        password="securepass"
    )
    assert user.first_name == "John"
    assert user.last_name == "Doe"
    assert user.email == "john@example.com"
    assert hasattr(user, "id")

def test_invalid_user_email():
    with pytest.raises(ValueError):
        User(first_name="John", last_name="Doe", email="", password="1234")

def test_missing_user_password():
    with pytest.raises(ValueError):
        User(first_name="Jane", last_name="Doe", email="jane@example.com", password=None)

# ------------------ Amenity Tests ------------------
def test_create_amenity():
    amenity = Amenity(name="Pool", description="Outdoor swimming pool")
    assert amenity.name == "Pool"
    assert amenity.description == "Outdoor swimming pool"

def test_invalid_amenity_name():
    with pytest.raises(ValueError):
        Amenity(name="", description="Desc")

# ------------------ Place Tests ------------------
def test_create_place():
    user = User(first_name="Owner", last_name="One", email="owner1@example.com", password="pass")
    place = Place(
        title="Hotel",
        description="Nice place",
        price=100.0,
        latitude=21.5,
        longitude=39.2,
        owner_id=user.id
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

def test_add_amenity_to_place():
    place = Place(title="Resort", description="Sea view", price=200, owner_id="user_2")
    amenity = Amenity(name="Gym", description="Fitness center")
    place.add_amenity(amenity)
    assert amenity in place.amenities

def test_remove_amenity_from_place():
    place = Place(title="Resort", description="Sea view", price=200, owner_id="user_2")
    amenity = Amenity(name="Spa", description="Relaxing spa")
    place.add_amenity(amenity)
    place.remove_amenity(amenity)
    assert amenity not in place.amenities

# ------------------ Review Tests ------------------
def test_create_review():
    user = User(first_name="Rev", last_name="Viewer", email="review@example.com", password="pass")
    place = Place(title="Hotel", description="Nice", price=150, owner_id=user.id)
    review = Review(
        rating=5,
        comment="Great place",
        user_id=user.id,
        place_id=place.id
    )
    assert review.rating == 5
    assert review.comment == "Great place"

def test_invalid_rating():
    user = User(first_name="User", last_name="X", email="x@example.com", password="pass")
    place = Place(title="Inn", description="Cozy", price=80, owner_id=user.id)
    with pytest.raises(ValueError):
        Review(rating=10, comment="Bad", user_id=user.id, place_id=place.id)

def test_missing_user_id():
    place = Place(title="Inn", description="Cozy", price=80, owner_id="user1")
    with pytest.raises(ValueError):
        Review(rating=4, comment="Good", user_id=None, place_id=place.id)

def test_missing_place_id():
    user = User(first_name="User", last_name="Y", email="y@example.com", password="pass")
    with pytest.raises(ValueError):
        Review(rating=4, comment="Good", user_id=user.id, place_id=None)

def test_add_review_to_place():
    user = User(first_name="Owner", last_name="Two", email="owner2@example.com", password="pass")
    place = Place(title="Villa", description="Luxury", price=500, owner_id=user.id)
    review = Review(rating=5, comment="Excellent", user_id=user.id, place_id=place.id)
    place.add_review(review)
    assert review in place.reviews
