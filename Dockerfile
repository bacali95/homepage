# Multi-stage build for Homelab Homepage
FROM oven/bun:1.3.5 AS builder

WORKDIR /app

# Install build dependencies for native modules (libsql)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json bun.lock* ./

# Install all dependencies (needed for build)
RUN bun install --frozen-lockfile

# Copy source files
COPY . .

# Set dump DATABASE_URL to a dummy value
ENV DATABASE_URL=file:./data/database.sqlite

# Build both frontend and server
RUN bun run build

# Install production dependencies only (after build, replace node_modules)
RUN bun install --production --frozen-lockfile

# Production stage
FROM oven/bun:1.3.5

# Install SQLite runtime libraries for libsql
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsqlite3-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built frontend and server from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server

# Copy node_modules from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy prisma schema from builder stage
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts .

# Copy start script
COPY --from=builder /app/start.sh .
RUN chmod +x /app/start.sh

# Create data directory for SQLite database
RUN mkdir -p /app/data

# Expose port
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Start the server using compiled JavaScript
ENTRYPOINT [ "/app/start.sh" ]

