#!/bin/bash
echo "Starting build on Render..."

# Install dependencies
npm ci

# Fix Tailwind v4 issue
echo "Fixing Tailwind CSS v4 configuration..."
if [ -f "postcss.config.js" ]; then
  echo "Updating postcss.config.js for Tailwind v4..."
  cat > postcss.config.js << 'EOF'
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
EOF
fi

# Build
npm run build

# Check if build succeeded
if [ ! -d "dist" ]; then
  echo "Build failed: dist directory not found"
  exit 1
fi

echo "Build completed successfully!"
