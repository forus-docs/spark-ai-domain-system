#!/bin/bash

# Script to set up Keycloak SSO for Camunda integration
# This script creates the necessary roles and users in Keycloak

set -e

KEYCLOAK_URL="${KEYCLOAK_URL:-http://localhost:8081}"
KEYCLOAK_ADMIN="${KEYCLOAK_ADMIN:-admin}"
KEYCLOAK_ADMIN_PASSWORD="${KEYCLOAK_ADMIN_PASSWORD:-admin}"
REALM="${KEYCLOAK_REALM:-netbuild}"

echo "Setting up Keycloak SSO for Camunda..."
echo "Keycloak URL: $KEYCLOAK_URL"
echo "Realm: $REALM"

# Wait for Keycloak to be ready
echo "Waiting for Keycloak to be ready..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if curl -s -f "$KEYCLOAK_URL/realms/master" > /dev/null 2>&1; then
        echo "Keycloak is ready!"
        break
    fi
    echo "Attempt $((attempt + 1))/$max_attempts: Keycloak not ready yet..."
    sleep 5
    attempt=$((attempt + 1))
done

if [ $attempt -eq $max_attempts ]; then
    echo "ERROR: Keycloak did not become ready in time!"
    exit 1
fi

# Get admin token
echo "Getting admin access token..."
TOKEN_RESPONSE=$(curl -s -X POST "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "client_id=admin-cli" \
    -d "username=$KEYCLOAK_ADMIN" \
    -d "password=$KEYCLOAK_ADMIN_PASSWORD" \
    -d "grant_type=password")

ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
    echo "ERROR: Failed to get access token!"
    echo "Response: $TOKEN_RESPONSE"
    exit 1
fi

echo "Successfully obtained access token"

# Function to create a role
create_role() {
    local role_name=$1
    echo "Creating role: $role_name"
    
    curl -s -X POST "$KEYCLOAK_URL/admin/realms/$REALM/roles" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"name\": \"$role_name\"}" || echo "Role $role_name might already exist"
}

# Function to create a user
create_user() {
    local username=$1
    local password=$2
    local roles=$3
    
    echo "Creating user: $username"
    
    # Create user
    USER_ID=$(curl -s -X POST "$KEYCLOAK_URL/admin/realms/$REALM/users" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"username\": \"$username\",
            \"enabled\": true,
            \"emailVerified\": true,
            \"firstName\": \"$username\",
            \"lastName\": \"User\",
            \"email\": \"$username@netbuild.local\",
            \"credentials\": [{
                \"type\": \"password\",
                \"value\": \"$password\",
                \"temporary\": false
            }]
        }" -i | grep -i location | cut -d'/' -f8 | tr -d '\r\n')
    
    if [ -z "$USER_ID" ]; then
        # User might already exist, try to get the user ID
        USER_ID=$(curl -s -X GET "$KEYCLOAK_URL/admin/realms/$REALM/users?username=$username" \
            -H "Authorization: Bearer $ACCESS_TOKEN" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    fi
    
    if [ -n "$USER_ID" ]; then
        echo "User ID: $USER_ID"
        
        # Assign roles
        IFS=',' read -ra ROLE_ARRAY <<< "$roles"
        for role in "${ROLE_ARRAY[@]}"; do
            echo "Assigning role $role to user $username"
            
            # Get role representation
            ROLE_JSON=$(curl -s -X GET "$KEYCLOAK_URL/admin/realms/$REALM/roles/$role" \
                -H "Authorization: Bearer $ACCESS_TOKEN")
            
            # Assign role to user
            curl -s -X POST "$KEYCLOAK_URL/admin/realms/$REALM/users/$USER_ID/role-mappings/realm" \
                -H "Authorization: Bearer $ACCESS_TOKEN" \
                -H "Content-Type: application/json" \
                -d "[$ROLE_JSON]" || echo "Failed to assign role $role"
        done
    else
        echo "Failed to create or find user $username"
    fi
}

# Create roles
echo "Creating Camunda roles..."
create_role "camunda-admin"
create_role "accounting"
create_role "management"
create_role "sales"

# Create demo users
echo "Creating demo users..."
create_user "demo" "demo" "camunda-admin"
create_user "john" "john" "sales"
create_user "mary" "mary" "accounting"
create_user "peter" "peter" "management"

echo ""
echo "Keycloak SSO setup complete!"
echo ""
echo "Created roles:"
echo "  - camunda-admin"
echo "  - accounting"
echo "  - management"
echo "  - sales"
echo ""
echo "Created users:"
echo "  - demo/demo (roles: camunda-admin)"
echo "  - john/john (roles: sales)"
echo "  - mary/mary (roles: accounting)"
echo "  - peter/peter (roles: management)"
echo ""
echo "Next steps:"
echo "1. Ensure Camunda is configured with the correct Keycloak client credentials"
echo "2. Test SSO by accessing Camunda at http://localhost:8080"
echo "3. Click 'Sign in with SSO' to authenticate via Keycloak"