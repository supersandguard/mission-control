#!/bin/bash

set -e

# Mission Control Setup Script
# This script sets up Mission Control from the skill bundle

echo "🚀 Setting up Mission Control..."

# Check if we're in the right directory
if [ ! -f "server.js" ]; then
    echo "❌ Error: server.js not found. Run this script from the Mission Control directory."
    exit 1
fi

echo "📦 Installing backend dependencies..."
npm install

echo "🎨 Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo "📁 Initializing data directory..."
if [ ! -d "data" ]; then
    mkdir data
fi

# Create default data files if they don't exist
if [ ! -f "data/agents.json" ]; then
    echo '[]' > data/agents.json
fi

if [ ! -f "data/tasks.json" ]; then
    echo '[]' > data/tasks.json
fi

if [ ! -f "data/subagents.json" ]; then
    echo '[]' > data/subagents.json
fi

if [ ! -f "data/heartbeat-checks.json" ]; then
    echo '{}' > data/heartbeat-checks.json
fi

if [ ! -f "data/preferences.json" ]; then
    echo '{"theme": "dark", "autoRefresh": true, "refreshInterval": 5000}' > data/preferences.json
fi

# Generate random auth token if not exists
if [ ! -f "data/.mc-token" ]; then
    echo "🔑 Generating auth token..."
    openssl rand -hex 32 > data/.mc-token
    chmod 600 data/.mc-token
fi

echo "✅ Setup complete!"
echo ""
echo "To start Mission Control:"
echo "  ./start.sh"
echo ""
echo "Default port: 3001"
echo "Auth token: $(cat data/.mc-token)"
echo ""
echo "🌐 Open http://localhost:3001 in your browser"