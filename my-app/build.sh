#!/bin/bash

# Install dependencies
npm install

# Build the Next.js application
npm run build

# Create build directory if it doesn't exist
mkdir -p build

# Copy the .next directory to build
cp -r .next build/

# Copy package.json and other necessary files
cp package.json build/
cp package-lock.json build/
cp next.config.js build/

# Create a start script
echo '#!/bin/bash
cd build
npm install --production
npm run start' > build/start.sh

# Make the start script executable
chmod +x build/start.sh 