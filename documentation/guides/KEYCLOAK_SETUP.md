# Keycloak Setup Guide

## Overview

This guide walks through setting up Keycloak as the identity provider for NetBuild and Camunda integration.

## Prerequisites

- Docker and Docker Compose installed
- Ports 8081 (Keycloak) and 8080 (Camunda) available

## Quick Start

### 1. Start Services

```bash
# Stop existing containers
docker-compose down -v

# Start services with Keycloak
docker-compose up -d

# Wait for services to be ready (check logs)
docker-compose logs -f keycloak camunda
```

### 2. Configure Keycloak

Once Keycloak is running, execute the setup script:

```bash
./scripts/setup-keycloak.sh
```

This script will:
- Create the `netbuild` realm
- Configure OAuth2 clients for NetBuild and Camunda
- Create demo users (demo, john, mary, peter)
- Set up groups and permissions

### 3. Configure Environment

Update your `.env.local`:

```env
# Keycloak Configuration
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-nextauth-secret-32-chars-min
KEYCLOAK_CLIENT_ID=netbuild-app
KEYCLOAK_CLIENT_SECRET=netbuild-secret-change-in-production
KEYCLOAK_ISSUER=http://localhost:8081/realms/netbuild
```

### 4. Test Authentication

1. **Keycloak Admin Console**: http://localhost:8081/admin
   - Username: admin
   - Password: admin

2. **Test User Login**:
   - Navigate to http://localhost:3001
   - Click "Sign in with Keycloak"
   - Use demo/demo credentials

## Architecture

```
┌─────────────────┐
│   NetBuild UI   │
│   (Next.js)     │
└────────┬────────┘
         │ OAuth2/OIDC
         ▼
┌─────────────────┐      ┌─────────────────┐
│    Keycloak     │◄────►│    Camunda      │
│  (Port 8081)    │      │  (Port 8080)    │
└────────┬────────┘      └────────┬────────┘
         │                         │
         └─────────┬───────────────┘
                   │
                   ▼
         ┌─────────────────┐
         │   PostgreSQL    │
         │  (Port 5433)    │
         └─────────────────┘
```

## Demo Users

| Username | Password | Groups | Description |
|----------|----------|--------|-------------|
| demo | demo | All groups + admin | Demo admin user |
| john | john | - | Regular user |
| mary | mary | - | Regular user |
| peter | peter | - | Regular user |

## Troubleshooting

### Keycloak Won't Start
```bash
# Check logs
docker-compose logs keycloak

# Ensure database is initialized
docker-compose exec postgres psql -U postgres -c "\l"
```

### Authentication Fails
1. Check Keycloak is accessible at http://localhost:8081
2. Verify realm exists: http://localhost:8081/realms/netbuild
3. Check client configuration in Keycloak admin

### Camunda Integration Issues
```bash
# Check if Keycloak plugin loaded
docker-compose exec camunda ls /camunda/webapps/camunda/WEB-INF/lib/ | grep keycloak

# View Camunda logs
docker-compose logs camunda
```

## Next Steps

1. Configure production secrets
2. Set up SSL/TLS for production
3. Configure user roles and permissions
4. Set up automated backups
5. Configure session timeouts