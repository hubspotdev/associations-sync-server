#!/bin/sh
set -e

# Print environment variables for debugging (password will be masked)
echo "Debugging environment:"
echo "DATABASE_URL structure: $(echo $DATABASE_URL | sed 's/:[^:@]*@/:***@/')"
echo "NODE_ENV: $NODE_ENV"
echo "POSTGRES_USER from env: $POSTGRES_USER"
echo "POSTGRES_DB from env: $POSTGRES_DB"
echo "HOSTNAME: $(hostname)"

# Wait for PostgreSQL to become available
echo "Waiting for PostgreSQL to become available..."
timeout=60
counter=0

# Simple TCP connection check first
until nc -z db 5432 || [ $counter -eq $timeout ]
do
  echo "Waiting for database connection ($counter/$timeout)..."
  sleep 1
  counter=$((counter+1))
done

if [ $counter -eq $timeout ]; then
  echo "Error: Failed to connect to database within timeout period."
  exit 1
fi

echo "Database TCP connection successful."

# Test direct database connection
echo "Testing direct PostgreSQL connection..."
if PGPASSWORD=$POSTGRES_PASSWORD psql -h db -U zradford -d docker-test-associations -c "SELECT 1" > /dev/null 2>&1; then
  echo "Direct PostgreSQL connection successful!"
else
  echo "Direct PostgreSQL connection failed. Error code: $?"
  # List available databases for debugging
  echo "Available databases:"
  PGPASSWORD=$POSTGRES_PASSWORD psql -h db -U zradford -c "\l" || echo "Could not list databases"
fi

echo "Initializing database..."

# First create the database schema
echo "Generating Prisma client..."
npx prisma generate

echo "Prisma DATABASE_URL parsing check:"
# Use a simple Node script to verify Prisma can parse the URL
node -e "
const url = process.env.DATABASE_URL;
console.log('Parsing URL:', url.replace(/(:[^:@]*@)/, ':***@'));
const parts = url.match(/postgresql:\/\/([^:]+)(:([^@]*))?@([^:\/]+)(:(\d+))?\/([^?]+)(\?(.+))?/);
if (parts) {
  console.log({
    user: parts[1],
    password: parts[3] ? '***' : 'none',
    host: parts[4],
    port: parts[6] || '5432',
    database: parts[7],
    params: parts[9] || 'none'
  });
} else {
  console.log('Failed to parse URL');
}
"

echo "Creating database schema..."
# Use db push to create tables without requiring migrations
npx prisma db push --skip-generate

# Capture the exit code to report it
DB_PUSH_RESULT=$?
if [ $DB_PUSH_RESULT -ne 0 ]; then
  echo "Error: prisma db push failed with exit code $DB_PUSH_RESULT"
fi

# Now migrations can be checked since tables exist
echo "Checking migrations..."
npx prisma migrate deploy

# Capture the exit code to report it
MIGRATE_RESULT=$?
if [ $MIGRATE_RESULT -ne 0 ]; then
  echo "Error: prisma migrate deploy failed with exit code $MIGRATE_RESULT"
fi

echo "Starting the application..."
exec "$@"
