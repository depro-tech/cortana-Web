#!/bin/bash
echo "Starting build on Render..."
npm ci --only=production
npm run build
echo "Build completed!"
