#!/bin/bash

# Health check script for Keycloak-Camunda SSO integration
# This script verifies all components are configured correctly

echo "==================================="
echo "Keycloak-Camunda SSO Health Check"
echo "==================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
KEYCLOAK_URL="http://localhost:8081"
CAMUNDA_URL="http://localhost:8080"
REALM="netbuild"
CLIENT_ID="camunda-identity-service"
CLIENT_SECRET="camunda-secret-change-in-production"

# Check if services are running
echo "1. Checking services..."
echo -n "   PostgreSQL: "
if docker-compose ps | grep -q "app-netbuild-postgres-1.*running"; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not running${NC}"
fi

echo -n "   Keycloak: "
if docker-compose ps | grep -q "app-netbuild-keycloak-1.*running"; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not running${NC}"
fi

echo -n "   Camunda: "
if docker-compose ps | grep -q "app-netbuild-camunda-1.*running"; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not running${NC}"
fi

# Check if Keycloak is accessible
echo ""
echo "2. Checking Keycloak accessibility..."
echo -n "   Keycloak Admin Console: "
if curl -s -f "$KEYCLOAK_URL" > /dev/null; then
    echo -e "${GREEN}✓ Accessible${NC}"
else
    echo -e "${RED}✗ Not accessible${NC}"
fi

echo -n "   NetBuild Realm: "
if curl -s -f "$KEYCLOAK_URL/realms/netbuild" > /dev/null; then
    echo -e "${GREEN}✓ Exists${NC}"
else
    echo -e "${RED}✗ Not found${NC}"
fi

# Test client credentials
echo ""
echo "3. Testing client credentials..."
echo -n "   Getting access token: "
TOKEN_RESPONSE=$(curl -s -X POST "$KEYCLOAK_URL/realms/$REALM/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=$CLIENT_ID" \
  -d "client_secret=$CLIENT_SECRET" \
  -d "grant_type=client_credentials")

if echo "$TOKEN_RESPONSE" | grep -q "access_token"; then
    echo -e "${GREEN}✓ Success${NC}"
    ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
else
    echo -e "${RED}✗ Failed${NC}"
    echo "     Error: $(echo "$TOKEN_RESPONSE" | jq -r '.error_description' 2>/dev/null || echo "$TOKEN_RESPONSE")"
fi

# Check admin API access
if [ -n "$ACCESS_TOKEN" ]; then
    echo -n "   Admin API access: "
    ADMIN_RESPONSE=$(curl -s -X GET "$KEYCLOAK_URL/admin/realms/$REALM/groups" \
      -H "Authorization: Bearer $ACCESS_TOKEN")
    
    if echo "$ADMIN_RESPONSE" | grep -q "error"; then
        echo -e "${RED}✗ Forbidden${NC}"
        echo "     Need to grant realm-management roles to service account"
    else
        echo -e "${GREEN}✓ Accessible${NC}"
    fi
fi

# Check for required roles
echo ""
echo "4. Checking Keycloak configuration..."
# Get admin token for checking configuration
ADMIN_TOKEN=$(curl -s -X POST "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=admin-cli" \
  -d "username=admin" \
  -d "password=admin" \
  -d "grant_type=password" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -n "$ADMIN_TOKEN" ]; then
    # Check roles
    echo -n "   Required roles: "
    ROLES=$(curl -s -X GET "$KEYCLOAK_URL/admin/realms/$REALM/roles" \
      -H "Authorization: Bearer $ADMIN_TOKEN")
    
    MISSING_ROLES=""
    for role in "camunda-admin" "accounting" "management" "sales"; do
        if ! echo "$ROLES" | grep -q "\"name\":\"$role\""; then
            MISSING_ROLES="$MISSING_ROLES $role"
        fi
    done
    
    if [ -z "$MISSING_ROLES" ]; then
        echo -e "${GREEN}✓ All present${NC}"
    else
        echo -e "${RED}✗ Missing:$MISSING_ROLES${NC}"
    fi
    
    # Check users
    echo -n "   Demo users: "
    USERS=$(curl -s -X GET "$KEYCLOAK_URL/admin/realms/$REALM/users" \
      -H "Authorization: Bearer $ADMIN_TOKEN")
    
    MISSING_USERS=""
    for user in "demo" "john" "mary" "peter"; do
        if ! echo "$USERS" | grep -q "\"username\":\"$user\""; then
            MISSING_USERS="$MISSING_USERS $user"
        fi
    done
    
    if [ -z "$MISSING_USERS" ]; then
        echo -e "${GREEN}✓ All present${NC}"
    else
        echo -e "${RED}✗ Missing:$MISSING_USERS${NC}"
    fi
fi

# Check Camunda
echo ""
echo "5. Checking Camunda..."
echo -n "   Camunda REST API: "
if curl -s -f "$CAMUNDA_URL/engine-rest/engine" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Accessible${NC}"
else
    echo -e "${YELLOW}⚠ Not accessible (may still be starting)${NC}"
fi

# Check for Keycloak plugin in Camunda logs
echo -n "   Keycloak plugin loaded: "
if docker logs app-netbuild-camunda-1 2>&1 | grep -q "Keycloak Identity Provider Plugin activated"; then
    echo -e "${GREEN}✓ Yes${NC}"
else
    echo -e "${RED}✗ No${NC}"
fi

# Summary
echo ""
echo "==================================="
echo "Summary"
echo "==================================="

# Check for common issues
if docker logs app-netbuild-camunda-1 2>&1 | tail -100 | grep -q "403 Forbidden"; then
    echo -e "${RED}Issue detected: 403 Forbidden error${NC}"
    echo ""
    echo "To fix this issue:"
    echo "1. Go to Keycloak Admin Console: $KEYCLOAK_URL"
    echo "2. Navigate to netbuild realm → Clients → camunda-identity-service"
    echo "3. Go to Service Account Roles tab"
    echo "4. Click 'Assign role' and filter by clients"
    echo "5. Select 'realm-management' client"
    echo "6. Add these roles: view-realm, view-users, query-groups, query-users"
    echo "7. Click Assign"
    echo "8. Restart Camunda: docker-compose restart camunda"
elif docker logs app-netbuild-camunda-1 2>&1 | tail -100 | grep -q "Unable to get access token"; then
    echo -e "${RED}Issue detected: Cannot get access token${NC}"
    echo ""
    echo "To fix this issue:"
    echo "1. Check client secret in Keycloak matches docker-compose.yml"
    echo "2. Ensure 'Service Accounts Enabled' is ON for camunda-identity-service client"
    echo "3. Ensure 'Access Type' is set to 'confidential'"
else
    echo -e "${GREEN}No major issues detected${NC}"
    echo ""
    echo "If Camunda is not running, check logs with:"
    echo "  docker logs app-netbuild-camunda-1"
fi

echo ""
echo "For detailed setup instructions, see:"
echo "  documentation/guides/KEYCLOAK_CAMUNDA_SSO_SETUP.md"