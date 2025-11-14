#!/bin/bash
# Database initialization script
# This script applies the schema to an existing PostgreSQL database

echo "Initializing database schema..."

# Get database connection details from environment or use defaults
DB_HOST=${PG_HOST:-localhost}
DB_PORT=${PG_PORT:-5432}
DB_USER=${PG_USER:-postgres}
DB_NAME=${PG_DATABASE:-ShoppingCS-LB}

# Check if running in Docker
if [ -f /.dockerenv ]; then
    DB_HOST=${DB_HOST:-postgres}
fi

echo "Connecting to database: $DB_NAME on $DB_HOST:$DB_PORT as $DB_USER"

# Run schema.sql
PGPASSWORD=${PG_PASSWORD} psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f /server/db/schema.sql

if [ $? -eq 0 ]; then
    echo "Schema initialized successfully!"
else
    echo "Error initializing schema"
    exit 1
fi



