# Keycloak-Camunda SSO Integration Setup Guide

This guide documents the complete setup process for integrating Keycloak Single Sign-On (SSO) with Camunda BPM Platform 7.20.0 in the NetBuild application.

## Overview

The integration enables:
- Single Sign-On across NetBuild and Camunda applications
- Centralized user and role management in Keycloak
- OAuth2/OIDC authentication for Camunda filters and expressions
- Elimination of duplicate login prompts

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   NetBuild UI (Next.js 14)                       │
│  Chat Interface • Domain Management • Real-time Updates          │
├─────────────────────────────────────────────────────────────────┤
│                      Keycloak Auth Layer                         │
│      OAuth2/OIDC • Token Management • User Federation           │
├─────────────────────────────────────────────────────────────────┤
│                      API Gateway Layer                           │
│    Token Validation • Session Creation • Context Propagation     │
├─────────────────────────────────────────────────────────────────┤
│     Camunda 7 Services          │        NetBuild Services      │
│  • Process Engine               │   • WebSocket Server          │
│  • Identity Service             │   • AI Integration            │
│  • Task Management              │   • Chat Orchestration        │
│  • BPMN Execution               │   • Event Bridge              │
├─────────────────────────────────┴───────────────────────────────┤
│                    PostgreSQL Database                           │
│         Unified storage for all workflow and app data            │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

- Docker and Docker Compose installed
- Port 8081 available for Keycloak
- Port 8080 available for Camunda
- Port 5433 available for PostgreSQL

## Setup Process

### 1. Build Custom Camunda Image

The standard Camunda image doesn't include the Keycloak plugin. We created a custom image:

```dockerfile
# docker/camunda/Dockerfile
FROM camunda/camunda-bpm-platform:7.20.0

USER root

# Install required tools
RUN apk add --no-cache wget gettext

# Download Keycloak plugin with all dependencies
RUN mkdir -p /camunda/lib
RUN wget -O /camunda/lib/camunda-platform-7-keycloak-all-7.20.0.jar \
    https://repo1.maven.org/maven2/org/camunda/bpm/extension/camunda-platform-7-keycloak-all/7.20.0/camunda-platform-7-keycloak-all-7.20.0.jar

# Copy configuration files
COPY bpm-platform.xml.template /camunda/conf/bpm-platform.xml.template
COPY startup.sh /camunda/startup.sh

# Set permissions
RUN chmod +x /camunda/startup.sh && \
    chown -R camunda:camunda /camunda/lib /camunda/conf /camunda/startup.sh

USER camunda

CMD ["/camunda/startup.sh"]
```

### 2. Configure Camunda for Keycloak

The `bpm-platform.xml.template` configures the Keycloak plugin:

```xml
<plugin>
  <class>org.camunda.bpm.extension.keycloak.plugin.KeycloakIdentityProviderPlugin</class>
  <properties>
    <property name="keycloakIssuerUrl">${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}</property>
    <property name="keycloakAdminUrl">${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}</property>
    <property name="clientId">${KEYCLOAK_CLIENT_ID}</property>
    <property name="clientSecret">${KEYCLOAK_CLIENT_SECRET}</property>
    <property name="useUsernameAsCamundaUserId">true</property>
    <property name="administratorGroupName">camunda-admin</property>
    <property name="disableSSLCertificateValidation">true</property>
  </properties>
</plugin>
```

### 3. Docker Compose Configuration

```yaml
services:
  postgres:
    image: postgres:15-alpine
    ports:
      - "5433:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=camunda
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-databases.sh:/docker-entrypoint-initdb.d/init-databases.sh
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  keycloak:
    image: quay.io/keycloak/keycloak:24.0
    ports:
      - "8081:8081"
    environment:
      - KEYCLOAK_ADMIN=admin
      - KEYCLOAK_ADMIN_PASSWORD=admin
      - KC_DB=postgres
      - KC_DB_URL=jdbc:postgresql://postgres:5432/keycloak
      - KC_DB_USERNAME=postgres
      - KC_DB_PASSWORD=postgres
      - KC_HTTP_PORT=8081
      - KC_HOSTNAME_STRICT=false
      - KC_HOSTNAME_STRICT_HTTPS=false
      - KC_HTTP_ENABLED=true
    command: start-dev --http-port=8081
    depends_on:
      postgres:
        condition: service_healthy

  camunda:
    build:
      context: ./docker/camunda
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      - DB_DRIVER=org.postgresql.Driver
      - DB_URL=jdbc:postgresql://postgres:5432/camunda
      - DB_USERNAME=postgres
      - DB_PASSWORD=postgres
      - DB_SCHEMA_UPDATE=true
      - KEYCLOAK_URL=http://keycloak:8081
      - KEYCLOAK_REALM=netbuild
      - KEYCLOAK_CLIENT_ID=camunda-identity-service
      - KEYCLOAK_CLIENT_SECRET=camunda-secret-change-in-production
    depends_on:
      postgres:
        condition: service_healthy
      keycloak:
        condition: service_started
```

### 4. Environment Configuration

Create `.env.local` with:

```env
# Keycloak Configuration
KEYCLOAK_URL=http://localhost:8081
KEYCLOAK_REALM=netbuild
KEYCLOAK_CLIENT_ID=netbuild-app
KEYCLOAK_CLIENT_SECRET=<actual-secret-from-keycloak>
KEYCLOAK_ISSUER=http://localhost:8081/realms/netbuild
KEYCLOAK_CAMUNDA_CLIENT_SECRET=<actual-secret-for-camunda-client>

# NextAuth
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=<32+ character secret>
USE_KEYCLOAK=true
NEXT_PUBLIC_USE_KEYCLOAK=true
```

### 5. Start Services

```bash
# Build the custom Camunda image
docker-compose build camunda

# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### 6. Configure Keycloak

Run the setup script to create roles and users:

```bash
./scripts/setup-keycloak-sso.sh
```

This script creates:
- **Roles**: camunda-admin, accounting, management, sales
- **Users**: 
  - demo/demo (camunda-admin role)
  - john/john (sales role)
  - mary/mary (accounting role)
  - peter/peter (management role)

### 7. Manual Keycloak Configuration

If the script fails or you prefer manual setup:

1. Access Keycloak Admin Console: http://localhost:8081
2. Login with admin/admin
3. Navigate to the netbuild realm

#### Create Clients

1. **camunda-identity-service** client:
   - Client Protocol: openid-connect
   - Access Type: confidential
   - Valid Redirect URIs: http://localhost:8080/*
   - Web Origins: http://localhost:8080

2. **netbuild-app** client:
   - Client Protocol: openid-connect
   - Access Type: confidential
   - Valid Redirect URIs: http://localhost:3001/*
   - Web Origins: http://localhost:3001

#### Create Roles
1. Go to Roles → Add Role
2. Create: camunda-admin, accounting, management, sales

#### Create Users
1. Go to Users → Add User
2. Create users with credentials and assign roles

## Troubleshooting

### Common Issues

1. **Camunda fails to start with "clientId is mandatory" error**
   - Ensure environment variables are properly set
   - Check that the startup.sh script is executable
   - Verify envsubst is processing the template correctly

2. **"historyLevel mismatch" error**
   - Add `<property name="history">full</property>` to bpm-platform.xml
   - Or clear the Camunda database tables

3. **Connection refused to Keycloak**
   - Keycloak takes time to start up
   - Check Keycloak is running: `docker-compose ps`
   - Verify Keycloak is accessible: `curl http://localhost:8081`

4. **Health check failures**
   - Keycloak image doesn't include curl
   - Updated health check uses TCP connection test instead

### Debugging Commands

```bash
# Check if Keycloak is ready
curl http://localhost:8081/realms/master

# View Camunda configuration
docker exec app-netbuild-camunda-1 cat /camunda/conf/bpm-platform.xml

# Check environment variables
docker inspect app-netbuild-camunda-1 | grep -A 20 '"Env"'

# Test Camunda API
curl -u demo:demo http://localhost:8080/engine-rest/engine

# View detailed logs
docker-compose logs camunda --tail=200
```

## Verification

### 1. Test Camunda SSO

1. Access Camunda: http://localhost:8080
2. Click "Sign in with SSO"
3. Should redirect to Keycloak login
4. Login with demo/demo
5. Should redirect back to Camunda authenticated

### 2. Test Filter Expressions

Filters with expressions like `${currentUser()}` should now work correctly with the authenticated session context.

### 3. Test NetBuild Integration

1. Access NetBuild: http://localhost:3001
2. Navigate to BPM domain
3. Switch between demo users
4. Verify task lists load correctly

## Security Considerations

1. **Change default passwords** in production
2. **Use HTTPS** for all services
3. **Configure proper CORS** settings
4. **Rotate client secrets** regularly
5. **Enable SSL certificate validation** in production

## Migration from Basic Auth

The system previously used HTTP Basic Auth which couldn't support Camunda filter expressions. The Keycloak integration provides:

- Proper session context for expressions
- Single Sign-On across applications
- Centralized user management
- Token-based authentication
- Support for all Camunda features

## Next Steps

1. Configure Camunda Cockpit and Admin apps for SSO
2. Implement group-based authorization
3. Add custom claims for domain membership
4. Enable automated user provisioning
5. Implement proper token refresh logic