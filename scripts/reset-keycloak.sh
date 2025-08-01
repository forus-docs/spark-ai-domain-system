#!/bin/bash

# Reset Keycloak script - deletes realm and recreates everything

KEYCLOAK_URL="http://localhost:8081"
KEYCLOAK_ADMIN="admin"
KEYCLOAK_ADMIN_PASSWORD="admin"
REALM_NAME="netbuild"

echo "Getting admin token..."

# Get admin access token
ADMIN_TOKEN=$(curl -s -X POST "${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=${KEYCLOAK_ADMIN}" \
  -d "password=${KEYCLOAK_ADMIN_PASSWORD}" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" | jq -r '.access_token')

if [ -z "$ADMIN_TOKEN" ]; then
    echo "Failed to get admin token"
    exit 1
fi

echo "Deleting existing realm if exists..."

# Delete realm if exists
curl -s -X DELETE "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"

echo "Realm deleted. Now run ./scripts/setup-keycloak.sh to recreate everything."