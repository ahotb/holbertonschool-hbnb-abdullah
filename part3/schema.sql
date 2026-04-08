-- =============================================================
-- HBnB Database Schema
-- File: schema.sql
-- Description: Creates all tables with proper constraints,
--              foreign keys, and relationships.
-- =============================================================

-- Drop tables in reverse dependency order (child before parent)
DROP TABLE IF EXISTS place_amenity;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS places;
DROP TABLE IF EXISTS amenities;
DROP TABLE IF EXISTS users;

-- -------------------------------------------------------------
-- Table: users
-- -------------------------------------------------------------
CREATE TABLE users (
    id          CHAR(36)        NOT NULL,
    first_name  VARCHAR(255)    NOT NULL,
    last_name   VARCHAR(255)    NOT NULL,
    email       VARCHAR(255)    NOT NULL UNIQUE,
    password    VARCHAR(255)    NOT NULL,
    is_admin    BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- -------------------------------------------------------------
-- Table: places
-- -------------------------------------------------------------
CREATE TABLE places (
    id          CHAR(36)        NOT NULL,
    title       VARCHAR(255)    NOT NULL,
    description TEXT            NOT NULL DEFAULT '',
    price       DECIMAL(10, 2)  NOT NULL,
    latitude    FLOAT           NOT NULL,
    longitude   FLOAT           NOT NULL,
    owner_id    CHAR(36)        NOT NULL,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- -------------------------------------------------------------
-- Table: amenities
-- -------------------------------------------------------------
CREATE TABLE amenities (
    id          CHAR(36)        NOT NULL,
    name        VARCHAR(255)    NOT NULL UNIQUE,
    description VARCHAR(512)    NOT NULL DEFAULT '',
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- -------------------------------------------------------------
-- Table: reviews
-- -------------------------------------------------------------
CREATE TABLE reviews (
    id          CHAR(36)    NOT NULL,
    text        TEXT        NOT NULL,
    rating      INT         NOT NULL CHECK (rating BETWEEN 1 AND 5),
    user_id     CHAR(36)    NOT NULL,
    place_id    CHAR(36)    NOT NULL,
    created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
    FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE,
    -- A user can only leave one review per place
    UNIQUE (user_id, place_id)
);

-- -------------------------------------------------------------
-- Table: place_amenity  (Many-to-Many: Place <-> Amenity)
-- -------------------------------------------------------------
CREATE TABLE place_amenity (
    place_id    CHAR(36)    NOT NULL,
    amenity_id  CHAR(36)    NOT NULL,
    PRIMARY KEY (place_id, amenity_id),
    FOREIGN KEY (place_id)   REFERENCES places(id)    ON DELETE CASCADE,
    FOREIGN KEY (amenity_id) REFERENCES amenities(id) ON DELETE CASCADE
);
