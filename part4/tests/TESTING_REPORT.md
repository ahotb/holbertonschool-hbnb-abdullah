# Testing Report

## Testing Strategy

The system was tested using two main strategies:

1. Unit Testing for the Business Logic Layer using pytest
2. Black-box API testing using cURL and Flask test client

These tests verify that the system correctly handles valid inputs, invalid inputs, and edge cases.

---

# Unit Tests

Unit tests were implemented in the `tests` directory using pytest.

The tests cover:

- User creation
- Email validation
- Empty fields
- Place creation
- Review validation
- Rating limits

Example:

test_create_valid_user()

Expected result:
User should be created successfully.

Actual result:
Test passed.

---

# API Black-box Tests

API endpoints were tested using:

- Flask test client
- cURL commands

Endpoints tested:

GET /api/v1/users  
POST /api/v1/users  
GET /api/v1/places  
GET /api/v1/reviews

Example:

Request

POST /api/v1/users

Input

{
 "name": "Ali",
 "email": "ali@test.com"
}

Expected result

User is created successfully.

Actual result

Status code 201 returned.

---

# Edge Cases Tested

The following edge cases were tested:

- Empty name
- Invalid email format
- Missing fields
- Invalid rating values
- Non-existing resources

All edge cases were handled correctly by returning appropriate error messages and HTTP status codes.

---

# Test Execution

To run the automated tests:

pytest

To run black-box API tests:

bash api_tests.sh

---

# Conclusion

The system successfully passed all validation tests and handled both valid and invalid inputs correctly. The tests confirm that the business logic layer and API endpoints behave as expected.
