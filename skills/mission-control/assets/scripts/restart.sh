#!/bin/bash
# Restart Mission Control server

cd "$(dirname "$0")/.."

echo "🔄 Restarting Mission Control..."

# Stop existing processes
echo "🛑 Stopping existing processes..."
pkill -f "node server.js" && echo "   Stopped server processes" || echo "   No processes to stop"

# Wait a moment for cleanup
sleep 2

# Start the server
echo "🚀 Starting server..."
node server.js &

# Wait for startup
sleep 3

# Check if it started successfully
if curl -s --fail http://localhost:3333/api/health > /dev/null; then
    echo "✅ Server restarted successfully!"
    echo "🌐 Access at: http://192.168.86.40:3333"
else
    echo "❌ Server failed to start properly"
    echo "📄 Check logs with: tail /tmp/mission-control.log"
    exit 1
fi