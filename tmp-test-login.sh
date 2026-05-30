#!/bin/bash
echo "=== Patient Login ==="
curl -s -X POST http://localhost:3001/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"Patient123!"}'

echo ""
echo ""
echo "=== Doctor Login ==="
curl -s -X POST http://localhost:3001/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@example.com","password":"Doctor123!"}'
