#!/bin/sh

# Deploy database migrations
bunx prisma migrate deploy

# Start the server
bun --bun ./dist-server/server/main.js