# Multi-stage build for Homelab Homepage
FROM node:24-alpine AS builder

WORKDIR /app

# Enable corepack for Yarn
RUN corepack enable && corepack prepare yarn@4.11.0 --activate

# Copy package files
COPY package.json yarn.lock .yarnrc.yml* ./
COPY .yarn ./.yarn

# Install all dependencies (needed for build)
RUN yarn install --immutable

# Copy source files
COPY . .

# Build both frontend and server
RUN yarn build

# Install production dependencies only (after build, replace node_modules)
RUN yarn install --immutable --production && \
    yarn cache clean

# Production stage
FROM node:24-alpine

WORKDIR /app

# Copy built frontend and server from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server

# Copy node_modules from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Create data directory for SQLite database
RUN mkdir -p /app/data

# Expose port
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Start the server using compiled JavaScript
CMD ["node", "dist-server/index.js"]

