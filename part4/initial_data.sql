-- =============================================================
-- HBnB Initial Data
-- File: initial_data.sql
-- Description: Seeds the database with an administrator user
--              and the three standard amenities.
--
-- Admin password: admin1234
-- Bcrypt hash generated with Flask-Bcrypt (cost factor 12)
-- Amenity UUIDs generated with Python uuid.uuid4()
-- =============================================================

-- -------------------------------------------------------------
-- Administrator User
-- id is FIXED per project specification
-- -------------------------------------------------------------
INSERT INTO users (id, first_name, last_name, email, password, is_admin)
VALUES (
    '36c9050e-ddd3-4c3b-9731-9f487208bbc1',
    'Admin',
    'HBnB',
    'admin@hbnb.io',
    '$2b$12$QU199VJWbC7K/l85EsEPIuWKB/G2omQnt1B.M27jxWxiWaoJwKgiu',
    TRUE
);

-- -------------------------------------------------------------
-- Standard Amenities
-- -------------------------------------------------------------
INSERT INTO amenities (id, name, description)
VALUES
    ('f3e14d7d-cf16-4115-ada7-b2998cf1367f', 'WiFi',            'High-speed wireless internet access'),
    ('5799b7a3-a2ef-4bf6-9a81-3f2c389bdcdd', 'Swimming Pool',   'Outdoor or indoor swimming pool'),
    ('6d0f68df-cad5-492c-808f-6d5cb9beb16f', 'Air Conditioning','Climate-controlled rooms');
