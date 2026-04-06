#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_PATH="${ROOT_DIR}/instance/hbnb_sql_scripts.db"

if command -v python3 >/dev/null 2>&1; then
  PYTHON_BIN="python3"
elif command -v python >/dev/null 2>&1; then
  PYTHON_BIN="python"
else
  echo "Python interpreter not found (python3/python)." >&2
  exit 1
fi

echo "==> Running relationship unit tests"
"${PYTHON_BIN}" -m unittest discover -s tests -v

echo "==> Executing SQL schema + seed + CRUD checks"
"${PYTHON_BIN}" - <<'PY'
import sqlite3
from pathlib import Path

root = Path.cwd()
db_path = root / "instance" / "hbnb_sql_scripts.db"
db_path.parent.mkdir(exist_ok=True)

if db_path.exists():
    db_path.unlink()

conn = sqlite3.connect(db_path)
conn.execute("PRAGMA foreign_keys = ON;")

for script_name in ["create_tables.sql", "seed_data.sql", "crud_checks.sql"]:
    script = (root / "sql" / script_name).read_text(encoding="utf-8")
    conn.executescript(script)

admin = conn.execute(
    "SELECT email, is_admin, password FROM users WHERE id = ?",
    ("00000000-0000-0000-0000-000000000001",),
).fetchone()
amenities = conn.execute("SELECT name FROM amenities ORDER BY name").fetchall()

assert admin is not None, "Admin user not found"
assert admin[0] == "admin@hbnb.io", "Unexpected admin email"
assert admin[1] == 1, "Admin flag is not TRUE"
assert admin[2] != "admin1234", "Admin password is stored in plain text"
assert admin[2].startswith("$2"), "Admin password is not a bcrypt hash"

amenity_names = [row[0] for row in amenities]
for name in ["Air Conditioning", "Swimming Pool", "WiFi"]:
    assert name in amenity_names, f"{name} was not seeded"

conn.close()
print("SQL checks passed.")
PY

echo "==> Running API + auth smoke checks"
"${PYTHON_BIN}" - <<'PY'
from app import create_app
from app.extensions import db
from app.models.user import User


class TestConfig:
    SECRET_KEY = "test-secret"
    JWT_SECRET_KEY = "test-jwt-secret"
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    TESTING = True


app = create_app(TestConfig)

with app.app_context():
    db.create_all()
    admin = User(
        first_name="Admin",
        last_name="User",
        email="admin@hbnb.io",
        password="admin1234",
        is_admin=True,
    )
    db.session.add(admin)
    db.session.commit()

client = app.test_client()

login_resp = client.post(
    "/api/v1/auth/login",
    json={"email": "admin@hbnb.io", "password": "admin1234"},
)
assert login_resp.status_code == 200, f"Admin login failed: {login_resp.get_data(as_text=True)}"
admin_token = login_resp.get_json()["access_token"]
admin_headers = {"Authorization": f"Bearer {admin_token}"}

amenity_resp = client.post("/api/v1/amenities/", json={"name": "WiFi"}, headers=admin_headers)
assert amenity_resp.status_code == 201, f"Amenity creation failed: {amenity_resp.get_data(as_text=True)}"
amenity_id = amenity_resp.get_json()["id"]

user_resp = client.post(
    "/api/v1/users/",
    json={
        "first_name": "Normal",
        "last_name": "User",
        "email": "user1@hbnb.io",
        "password": "userpass123",
        "is_admin": False,
    },
    headers=admin_headers,
)
assert user_resp.status_code == 201, f"User creation failed: {user_resp.get_data(as_text=True)}"

user2_resp = client.post(
    "/api/v1/users/",
    json={
        "first_name": "Reviewer",
        "last_name": "User",
        "email": "user2@hbnb.io",
        "password": "userpass123",
        "is_admin": False,
    },
    headers=admin_headers,
)
assert user2_resp.status_code == 201, f"Second user creation failed: {user2_resp.get_data(as_text=True)}"

u1_login = client.post("/api/v1/auth/login", json={"email": "user1@hbnb.io", "password": "userpass123"})
assert u1_login.status_code == 200, f"User1 login failed: {u1_login.get_data(as_text=True)}"
u1_token = u1_login.get_json()["access_token"]
u1_headers = {"Authorization": f"Bearer {u1_token}"}

place_resp = client.post(
    "/api/v1/places/",
    json={
        "title": "Test Place",
        "description": "Smoke test place",
        "price": 99.0,
        "latitude": 24.7,
        "longitude": 46.7,
        "owner_id": "ignored-by-api",
        "amenities": [amenity_id],
    },
    headers=u1_headers,
)
assert place_resp.status_code == 201, f"Place creation failed: {place_resp.get_data(as_text=True)}"
place_id = place_resp.get_json()["id"]

u2_login = client.post("/api/v1/auth/login", json={"email": "user2@hbnb.io", "password": "userpass123"})
assert u2_login.status_code == 200, f"User2 login failed: {u2_login.get_data(as_text=True)}"
u2_token = u2_login.get_json()["access_token"]
u2_headers = {"Authorization": f"Bearer {u2_token}"}

review_resp = client.post(
    "/api/v1/reviews/",
    json={"text": "Great place", "rating": 5, "place_id": place_id},
    headers=u2_headers,
)
assert review_resp.status_code == 201, f"Review creation failed: {review_resp.get_data(as_text=True)}"

places_list = client.get("/api/v1/places/")
assert places_list.status_code == 200, "GET /places failed"
place_details = client.get(f"/api/v1/places/{place_id}")
assert place_details.status_code == 200, "GET /places/<id> failed"
payload = place_details.get_json()
assert len(payload.get("amenities", [])) >= 1, "Place amenities missing"
assert len(payload.get("reviews", [])) >= 1, "Place reviews missing"

print("API smoke checks passed.")
PY

echo "==> All checks passed (unit + SQL + API)"
