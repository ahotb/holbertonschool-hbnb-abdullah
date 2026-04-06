PRAGMA foreign_keys = ON;

INSERT INTO users (id, first_name, last_name, email, password, is_admin)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'John',
    'Doe',
    'john@example.com',
    'hashed-password-placeholder',
    0
);

INSERT INTO places (id, title, description, price, latitude, longitude, owner_id)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    'Test Place',
    'Created by CRUD script',
    99.0,
    12.5,
    31.2,
    '11111111-1111-1111-1111-111111111111'
);

INSERT INTO reviews (id, text, rating, user_id, place_id)
VALUES (
    '33333333-3333-3333-3333-333333333333',
    'Nice place',
    5,
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222'
);

INSERT INTO place_amenity (place_id, amenity_id)
SELECT
    '22222222-2222-2222-2222-222222222222',
    id
FROM amenities
WHERE name = 'WiFi'
LIMIT 1;

SELECT id, email, is_admin FROM users;
SELECT id, owner_id, title FROM places;
SELECT id, place_id, user_id, rating FROM reviews;
SELECT place_id, amenity_id FROM place_amenity;

UPDATE places
SET price = 110.0
WHERE id = '22222222-2222-2222-2222-222222222222';

DELETE FROM reviews
WHERE id = '33333333-3333-3333-3333-333333333333';

SELECT id, price FROM places WHERE id = '22222222-2222-2222-2222-222222222222';
SELECT id FROM reviews WHERE id = '33333333-3333-3333-3333-333333333333';
