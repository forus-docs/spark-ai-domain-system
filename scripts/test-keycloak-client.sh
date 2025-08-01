#!/bin/bash

# Test Keycloak client credentials
# This script tests if the camunda-identity-service client can get an access token

KEYCLOAK_URL="http://localhost:8081"
REALM="netbuild"
CLIENT_ID="camunda-identity-service"
CLIENT_SECRET="${1:-camunda-secret-change-in-production}"

echo "Testing Keycloak client credentials..."
echo "URL: $KEYCLOAK_URL"
echo "Realm: $REALM"
echo "Client ID: $CLIENT_ID"
echo ""

# Try to get an access token using client credentials
echo "Attempting to get access token..."
RESPONSE=$(curl -s -X POST "$KEYCLOAK_URL/realms/$REALM/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=$CLIENT_ID" \
  -d "client_secret=$CLIENT_SECRET" \
  -d "grant_type=client_credentials")

# Check if we got a token
if echo "$RESPONSE" | grep -q "access_token"; then
  echo "✅ SUCCESS: Got access token!"
  TOKEN=$(echo "$RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
  echo "Token (first 50 chars): ${TOKEN:0:50}..."
  
  # Try to access the admin API
  echo ""
  echo "Testing admin API access..."
  ADMIN_RESPONSE=$(curl -s -X GET "$KEYCLOAK_URL/admin/realms/$REALM/groups?search=camunda-admin" \
    -H "Authorization: Bearer $TOKEN")
  
  if echo "$ADMIN_RESPONSE" | grep -q "error"; then
    echo "❌ FAILED: Cannot access admin API"
    echo "Response: $ADMIN_RESPONSE"
  else
    echo "✅ SUCCESS: Can access admin API"
    echo "Groups found: $(echo "$ADMIN_RESPONSE" | grep -o '"name"' | wc -l)"
  fi
else
  echo "❌ FAILED: Could not get access token"
  echo "Response: $RESPONSE"
  echo ""
  echo "Possible issues:"
  echo "1. Client secret is incorrect"
  echo "2. Service accounts not enabled for the client"
  echo "3. Client not configured as 'confidential'"
fi