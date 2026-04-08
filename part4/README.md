# HBnB Project — Part 3 (Authentication & Database Integration)

![Python](https://img.shields.io/badge/Python-3.11-blue)
![Flask](https://img.shields.io/badge/Flask-2.3.3-orange)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tasks & Implementation](#tasks--implementation)
   - [0. Application Factory Configuration](#0-application-factory-configuration)
   - [1. User Model & Password Hashing](#1-user-model--password-hashing)
   - [2. JWT Authentication](#2-jwt-authentication)
   - [3. Authenticated User Endpoints](#3-authenticated-user-endpoints)
   - [4. Administrator Endpoints](#4-administrator-endpoints)
   - [5. SQLAlchemy Repository](#5-sqlalchemy-repository)
   - [6. User Entity Mapping](#6-user-entity-mapping)
   - [7. Place, Review, Amenity Mapping](#7-place-review-amenity-mapping)
   - [8. Entity Relationships](#8-entity-relationships)
   - [9. SQL Scripts & Initial Data](#9-sql-scripts--initial-data)
   - [10. Database Diagrams](#10-database-diagrams)
3. [Core Entities](#core-entities)
4. [API Endpoints](#api-endpoints)
5. [Authentication & Authorization](#authentication--authorization)
6. [Running the Application](#running-the-application)
7. [Testing](#testing)
8. [Notes](#notes)
9. [Authors](#authors)

---

## Project Overview

Part 3 of the HBnB Project enhances the backend with:

- **JWT-based Authentication**
- **Role-based Authorization**
- **Database Integration** (SQLite for development, MySQL for production)
- **Persistent CRUD operations** for Users, Places, Reviews, and Amenities

This phase replaces previous in-memory storage with a **robust relational database**.

---

## Tasks & Implementation

### 0. Application Factory Configuration

- Modified the Flask application factory to load configurations for development and production.
- Supports switching between SQLite (development) and MySQL (production).

### 1. User Model & Password Hashing

- Updated `User` model to include a **hashed password** field.
- Used `bcrypt` to securely hash passwords.
- Password is never returned in API responses.

### 2. JWT Authentication

- Implemented JWT-based login with `flask-jwt-extended`.
- Users receive a JWT token on successful authentication.
- Tokens must be included in `Authorization` headers for protected routes.

### 3. Authenticated User Endpoints

- Regular users can:
  - Retrieve their profile
  - Update their profile
  - Create, update, or delete their own Places and Reviews

### 4. Administrator Endpoints

- Admin users can:
  - List all users
  - Delete users
  - Manage Places, Reviews, and Amenities
  - Perform privileged actions restricted to admin role

### 5. SQLAlchemy Repository

- Replaced in-memory repositories with SQLAlchemy-based persistence layer.
- All CRUD operations now interact with the database.

### 6. User Entity Mapping

- Mapped `User` class to a SQLAlchemy model.
- Attributes: `id`, `first_name`, `last_name`, `email`, `password`, `is_admin`

### 7. Place, Review, Amenity Mapping

- `Place`, `Review`, and `Amenity` classes mapped to SQLAlchemy tables.
- Defined primary keys, foreign keys, and constraints.

### 8. Entity Relationships

- Relationships implemented using SQLAlchemy:
  - `User 1:N Place`
  - `User 1:N Review`
  - `Place 1:N Review`
  - `Place N:M Amenity`
- Prepared for visual representation using Mermaid.js ER diagrams.

### 9. SQL Scripts & Initial Data

- SQL scripts provided to generate tables and seed initial data for Users, Places, Reviews, and Amenities.
- Supports both SQLite and MySQL databases.

### 10. Database Diagrams

- ER diagrams generated using **Mermaid.js** for database schema visualization.
- Diagrams show entity relationships and foreign key associations.

---

## Core Entities

- **User**: `id`, `first_name`, `last_name`, `email`, `password`, `is_admin`
- **Place**: `id`, `name`, `description`, `price_by_night`, `latitude`, `longitude`, `owner_id`
- **Review**: `id`, `text`, `rating`, `user_id`, `place_id`
- **Amenity**: `id`, `name`

---

## API Endpoints

_(All protected endpoints require JWT in `Authorization` header)_

**Users**

- `POST /api/v1/users` — Create user
- `GET /api/v1/users` — List users (admin only)
- `GET /api/v1/users/<id>` — Retrieve user
- `PUT /api/v1/users/<id>` — Update user
- `DELETE /api/v1/users/<id>` — Delete user (admin only)

**Places**

- `POST /api/v1/places` — Create place
- `GET /api/v1/places` — List all places
- `GET /api/v1/places/<id>` — Retrieve place
- `PUT /api/v1/places/<id>` — Update place (owner only)
- `DELETE /api/v1/places/<id>` — Delete place (owner/admin)

**Reviews**

- `POST /api/v1/reviews` — Create review
- `GET /api/v1/reviews` — List reviews
- `GET /api/v1/reviews/<id>` — Retrieve review
- `PUT /api/v1/reviews/<id>` — Update review (owner only)
- `DELETE /api/v1/reviews/<id>` — Delete review (owner/admin)

**Amenities**

- `POST /api/v1/amenities` — Create amenity (admin only)
- `GET /api/v1/amenities` — List amenities
- `GET /api/v1/amenities/<id>` — Retrieve amenity
- `PUT /api/v1/amenities/<id>` — Update amenity (admin only)
- `DELETE /api/v1/amenities/<id>` — Delete amenity (admin only)

---

## Authentication & Authorization

- JWT token required for all protected endpoints.
- Passwords hashed with bcrypt.
- Role-based access enforced using `is_admin`.

---

## Running the Application

```bash
pip install -r requirements.txt
python run.py
```

## Testing

- Unit tests in `/tests`
- Example curl:

```bash
curl -H "Authorization: Bearer <JWT_TOKEN>" http://localhost:5000/api/v1/places
```

## Notes

- `DELETE` endpoints for Users, Places, Amenities require admin
- Passwords never returned
- All CRUD backed by database
- JWT required for protected routes

## Authors:

- Abdullah Manahi
- Mohammed Alabdali
- Mousa Alqarni
