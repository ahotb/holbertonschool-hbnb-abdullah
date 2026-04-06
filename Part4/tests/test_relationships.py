import unittest

from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.place import Place
from app.models.review import Review
from app.models.amenity import Amenity


class RelationshipTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config["TESTING"] = True
        self.app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"

        self.ctx = self.app.app_context()
        self.ctx.push()
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def test_user_places_relationship(self):
        user = User(
            first_name="Mousa",
            last_name="Admin",
            email="mousa@example.com",
            password="password123",
            is_admin=False,
        )
        db.session.add(user)
        db.session.flush()

        place_one = Place(
            title="Lake House",
            description="Quiet place",
            price=120.0,
            latitude=40.0,
            longitude=10.0,
            owner_id=user.id,
        )
        place_two = Place(
            title="City Flat",
            description="In center",
            price=90.0,
            latitude=45.0,
            longitude=12.0,
            owner_id=user.id,
        )
        db.session.add_all([place_one, place_two])
        db.session.commit()

        fetched_user = User.query.filter_by(email="mousa@example.com").first()
        self.assertEqual(len(fetched_user.places), 2)
        self.assertEqual({p.title for p in fetched_user.places}, {"Lake House", "City Flat"})

    def test_place_reviews_relationship(self):
        user = User(
            first_name="Nora",
            last_name="Writer",
            email="nora@example.com",
            password="password123",
            is_admin=False,
        )
        db.session.add(user)
        db.session.flush()

        place = Place(
            title="Mountain Cabin",
            description="Great view",
            price=130.0,
            latitude=35.0,
            longitude=5.0,
            owner_id=user.id,
        )
        db.session.add(place)
        db.session.flush()

        review_one = Review(text="Amazing stay", rating=5, user_id=user.id, place_id=place.id)
        review_two = Review(text="Very good", rating=4, user_id=user.id, place_id=place.id)
        db.session.add_all([review_one, review_two])
        db.session.commit()

        fetched_place = Place.query.filter_by(title="Mountain Cabin").first()
        self.assertEqual(len(fetched_place.reviews), 2)
        self.assertEqual({r.rating for r in fetched_place.reviews}, {4, 5})

    def test_many_to_many_place_amenity_relationship(self):
        user = User(
            first_name="Sam",
            last_name="Host",
            email="sam@example.com",
            password="password123",
            is_admin=False,
        )
        db.session.add(user)
        db.session.flush()

        place = Place(
            title="Beach Villa",
            description="Near sea",
            price=210.0,
            latitude=32.0,
            longitude=29.0,
            owner_id=user.id,
        )
        wifi = Amenity(name="WiFi")
        pool = Amenity(name="Swimming Pool")
        db.session.add_all([place, wifi, pool])
        db.session.flush()

        place.amenities.extend([wifi, pool])
        db.session.commit()

        fetched_place = Place.query.filter_by(title="Beach Villa").first()
        self.assertEqual({a.name for a in fetched_place.amenities}, {"WiFi", "Swimming Pool"})

        fetched_wifi = Amenity.query.filter_by(name="WiFi").first()
        self.assertEqual(len(fetched_wifi.places), 1)
        self.assertEqual(fetched_wifi.places[0].title, "Beach Villa")


if __name__ == "__main__":
    unittest.main()
