# KEYCLOAK_INTEGRATION_GUIDE.md

## Overview

This document outlines the integration of Keycloak with NetBuild and Camunda to enable proper authentication and authorization, particularly for Camunda filter expressions that require authenticated sessions.

## Why Keycloak?

### Current Authentication Limitations

Our current implementation uses HTTP Basic Authentication for Camunda REST API calls, which has critical limitations:

1. **No Session Context**: Basic Auth doesn't create server-side sessions
2. **Filter Expression Failures**: Expressions like `${currentUser()}` and `${currentUserGroups()}` fail
3. **Error Messages**: "Unable to invoke method 'taskAssignee'" when executing filters
4. **Security Concerns**: Credentials sent with every request

### Keycloak Solutions

Keycloak provides enterprise-grade authentication that solves these issues:

1. **OAuth2/OIDC Tokens**: Proper session management
2. **Single Sign-On (SSO)**: Unified authentication across applications
3. **User Federation**: Centralized user and group management
4. **Token-Based Security**: More secure than Basic Auth

## Architecture

### Current Architecture (Limited)
```
Client → Basic Auth → Camunda REST API
         ↓
         ❌ No session context for filter expressions
```

### Target Architecture with Keycloak
```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser Client                            │
├─────────────────────────────────────────────────────────────────┤
│                   NetBuild UI (Next.js 14)                       │
│             OAuth2 Login Flow • Token Management                 │
├─────────────────────────────────────────────────────────────────┤
│                    Keycloak (Port 8081)                          │
│         User Auth • Token Issuance • User Federation            │
├─────────────────────────────────────────────────────────────────┤
│                  NetBuild API Gateway                            │
│          Token Validation • Session Propagation                  │
├─────────────────────────────────────────────────────────────────┤
│              Camunda 7 Engine (Port 8080)                        │
│    Process Engine • Identity Service • Task Management           │
│              With Keycloak Plugin Installed                      │
├─────────────────────────────────────────────────────────────────┤
│              PostgreSQL (Port 5433)                              │
│         Camunda DB • Keycloak DB (separate schemas)             │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Plan

### Phase 1: Infrastructure Setup

#### 1.1 Update Docker Compose

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_MULTIPLE_DATABASES: camunda,keycloak
    ports:
      - "5433:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-databases.sh:/docker-entrypoint-initdb.d/init-databases.sh

  keycloak:
    image: quay.io/keycloak/keycloak:24.0
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres:5432/keycloak
      KC_DB_USERNAME: postgres
      KC_DB_PASSWORD: postgres
      KC_HTTP_PORT: 8081
    ports:
      - "8081:8081"
    depends_on:
      - postgres
    command: start-dev --http-port=8081

  camunda:
    image: camunda/camunda-bpm-platform:7.20.0
    environment:
      DB_DRIVER: org.postgresql.Driver
      DB_URL: jdbc:postgresql://postgres:5432/camunda
      DB_USERNAME: postgres
      DB_PASSWORD: postgres
      # Keycloak integration environment variables
      KEYCLOAK_URL: http://keycloak:8081
      KEYCLOAK_REALM: netbuild
    ports:
      - "8080:8080"
    depends_on:
      - postgres
      - keycloak
    volumes:
      - ./camunda-config:/camunda/configuration/userlib

volumes:
  postgres_data:
```

#### 1.2 Database Initialization Script

Create `scripts/init-databases.sh`:
```bash
#!/bin/bash
set -e

POSTGRES="psql --username ${POSTGRES_USER}"

echo "Creating databases..."

$POSTGRES <<-EOSQL
    CREATE DATABASE camunda;
    CREATE DATABASE keycloak;
EOSQL

echo "Databases created!"
```

### Phase 2: Keycloak Configuration

#### 2.1 Realm Setup

1. Access Keycloak Admin Console: http://localhost:8081
2. Create new realm: `netbuild`
3. Configure realm settings:
   - Display name: "NetBuild"
   - Login theme: Custom (optional)
   - Token lifespans: Match current JWT settings

#### 2.2 Client Configuration

Create OAuth2 client for NetBuild:
- Client ID: `netbuild-app`
- Client Protocol: `openid-connect`
- Access Type: `confidential`
- Valid Redirect URIs: 
  - `http://localhost:3001/*`
  - `http://localhost:3001/auth/callback`
- Web Origins: `http://localhost:3001`

#### 2.3 User Migration

Import existing Camunda demo users:
1. Create users: demo, john, mary, peter
2. Set passwords
3. Map to appropriate groups
4. Configure roles

#### 2.4 Group Mapping

Create groups matching Camunda:
- accounting
- management
- sales
- camunda-admin

### Phase 3: Camunda Integration

#### 3.1 Install Keycloak Plugin

Add to `camunda-config/` directory:
- `camunda-bpm-identity-keycloak-7.20.0.jar`
- Configuration in `bpm-platform.xml`

#### 3.2 Configure Identity Provider

```xml
<process-engine name="default">
  <plugins>
    <plugin>
      <class>org.camunda.bpm.extension.keycloak.plugin.KeycloakIdentityProviderPlugin</class>
      <properties>
        <property name="keycloakIssuerUrl">http://keycloak:8081/realms/netbuild</property>
        <property name="keycloakAdminUrl">http://keycloak:8081/admin/realms/netbuild</property>
        <property name="clientId">camunda-identity-service</property>
        <property name="clientSecret">${env:KEYCLOAK_CLIENT_SECRET}</property>
        <property name="useUsernameAsCamundaUserId">true</property>
        <property name="useGroupPathAsCamundaGroupId">true</property>
      </properties>
    </plugin>
  </plugins>
</process-engine>
```

### Phase 4: NetBuild Application Updates

#### 4.1 Install Dependencies

```bash
npm install next-auth @auth/keycloak-adapter
```

#### 4.2 NextAuth Configuration

Create `app/api/auth/[...nextauth]/route.ts`:
```typescript
import NextAuth from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

export const authOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER!,
    })
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

#### 4.3 Update API Calls

Modify Camunda API calls to use Bearer tokens:
```typescript
const response = await fetch(`${CAMUNDA_BASE_URL}/filter/${filterId}/list`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.accessToken}`,
  },
  body: JSON.stringify(requestBody),
});
```

### Phase 5: Migration Strategy

#### 5.1 Parallel Operation

1. Keep Basic Auth working for development
2. Add Keycloak auth as optional
3. Test thoroughly with both methods
4. Gradually migrate features

#### 5.2 Feature Flags

```typescript
const USE_KEYCLOAK = process.env.NEXT_PUBLIC_USE_KEYCLOAK === 'true';

if (USE_KEYCLOAK) {
  // Use OAuth2 flow
} else {
  // Use current Basic Auth
}
```

#### 5.3 User Migration

1. Export users from MongoDB
2. Import into Keycloak
3. Map permissions and groups
4. Test authentication flow

## Configuration Reference

### Environment Variables

```env
# Keycloak Configuration
KEYCLOAK_URL=http://localhost:8081
KEYCLOAK_REALM=netbuild
KEYCLOAK_CLIENT_ID=netbuild-app
KEYCLOAK_CLIENT_SECRET=<generate-secure-secret>
KEYCLOAK_ISSUER=http://localhost:8081/realms/netbuild

# Camunda Keycloak Plugin
KEYCLOAK_CAMUNDA_CLIENT_ID=camunda-identity-service
KEYCLOAK_CAMUNDA_CLIENT_SECRET=<generate-secure-secret>

# Feature Flags
USE_KEYCLOAK=false  # Set to true when ready
```

### Keycloak Endpoints

- Admin Console: http://localhost:8081/admin
- Account Console: http://localhost:8081/realms/netbuild/account
- OpenID Configuration: http://localhost:8081/realms/netbuild/.well-known/openid-configuration

## Testing Plan

### 1. Authentication Flow
- [ ] User can login via Keycloak
- [ ] Tokens are properly stored
- [ ] Token refresh works
- [ ] Logout clears session

### 2. Camunda Integration
- [ ] Filter expressions work (`${currentUser()}`)
- [ ] Group-based filters work
- [ ] Task assignment respects permissions
- [ ] Process instantiation with user context

### 3. API Security
- [ ] All endpoints validate tokens
- [ ] Expired tokens are rejected
- [ ] Token refresh flow works
- [ ] CORS properly configured

## Troubleshooting

### Common Issues

1. **Filter Still Failing**: Ensure Camunda has Keycloak plugin installed
2. **Token Validation Errors**: Check Keycloak issuer URL
3. **CORS Issues**: Update Keycloak and NetBuild CORS settings
4. **User Not Found**: Verify user exists in both systems

### Debug Steps

1. Check Keycloak logs: `docker-compose logs keycloak`
2. Verify token contents: Use jwt.io
3. Test Camunda identity service: Check user endpoint
4. Validate plugin loading: Check Camunda startup logs

## Future Enhancements

1. **Multi-Tenancy**: Leverage Keycloak realms
2. **Fine-Grained Permissions**: Use Keycloak authorization services
3. **Social Login**: Add Google, GitHub providers
4. **MFA Support**: Enable two-factor authentication

## References

- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [Camunda Keycloak Plugin](https://github.com/camunda-community-hub/camunda-bpm-identity-keycloak)
- [NextAuth.js Keycloak](https://next-auth.js.org/providers/keycloak)
- [OAuth2 Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)