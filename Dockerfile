# Multi-stage Dockerfile for Associations Sync Server
# This file defines the build process for development and production environments

# ---- Base Stage ----
FROM node:20-bullseye-slim AS base
WORKDIR /app

# Install OpenSSL which is required for many Node.js applications
RUN apt-get update && apt-get install -y openssl curl && rm -rf /var/lib/apt/lists/*

# Copy package files first to leverage Docker layer caching
COPY package*.json ./

# ---- Development Stage ----
FROM base AS development
# Install all dependencies including dev dependencies for development
RUN npm install --include=dev
# Copy all source code
COPY . .
# Generate Prisma client for database access
RUN npx prisma generate
# Development entrypoint uses `npm run dev`

# ---- Builder Stage ----
FROM development AS builder
# Build the application
RUN npm run build

# ---- Dependencies Stage ----
FROM base AS deps
# Use npm ci instead of npm install for more reliable builds
# --omit=dev ensures we only install production dependencies
RUN npm ci --omit=dev

# ---- Production Stage ----
FROM node:20-bullseye-slim AS production
WORKDIR /app

# Install OpenSSL in production image
RUN apt-get update && apt-get install -y openssl curl && rm -rf /var/lib/apt/lists/*

# Copy only the necessary files from previous stages
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/types ./types

# Generate Prisma client for production
RUN npx prisma generate

# Run as non-root user for security
USER node

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start"]

# Image metadata
LABEL maintainer="HubSpot"
LABEL description="Associations Sync Server"
LABEL version="1.0"
