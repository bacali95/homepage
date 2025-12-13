#!/bin/sh

# Deploy database migrations
./node_modules/.bin/prisma migrate deploy

# Start the server
node ./dist-server/server/main.js