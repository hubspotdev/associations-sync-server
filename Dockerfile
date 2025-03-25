# Base stage for dependencies
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build stage - compile TypeScript to JavaScript
FROM base AS build
COPY . .
# Generate Prisma client before building
RUN npx prisma generate
RUN npm run build

# Production stage - only include what's necessary
FROM node:18-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Copy necessary files from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/swagger.ts ./
COPY docker-entrypoint.sh ./

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Generate Prisma client
RUN npx prisma generate

# Make the entrypoint script executable
RUN chmod +x ./docker-entrypoint.sh

# Expose the port the app runs on
EXPOSE 3001

# Set the entrypoint script
ENTRYPOINT ["./docker-entrypoint.sh"]

# Start the server
CMD ["npm", "start"]

RUN apk add --no-cache postgresql-client
