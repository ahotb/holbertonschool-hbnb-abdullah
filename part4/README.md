# HBnB Project - Part 4

Part 4 includes a complete Flask API with authentication and a web client (HTML/CSS/JS) integrated with that API.

## Tech Stack

- Python + Flask
- Flask-RESTX
- Flask-JWT-Extended
- Flask-SQLAlchemy
- Flask-Bcrypt
- HTML5, CSS3, Vanilla JavaScript

## What Is Implemented

- JWT login and cookie-based client session handling
- Role-based authorization using `is_admin`
- CRUD APIs for:
  - Users
  - Places
  - Reviews
  - Amenities
- SQLAlchemy persistence with entity relationships
- Frontend pages:
  - `templates/index.html` - places listing with client-side price filter
  - `templates/login.html` - API login form
  - `templates/place.html` - dynamic place details and reviews
  - `templates/add_review.html` - authenticated review submission form

## Project Structure

```text
part4/
├── app/
│   ├── api/
│   ├── models/
│   ├── persistence/
│   └── services/
├── static/
│   ├── images/
│   ├── scripts.js
│   └── styles.css
├── templates/
├── tests/
├── config.py
├── requirements.txt
└── run.py
```

## API Overview

Base URL: `http://127.0.0.1:5000/api/v1`

- `POST /users/login` - login and get JWT token
- `POST /users/register` - register user
- `GET /places/` - list places
- `GET /places/<place_id>` - place details
- `POST /places/` - create place (auth)
- `GET /reviews/` - list reviews
- `POST /reviews/` - add review (auth)
- `GET /amenities` - list amenities
- `POST /amenities` - create amenity (admin)

Interactive docs:

- `http://127.0.0.1:5000/api/v1/docs`

## Run Locally

```bash
python -m pip install -r requirements.txt
python run.py
```

## Frontend Behavior

- Login sends credentials to `/api/v1/users/login`
- On success, JWT is stored in cookie: `token`
- `index.html`:
  - Fetches places from API
  - Filters places on client side by max price
  - Shows login link only if user is not authenticated
- `place.html`:
  - Reads place id from URL query params
  - Fetches and renders place details + reviews dynamically
  - Shows add-review section only for authenticated users
- `add_review.html`:
  - Redirects unauthenticated users to `index.html`
  - Submits review to API with JWT in `Authorization` header
  - Displays success/error messages inline

## Database and Schema

- SQL schema file: `schema.sql`
- Seed file: `initial_data.sql`
- ER diagram: `ERD.md`

## Testing

Run tests:

```bash
python -m pytest -q
```

Also available:

- `tests/api_tests.sh` for quick API smoke checks
- `tests/part3 test.sh` for integration-style checks

## Notes

- API CORS is enabled for `/api/v1/*`
- Passwords are hashed using bcrypt
- JWT is required for protected endpoints

## Authors

- Abdullah Manahi
- Mohammed Alabdali
- Mousa Alqarni
