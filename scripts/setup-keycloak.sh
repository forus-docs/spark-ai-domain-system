#!/bin/bash

# Keycloak setup script for NetBuild
# This script configures Keycloak realm, client, and users

KEYCLOAK_URL="http://localhost:8081"
KEYCLOAK_ADMIN="admin"
KEYCLOAK_ADMIN_PASSWORD="admin"
REALM_NAME="netbuild"
CLIENT_ID="netbuild-app"
CAMUNDA_CLIENT_ID="camunda-identity-service"

echo "Waiting for Keycloak to be ready..."
until curl -s -f "${KEYCLOAK_URL}/admin/" > /dev/null; do
    echo "Waiting for Keycloak..."
    sleep 5
done

echo "Keycloak is ready. Getting admin token..."

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

echo "Creating realm: ${REALM_NAME}"

# Create realm
curl -s -X POST "${KEYCLOAK_URL}/admin/realms" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "realm": "'${REALM_NAME}'",
    "enabled": true,
    "displayName": "NetBuild",
    "loginTheme": "keycloak",
    "accessTokenLifespan": 900,
    "ssoSessionIdleTimeout": 1800,
    "ssoSessionMaxLifespan": 36000,
    "attributes": {
      "frontendUrl": "'${KEYCLOAK_URL}'/realms/'${REALM_NAME}'"
    }
  }'

echo "Creating client: ${CLIENT_ID}"

# Create NetBuild client
curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "'${CLIENT_ID}'",
    "name": "NetBuild Application",
    "enabled": true,
    "clientAuthenticatorType": "client-secret",
    "secret": "netbuild-secret-change-in-production",
    "redirectUris": ["http://localhost:3001/*"],
    "webOrigins": ["http://localhost:3001"],
    "publicClient": false,
    "protocol": "openid-connect",
    "attributes": {
      "access.token.lifespan": "900",
      "client.secret.creation.time": "'$(date +%s)'"
    }
  }'

echo "Creating Camunda client: ${CAMUNDA_CLIENT_ID}"

# Create Camunda identity service client
curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "'${CAMUNDA_CLIENT_ID}'",
    "name": "Camunda Identity Service",
    "enabled": true,
    "clientAuthenticatorType": "client-secret",
    "secret": "camunda-secret-change-in-production",
    "serviceAccountsEnabled": true,
    "authorizationServicesEnabled": false,
    "publicClient": false,
    "protocol": "openid-connect"
  }'

echo "Creating groups..."

# Create groups
for group in "accounting" "management" "sales" "camunda-admin"; do
  curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/groups" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "'${group}'"
    }'
done

echo "Creating users..."

# Create demo users
create_user() {
  local username=$1
  local fullname=$2
  local email=$3
  local password=$4
  local firstname=$(echo $fullname | cut -d' ' -f1)
  local lastname=$(echo $fullname | cut -d' ' -f2)
  
  # Create user
  curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{
      "username": "'${username}'",
      "email": "'${email}'",
      "firstName": "'${firstname}'",
      "lastName": "'${lastname}'",
      "enabled": true,
      "emailVerified": true,
      "attributes": {
        "preferred_username": ["'${username}'"]
      }
    }'
  
  # Get user ID
  USER_ID=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users?username=${username}" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq -r '.[0].id')
  
  # Set password
  curl -s -X PUT "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users/${USER_ID}/reset-password" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{
      "type": "password",
      "value": "'${password}'",
      "temporary": false
    }'
  
  echo "Created user: ${username}"
}

# Create each user
create_user "demo" "Demo User" "demo@camunda.org" "demo"
create_user "john" "John Doe" "john@camunda.org" "john"
create_user "mary" "Mary Anne" "mary@camunda.org" "mary"
create_user "peter" "Peter Meter" "peter@camunda.org" "peter"

# Assign demo user to all groups
echo "Assigning demo user to groups..."
DEMO_USER_ID=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users?username=demo" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq -r '.[0].id')

for group in "accounting" "management" "sales" "camunda-admin"; do
  GROUP_ID=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/groups?search=${group}" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq -r '.[0].id')
  
  curl -s -X PUT "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users/${DEMO_USER_ID}/groups/${GROUP_ID}" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}"
done

echo "Keycloak setup complete!"
echo ""
echo "Access Keycloak Admin Console at: ${KEYCLOAK_URL}/admin"
echo "Realm: ${REALM_NAME}"
echo "Client ID: ${CLIENT_ID}"
echo "Client Secret: netbuild-secret-change-in-production"
echo ""
echo "Update your .env.local with:"
echo "KEYCLOAK_CLIENT_SECRET=netbuild-secret-change-in-production"