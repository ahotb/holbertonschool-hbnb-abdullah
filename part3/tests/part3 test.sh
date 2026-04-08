#!/usr/bin/env bash
set -uo pipefail

APP_DIR="${APP_DIR:-$(pwd)}"
HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-5000}"
BASE_URL="http://${HOST}:${PORT}"

DB_FILE="${DB_FILE:-/tmp/hbnb_part3_strict.db}"
LOG_FILE="${LOG_FILE:-/tmp/hbnb_part3_server.log}"

LOGIN_ROUTE="${LOGIN_ROUTE:-/api/v1/users/login}"
USERS_ROUTE="${USERS_ROUTE:-/api/v1/users/}"
AMENITIES_ROUTE="${AMENITIES_ROUTE:-/api/v1/amenities}"
PLACES_ROUTE="${PLACES_ROUTE:-/api/v1/places/}"
REVIEWS_ROUTE="${REVIEWS_ROUTE:-/api/v1/reviews/}"

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS_COUNT=0
FAIL_COUNT=0
SERVER_PID=""

say() {
    printf "%b%s%b\n" "$BLUE" "$1" "$NC"
}

pass() {
    PASS_COUNT=$((PASS_COUNT + 1))
    printf "%b[PASS]%b %s\n" "$GREEN" "$NC" "$1"
}

fail() {
    FAIL_COUNT=$((FAIL_COUNT + 1))
    printf "%b[FAIL]%b %s\n" "$RED" "$NC" "$1"
    if [ -f /tmp/hbnb_resp_body.txt ]; then
        printf 'Response body: %s\n' "$(cat /tmp/hbnb_resp_body.txt 2>/dev/null)"
    fi
}

cleanup() {
    if [ -n "$SERVER_PID" ] && kill -0 "$SERVER_PID" 2>/dev/null; then
        kill "$SERVER_PID" 2>/dev/null || true
        wait "$SERVER_PID" 2>/dev/null || true
    fi
}
trap cleanup EXIT

body() {
    cat /tmp/hbnb_resp_body.txt 2>/dev/null || true
}

json_get() {
    local json="$1"
    local key="$2"
    JSON_INPUT="$json" KEY_NAME="$key" python3 - <<'PY'
import os
import json

raw = os.environ.get("JSON_INPUT", "")
key = os.environ.get("KEY_NAME", "")

try:
    data = json.loads(raw)
    if isinstance(data, dict):
        value = data.get(key, "")
        if isinstance(value, (dict, list)):
            print(json.dumps(value))
        else:
            print(value)
    else:
        print("")
except Exception:
    print("")
PY
}

http_code() {
    local method="$1"
    local url="$2"
    local data="${3:-}"
    local auth="${4:-}"

    if [ -n "$data" ] && [ -n "$auth" ]; then
        curl -s -o /tmp/hbnb_resp_body.txt -w '%{http_code}' \
            -X "$method" \
            -H 'Content-Type: application/json' \
            -H "Authorization: Bearer $auth" \
            -d "$data" \
            "$url"
    elif [ -n "$data" ]; then
        curl -s -o /tmp/hbnb_resp_body.txt -w '%{http_code}' \
            -X "$method" \
            -H 'Content-Type: application/json' \
            -d "$data" \
            "$url"
    elif [ -n "$auth" ]; then
        curl -s -o /tmp/hbnb_resp_body.txt -w '%{http_code}' \
            -X "$method" \
            -H "Authorization: Bearer $auth" \
            "$url"
    else
        curl -s -o /tmp/hbnb_resp_body.txt -w '%{http_code}' \
            -X "$method" \
            "$url"
    fi
}

assert_status() {
    local got="$1"
    local expected="$2"
    local label="$3"

    if [ "$got" = "$expected" ]; then
        pass "$label -> HTTP $got"
    else
        fail "$label -> expected HTTP $expected, got $got"
    fi
}

assert_not_status() {
    local got="$1"
    local blocked="$2"
    local label="$3"

    if [ "$got" != "$blocked" ]; then
        pass "$label -> HTTP $got"
    else
        fail "$label -> unexpected HTTP $got"
    fi
}

assert_nonempty() {
    local value="$1"
    local label="$2"

    if [ -n "$value" ] && [ "$value" != "null" ]; then
        pass "$label"
    else
        fail "$label"
    fi
}

assert_body_not_contains() {
    local pattern="$1"
    local label="$2"

    if body | grep -q "$pattern"; then
        fail "$label"
    else
        pass "$label"
    fi
}

wait_for_server() {
    local tries=40
    local i

    for i in $(seq 1 "$tries"); do
        if curl -s "$BASE_URL/" >/dev/null 2>&1 || \
           curl -s "$BASE_URL/api/v1/" >/dev/null 2>&1 || \
           curl -s "$BASE_URL/api/v1/docs" >/dev/null 2>&1; then
            return 0
        fi
        sleep 1
    done

    return 1
}

seed_database() {
    export DATABASE_URL="sqlite:///$DB_FILE"
    export SECRET_KEY="test_secret"
    export JWT_SECRET_KEY="test_jwt_secret"
    export PYTHONPATH="$APP_DIR:${PYTHONPATH:-}"

    python3 - <<'PY'
import os
import sys

sys.path.insert(0, os.environ["PYTHONPATH"].split(":")[0])

from app import create_app, db
from app.models.user import User
from app.models.amenity import Amenity

app = create_app()

with app.app_context():
    db.drop_all()
    db.create_all()

    admin = User(
        first_name="Admin",
        last_name="User",
        email="admin@hbnb.io",
        password="admin123",
        is_admin=True
    )

    owner = User(
        first_name="Alice",
        last_name="Owner",
        email="alice@hbnb.io",
        password="alice123",
        is_admin=False
    )

    reviewer = User(
        first_name="Bob",
        last_name="Reviewer",
        email="bob@hbnb.io",
        password="bob123",
        is_admin=False
    )

    amenity = Amenity(
        name="WiFi",
        description="Wireless internet"
    )

    db.session.add_all([admin, owner, reviewer, amenity])
    db.session.commit()

    print("seeded")
PY
}

start_server() {
    export DATABASE_URL="sqlite:///$DB_FILE"
    export SECRET_KEY="test_secret"
    export JWT_SECRET_KEY="test_jwt_secret"
    export PYTHONPATH="$APP_DIR:${PYTHONPATH:-}"

    pkill -f run.py 2>/dev/null || true
    pkill -f flask 2>/dev/null || true
    fuser -k "${PORT}/tcp" 2>/dev/null || true

    : > "$LOG_FILE"

    (
        cd "$APP_DIR" || exit 1
        python3 run.py > "$LOG_FILE" 2>&1
    ) &
    SERVER_PID=$!

    if wait_for_server; then
        pass "Server started on $BASE_URL"
    else
        fail "Server did not start"
        printf 'Server log:\n'
        cat "$LOG_FILE" 2>/dev/null || true
        exit 1
    fi
}

load_user_id_by_email() {
    local email="$1"

    DATABASE_URL="sqlite:///$DB_FILE" \
    PYTHONPATH="$APP_DIR:${PYTHONPATH:-}" \
    TARGET_EMAIL="$email" \
    python3 - <<'PY'
import os
import sys

sys.path.insert(0, os.environ["PYTHONPATH"].split(":")[0])

from app import create_app
from app.models.user import User

app = create_app()

with app.app_context():
    user = User.query.filter_by(email=os.environ["TARGET_EMAIL"]).first()
    print(user.id if user else "")
PY
}

main() {
    say "HBnB Part 3 strict integration test"

    if [ ! -f "$APP_DIR/run.py" ]; then
        echo "run.py not found in $APP_DIR"
        exit 1
    fi

    rm -f "$DB_FILE" "$LOG_FILE" /tmp/hbnb_resp_body.txt

    say "Seeding database"
    if seed_database; then
        pass "Database initialized"
    else
        fail "Database initialization failed"
        exit 1
    fi

    say "Starting application"
    start_server

    say "Login tests"
    code=$(http_code POST "$BASE_URL$LOGIN_ROUTE" '{"email":"admin@hbnb.io","password":"admin123"}')
    assert_status "$code" "200" "Admin login works"
    ADMIN_TOKEN=$(json_get "$(body)" "access_token")
    assert_nonempty "$ADMIN_TOKEN" "Admin JWT returned"

    code=$(http_code POST "$BASE_URL$LOGIN_ROUTE" '{"email":"alice@hbnb.io","password":"alice123"}')
    assert_status "$code" "200" "Owner login works"
    OWNER_TOKEN=$(json_get "$(body)" "access_token")
    assert_nonempty "$OWNER_TOKEN" "Owner JWT returned"

    code=$(http_code POST "$BASE_URL$LOGIN_ROUTE" '{"email":"bob@hbnb.io","password":"bob123"}')
    assert_status "$code" "200" "Reviewer login works"
    REVIEWER_TOKEN=$(json_get "$(body)" "access_token")
    assert_nonempty "$REVIEWER_TOKEN" "Reviewer JWT returned"

    code=$(http_code POST "$BASE_URL$LOGIN_ROUTE" '{"email":"admin@hbnb.io","password":"wrong"}')
    assert_status "$code" "401" "Wrong password rejected"

    say "Amenities"
    code=$(http_code GET "$BASE_URL$AMENITIES_ROUTE")
    assert_status "$code" "200" "Public can list amenities"

    code=$(http_code POST "$BASE_URL$AMENITIES_ROUTE" '{"name":"Pool","description":"Swimming pool"}')
    assert_status "$code" "401" "Unauthenticated user cannot create amenity"

    code=$(http_code POST "$BASE_URL$AMENITIES_ROUTE" '{"name":"Pool","description":"Swimming pool"}' "$OWNER_TOKEN")
    assert_status "$code" "403" "Non-admin cannot create amenity"

    code=$(http_code POST "$BASE_URL$AMENITIES_ROUTE" '{"name":"Pool","description":"Swimming pool"}' "$ADMIN_TOKEN")
    assert_status "$code" "201" "Admin can create amenity"

    say "Users"
    code=$(http_code POST "$BASE_URL$USERS_ROUTE" '{"first_name":"Eve","last_name":"User","email":"eve@hbnb.io","password":"eve123","is_admin":false}' "$ADMIN_TOKEN")
    assert_status "$code" "201" "Admin can create user"
    EVE_ID=$(json_get "$(body)" "id")
    assert_nonempty "$EVE_ID" "New user id returned"
    assert_body_not_contains '"password"' "Password is not exposed in create-user response"

    code=$(http_code POST "$BASE_URL$USERS_ROUTE" '{"first_name":"Mallory","last_name":"User","email":"mallory@hbnb.io","password":"mallory123","is_admin":false}' "$OWNER_TOKEN")
    assert_status "$code" "403" "Regular user cannot create user"

    OWNER_ID=$(load_user_id_by_email "alice@hbnb.io")
    REVIEWER_ID=$(load_user_id_by_email "bob@hbnb.io")
    assert_nonempty "$OWNER_ID" "Owner id loaded from DB"
    assert_nonempty "$REVIEWER_ID" "Reviewer id loaded from DB"

    code=$(http_code GET "$BASE_URL${USERS_ROUTE}${OWNER_ID}")
    assert_status "$code" "200" "Public can read single user"
    assert_body_not_contains '"password"' "Password is not exposed in get-user response"

    code=$(http_code PUT "$BASE_URL${USERS_ROUTE}${OWNER_ID}" '{"first_name":"AliceUpdated"}' "$OWNER_TOKEN")
    assert_status "$code" "200" "User can update self"

    code=$(http_code PUT "$BASE_URL${USERS_ROUTE}${OWNER_ID}" '{"first_name":"Hacked"}' "$REVIEWER_TOKEN")
    assert_status "$code" "403" "User cannot update another user"

    say "Places"
    code=$(http_code POST "$BASE_URL$PLACES_ROUTE" '{"title":"Sea View Apartment","description":"Nice place","price":120.5,"latitude":24.7136,"longitude":46.6753,"amenities":[]}')
    assert_status "$code" "401" "Unauthenticated user cannot create place"

    code=$(http_code POST "$BASE_URL$PLACES_ROUTE" '{"title":"Sea View Apartment","description":"Nice place","price":120.5,"latitude":24.7136,"longitude":46.6753,"amenities":[]}' "$OWNER_TOKEN")
    assert_status "$code" "201" "Authenticated user can create place"
    PLACE_ID=$(json_get "$(body)" "id")
    assert_nonempty "$PLACE_ID" "Place id returned"

    code=$(http_code GET "$BASE_URL$PLACES_ROUTE")
    assert_status "$code" "200" "Public can list places"

    code=$(http_code GET "$BASE_URL${PLACES_ROUTE}${PLACE_ID}")
    assert_status "$code" "200" "Public can get single place"

    code=$(http_code PUT "$BASE_URL${PLACES_ROUTE}${PLACE_ID}" '{"price":150}' "$OWNER_TOKEN")
    assert_status "$code" "200" "Owner can update place"

    code=$(http_code PUT "$BASE_URL${PLACES_ROUTE}${PLACE_ID}" '{"price":170}' "$REVIEWER_TOKEN")
    assert_status "$code" "403" "Non-owner cannot update place"

    say "Reviews"
    code=$(http_code POST "$BASE_URL$REVIEWS_ROUTE" "{\"text\":\"Great stay\",\"rating\":5,\"place_id\":\"$PLACE_ID\"}")
    assert_status "$code" "401" "Unauthenticated user cannot create review"

    code=$(http_code POST "$BASE_URL$REVIEWS_ROUTE" "{\"text\":\"Great stay\",\"rating\":5,\"place_id\":\"$PLACE_ID\"}" "$REVIEWER_TOKEN")
    assert_status "$code" "201" "Authenticated user can review another user's place"
    REVIEW_ID=$(json_get "$(body)" "id")
    assert_nonempty "$REVIEW_ID" "Review id returned"

    code=$(http_code POST "$BASE_URL$REVIEWS_ROUTE" "{\"text\":\"Second review\",\"rating\":4,\"place_id\":\"$PLACE_ID\"}" "$REVIEWER_TOKEN")
    assert_status "$code" "400" "Duplicate review by same user is rejected"

    code=$(http_code POST "$BASE_URL$REVIEWS_ROUTE" "{\"text\":\"My own place\",\"rating\":5,\"place_id\":\"$PLACE_ID\"}" "$OWNER_TOKEN")
    assert_status "$code" "400" "Owner cannot review own place"

    code=$(http_code GET "$BASE_URL$REVIEWS_ROUTE")
    assert_status "$code" "200" "Public can list reviews"

    code=$(http_code GET "$BASE_URL${REVIEWS_ROUTE}${REVIEW_ID}")
    assert_status "$code" "200" "Public can read single review"

    code=$(http_code PUT "$BASE_URL${REVIEWS_ROUTE}${REVIEW_ID}" '{"text":"Updated review","rating":4}' "$REVIEWER_TOKEN")
    assert_status "$code" "200" "Author can update review"

    code=$(http_code DELETE "$BASE_URL${REVIEWS_ROUTE}${REVIEW_ID}" '' "$OWNER_TOKEN")
    assert_status "$code" "403" "Non-author cannot delete review"

    code=$(http_code DELETE "$BASE_URL${REVIEWS_ROUTE}${REVIEW_ID}" '' "$REVIEWER_TOKEN")
    assert_status "$code" "200" "Author can delete review"

    say "Summary"
    printf 'Passed: %s\n' "$PASS_COUNT"
    printf 'Failed: %s\n' "$FAIL_COUNT"

    if [ "$FAIL_COUNT" -gt 0 ]; then
        printf '\nServer log:\n'
        cat "$LOG_FILE" 2>/dev/null || true
        exit 1
    fi
}

main "$@"
