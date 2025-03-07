#!/bin/bash

# Install dependencies
npm install

# Build the Next.js application
npm run build

# Create build directory if it doesn't exist
mkdir -p build

# Copy the static export to build directory
cp -r .next/static build/
cp -r .next/server/app build/
cp -r .next/server/pages build/ 