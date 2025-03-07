#!/bin/bash

# Exit on error
set -e

# Install dependencies including dev dependencies
npm install

# Build the Next.js application
npm run build

# Create build directory if it doesn't exist
mkdir -p build

# Copy the static export to build directory (only if the build succeeds)
if [ -d ".next" ]; then
  cp -r .next build/
  [ -d "public" ] && cp -r public build/
  [ -d ".next/static" ] && cp -r .next/static build/
  [ -d ".next/server/app" ] && cp -r .next/server/app build/
  [ -d ".next/server/pages" ] && cp -r .next/server/pages build/
fi 