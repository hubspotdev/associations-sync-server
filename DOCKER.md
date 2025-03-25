# Docker Setup for Associations Server

This document provides instructions for running the Associations Server using Docker.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Configuration

1. Create a `.env` file in the root directory with your configuration:

```
CLIENT_ID=your-client-id
CLIENT_SECRET=your-client-secret
INDUSTRY=HEALTHCARE
```

## Running with Docker Compose

### Start the Services

```bash
docker-compose up -d
```

This will start both the application and the PostgreSQL database in detached mode.

### View Logs

```bash
# View logs for all services
docker-compose logs -f

# View logs for a specific service
docker-compose logs -f app
docker-compose logs -f db
```

### Stop the Services

```bash
docker-compose down
```

To also remove the volumes (this will delete the database data):

```bash
docker-compose down -v
```

## Building and Running Manually

If you prefer to build and run the Docker containers manually:

### Build the Image

```bash
docker build -t associations-server .
```

### Run the Container

```bash
# Make sure to create a Docker network first
docker network create app-network

# Run PostgreSQL
docker run -d --name postgres \
  --network app-network \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=associations-sync \
  -p 5432:5432 \
  postgres:14-alpine

# Run the application
docker run -d --name associations-server \
  --network app-network \
  -e DATABASE_URL=postgresql://postgres:postgres@postgres:5432/associations-sync \
  -e CLIENT_ID=your-client-id \
  -e CLIENT_SECRET=your-client-secret \
  -e NODE_ENV=production \
  -p 3001:3001 \
  associations-server
```

## Accessing the Application

Once the containers are running, you can access:

- API: http://localhost:3001/api
- Swagger Documentation: http://localhost:3001/api-docs

## Docker Compose for Production

For production usage, consider:

1. Setting up a proper reverse proxy (like Nginx or Traefik)
2. Using Docker secrets for sensitive information
3. Setting up proper volume management for the database
4. Implementing backup strategies for the database volumes

## Troubleshooting

### Database Connection Issues

If the application can't connect to the database:

1. Check if the PostgreSQL container is running:
   ```bash
   docker-compose ps
   ```

2. Check PostgreSQL logs:
   ```bash
   docker-compose logs db
   ```

3. Make sure the `DATABASE_URL` environment variable is correctly set.

### Container Fails to Start

If the application container fails to start:

1. Check the application logs:
   ```bash
   docker-compose logs app
   ```

2. Try running with the `--build` flag to rebuild the images:
   ```bash
   docker-compose up --build
   ```
