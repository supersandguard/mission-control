#!/bin/bash
set -e
cd "$(dirname "$0")/.."

echo "🔧 Installing backend dependencies..."
npm install --production

echo "📦 Installing frontend dependencies..."
cd frontend && npm install

echo "🏗️  Building frontend..."
# Set memory limit for ARM64 build
export NODE_OPTIONS="--max-old-space-size=512"
npx vite build

echo "✅ Build complete!"
echo ""
echo "🚀 To start the server:"
echo "   cd /home/clawdbot/clawd/mission-control"
echo "   node server.js"
echo ""
echo "🌐 Access from network: http://192.168.86.40:3333"