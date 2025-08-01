#!/bin/bash
set -e

POSTGRES="psql --username ${POSTGRES_USER}"

echo "Creating additional databases..."

$POSTGRES <<-EOSQL
    SELECT 'CREATE DATABASE keycloak'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'keycloak')\gexec
EOSQL

echo "Databases initialization completed!"