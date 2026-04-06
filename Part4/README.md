# HBnB - Part 3 (Auth, API, Persistence)

This repository section implements a complete Flask backend for HBnB with:

- application factory architecture
- JWT authentication and role checks
- SQLAlchemy persistence layer
- repository + facade pattern
- CRUD APIs for users, places, reviews, and amenities
- ORM relationship mapping and validation
- raw SQL schema/seed scripts and automated checks

## Project structure

```text
part3/
├── app/
│   ├── __init__.py                  # Flask app factory and namespace registration
│   ├── extensions.py                # db, bcrypt, jwt extension instances
│   ├── api/v1/
│   │   ├── auth.py                  # login endpoint (JWT token issuing)
│   │   ├── users.py                 # users CRUD and profile authorization rules
│   │   ├── places.py                # places CRUD + ownership enforcement
│   │   ├── reviews.py               # reviews CRUD + business rules
│   │   └── amenities.py             # amenities CRUD (admin controlled writes)
│   ├── models/
│   │   ├── base_model.py            # shared id/timestamps + save/delete/update helpers
│   │   ├── user.py
│   │   ├── place.py
│   │   ├── review.py
│   │   └── amenity.py
│   ├── persistence/repository.py    # abstract + SQLAlchemy repository base
│   └── services/
│       ├── facade.py                # use-case orchestration
│       └── repositories/            # model-specific repositories
├── sql/
│   ├── create_tables.sql            # full relational schema
│   ├── seed_data.sql                # admin + default amenities
│   └── crud_checks.sql              # SQL-level CRUD verification
├── tests/
│   └── test_relationships.py        # ORM relationship tests
├── config.py                        # environment configuration
├── run.py                           # app entrypoint
├── seed_admin.py                    # helper admin seeding (app-level)
├── requirements.txt
└── test.sh                          # unified verification script
```

## Architecture overview

### 1) Presentation layer

`app/api/v1/*` exposes REST endpoints through Flask-RESTX namespaces.

Key behavior:

- open read endpoints where required
- protected write endpoints using `@jwt_required()`
- ownership checks for updates/deletes
- admin-only operations for privileged resources

### 2) Business layer

`app/services/facade.py` centralizes business rules and orchestrates:

- validation before persistence
- entity lookups and cross-entity checks
- creation/update logic independent from route handlers

### 3) Persistence layer

`app/persistence/repository.py` defines repository interfaces and SQLAlchemy implementation.
Model repositories in `app/services/repositories/` provide typed access.

## Data model and relationships

Entities:

- `User`
- `Place`
- `Review`
- `Amenity`

Relationships:

- one-to-many:
  - `User.places` <-> `Place.owner`
  - `User.reviews` <-> `Review.user`
  - `Place.reviews` <-> `Review.place`
- many-to-many:
  - `Place.amenities` <-> `Amenity.places` through `place_amenity`

Data integrity rules include:

- unique user email
- rating range constraint (1..5)
- foreign keys between related entities
- one review per user/place pair in raw SQL schema

## Authentication and authorization

- Login endpoint (`/api/v1/auth/login`) issues JWT access tokens.
- Passwords are stored hashed (bcrypt), never plain text.
- JWT identity is used to enforce ownership rules for places/reviews/users.
- Admin claim (`is_admin`) is used for privileged actions (for example, amenity creation/update).

## SQL scripts

The `sql/` directory contains standalone database scripts for evaluator checks:

- `create_tables.sql`: creates all required tables and relationships
- `seed_data.sql`: inserts required admin and initial amenities
- `crud_checks.sql`: tests SQL-level insert/select/update/delete flows

### Seeded admin user

- fixed id: `00000000-0000-0000-0000-000000000001`
- email: `admin@hbnb.io`
- password: bcrypt hash of `admin1234`
- `is_admin = TRUE`

## Setup

```bash
pip install -r requirements.txt
python run.py
```

## Tests

Run all tests with one command:

```bash
bash test.sh
```

### What `test.sh` validates

`test.sh` is now a full project smoke + integrity runner and checks everything in sequence:

1. **ORM relationship unit tests**
   - runs `python -m unittest discover -s tests -v`
   - verifies `user.places`, `place.reviews`, and `place.amenities` / `amenity.places`
2. **Raw SQL schema checks**
   - executes `sql/create_tables.sql`, `sql/seed_data.sql`, `sql/crud_checks.sql`
   - validates FK/PK constraints and CRUD behavior
   - confirms admin password is bcrypt-hashed and required amenities are seeded
3. **API and auth smoke tests**
   - creates an in-memory app DB
   - logs in as admin and gets JWT
   - creates amenity, users, place, and review through real API endpoints
   - verifies retrieval endpoints return linked amenities/reviews correctly

If all phases pass, the script ends with:

`All checks passed (unit + SQL + API)`

## API summary

Base namespace: `/api/v1`

- `/auth/login`
- `/users` and `/users/<user_id>`
- `/places`, `/places/<place_id>`, `/places/<place_id>/reviews`
- `/reviews` and `/reviews/<review_id>`
- `/amenities` and `/amenities/<amenity_id>`

This gives a complete backend slice for authenticated resource management with persistent relational storage.