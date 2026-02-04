#!/bin/bash
# Development startup script with hot reload

cd "$(dirname "$0")/.."

echo "🛠️  Starting Mission Control in development mode..."
echo "📍 Directory: $(pwd)"
echo "🌐 URL: http://localhost:3333"
echo "📱 Network: http://192.168.86.40:3333"
echo ""

# Check if nodemon is available, install if not
if ! command -v npx &> /dev/null; then
    echo "⚠️  npx not available, falling back to node"
    node server.js
else
    # Use nodemon for hot reload if available
    npx nodemon server.js
fi