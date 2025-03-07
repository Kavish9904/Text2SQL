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
if [ -d "out" ]; then
  # Copy all files from out directory to build
  cp -r out/* build/
elif [ -d ".next" ]; then
  # Fallback to .next directory if out doesn't exist
  cp -r .next build/
  [ -d "public" ] && cp -r public/* build/
fi 