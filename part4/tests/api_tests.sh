#!/bin/bash

echo "Create User"
curl -X POST http://localhost:5000/api/v1/users \
-H "Content-Type: application/json" \
-d '{"name":"Ali","email":"ali@test.com"}'

echo "Get Users"
curl http://localhost:5000/api/v1/users
