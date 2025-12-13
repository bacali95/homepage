#! /bin/bash

# Deploy database migrations
yarn prisma deploy

# Start the server
node dist-server/main.js