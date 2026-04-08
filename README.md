# HBnB Evolution - Holberton Project

This repository contains my implementation of the HBnB project, including the API back-end and the web client developed during the course milestones.

## Repository Structure

- `part4/` - Main working part (Flask API + templates + static frontend + tests)

## Main Features (part4)

- JWT authentication (`/api/v1/users/login`)
- Role-based authorization (admin vs regular user)
- CRUD APIs for users, places, reviews, and amenities
- SQLAlchemy persistence layer
- Frontend pages:
  - `index.html` (places list + price filter)
  - `login.html` (API login + JWT cookie)
  - `place.html` (dynamic place details + reviews)
  - `add_review.html` (authenticated review submission)

## Quick Start

```bash
cd part4
python -m pip install -r requirements.txt
python run.py
```

Then open:

- API docs: `http://127.0.0.1:5000/api/v1/docs`
- Frontend: `http://127.0.0.1:5000/` (or your configured route)

## Testing

```bash
cd part4
python -m pytest -q
```

## Author

- Abdullah Manahi
- Mohammed Alabdali
- Mousa Alqarni
