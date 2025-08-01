# Keycloak-Camunda Integration Setup Guide

This guide explains how to set up Keycloak authentication for Camunda, enabling SSO and proper filter expressions.

## Prerequisites

- Docker and Docker Compose installed
- NetBuild running with Keycloak enabled
- Access to Keycloak Admin Console (http://localhost:8081/admin)

## Quick Start

1. **Start the services**:
   ```bash
   docker-compose up -d
   ```

2. **Run the setup script**:
   ```bash
   ./scripts/setup-keycloak-camunda.sh
   ```

3. **Follow the manual steps in Keycloak Admin Console**

## Manual Configuration Steps

### 1. Create Camunda Client in Keycloak

1. Access Keycloak Admin Console: http://localhost:8081/admin
2. Login with `admin/admin`
3. Navigate to **Clients** → **Create**
4. Configure the client:
   - **Client ID**: `camunda-identity-service`
   - **Client Protocol**: `openid-connect`
   - **Access Type**: `confidential`
   - **Service Accounts Enabled**: `ON`
   - **Valid Redirect URIs**: `http://localhost:8080/*`
   - **Web Origins**: `http://localhost:8080`
5. Save the client

### 2. Get Client Secret

1. Go to the **Credentials** tab of the `camunda-identity-service` client
2. Copy the **Secret** value
3. Update your `.env.local`:
   ```env
   KEYCLOAK_CAMUNDA_CLIENT_SECRET=<paste-secret-here>
   ```

### 3. Create Camunda Roles

In Keycloak, create the following roles:

1. **camunda-admin** - Full admin access to Camunda
2. **camunda-user** - Basic user access
3. **accounting** - Accounting department role
4. **management** - Management role
5. **sales** - Sales department role

### 4. Create Test Users (Optional)

For testing, create these users with appropriate roles:

| Username | Password | Roles |
|----------|----------|-------|
| demo | demo | camunda-admin |
| john | john | sales |
| mary | mary | accounting |
| peter | peter | management |

### 5. Update Docker Compose

Update the Camunda service in `docker-compose.yml` with the client secret:

```yaml
environment:
  - KEYCLOAK_CLIENT_SECRET=<your-client-secret>
```

## Rebuild and Restart

After configuration:

```bash
# Stop all services
docker-compose down

# Rebuild Camunda with Keycloak plugin
docker-compose build camunda

# Start all services
docker-compose up -d
```

## Verify Integration

1. **Check Camunda logs**:
   ```bash
   docker-compose logs -f camunda
   ```
   Look for: "Keycloak identity provider plugin activated"

2. **Test authentication**:
   - Login to NetBuild with Keycloak
   - Navigate to BPM domain
   - Open the tasklist
   - Filters should now work with expressions like `${currentUser()}`

## Troubleshooting

### Filter expressions still failing

1. Ensure Keycloak client is configured correctly
2. Check that the Camunda plugin is loaded (check logs)
3. Verify the token is being passed to Camunda API

### Authentication errors

1. Check client secret matches in all locations
2. Ensure Keycloak is accessible from Camunda container
3. Verify realm name is correct (`netbuild`)

### User not found errors

1. Ensure users exist in Keycloak
2. Check role assignments
3. Verify `useUsernameAsCamundaUserId` is set to `true`

## How It Works

1. **User logs in** to NetBuild via Keycloak
2. **NetBuild receives** OAuth2 access token
3. **API calls** to Camunda include Bearer token
4. **Camunda validates** token with Keycloak
5. **Session created** with proper user context
6. **Filter expressions** can now access `${currentUser()}`

## Development Mode

For development, you can still use Basic Auth as a fallback:

1. Set `USE_KEYCLOAK=false` in `.env.local`
2. Use the user switcher in BPM domain
3. Basic Auth will be used instead of OAuth

## Next Steps

- Configure fine-grained permissions in Keycloak
- Set up group-based access control
- Enable multi-factor authentication
- Configure token refresh policies