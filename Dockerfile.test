# Multi-stage build for Homelab Homepage
FROM oven/bun:1.3.5 AS dependencies

WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install all dependencies (needed for build)
RUN bun install --frozen-lockfile --production

# Production stage
FROM oven/bun:1.3.5

# Install SQLite runtime libraries for libsql
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsqlite3-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built frontend and server from builder stage
COPY ./dist ./dist
COPY ./dist-server ./dist-server

# Copy node_modules from builder stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy prisma schema from builder stage
COPY ./prisma ./prisma
COPY ./prisma.config.ts .

# Copy start script
COPY ./start.sh .
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

