#!/bin/bash

echo "Register User"
curl -X POST http://localhost:5000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Ali","last_name":"Tester","email":"ali@test.com","password":"ali123"}'

echo
echo "Login User"
curl -X POST http://localhost:5000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ali@test.com","password":"ali123"}'

echo
echo "Get Places (public)"
curl http://localhost:5000/api/v1/places/

echo
echo "Get Reviews (public)"
curl http://localhost:5000/api/v1/reviews/
