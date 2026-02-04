#!/bin/bash
# Health check script for Mission Control

cd "$(dirname "$0")/.."

echo "🏥 Mission Control Health Check"
echo "================================"
echo ""

# Check if server is running
if curl -s --fail http://localhost:3333/api/health > /dev/null; then
    echo "✅ Server is running on port 3333"
else
    echo "❌ Server is not responding"
    exit 1
fi

# Get detailed health info
echo ""
echo "📊 System Status:"
curl -s http://localhost:3333/api/health | jq '{
    status: .status,
    timestamp: .timestamp,
    gateway: .gateway,
    system: {
        cpu: .system.cpu,
        memory: .system.memory,
        disk: .system.disk,
        uptime_hours: (.system.uptime / 3600 | floor),
        gateway_status: .system.gatewayStatus
    }
}'

# Check WebSocket connection
echo ""
echo "🔌 WebSocket Test:"
if command -v wscat &> /dev/null; then
    echo "  Testing WebSocket connection..."
    echo '{"type":"ping"}' | wscat -c ws://localhost:3333 -w 2 2>/dev/null && echo "  ✅ WebSocket OK" || echo "  ⚠️  WebSocket test failed (install wscat for better testing)"
else
    echo "  ⚠️  Install wscat for WebSocket testing: npm install -g wscat"
fi

# Check log files
echo ""
echo "📁 Log Files:"
if [ -f "/tmp/mission-control.log" ]; then
    echo "  📄 /tmp/mission-control.log ($(wc -l < /tmp/mission-control.log) lines)"
    echo "  📝 Recent errors:"
    tail -5 /tmp/mission-control.log | grep -i error || echo "    No recent errors"
else
    echo "  📄 No log file found at /tmp/mission-control.log"
fi

echo ""
echo "🎯 Quick Actions:"
echo "  • Restart: ./scripts/restart.sh"
echo "  • View logs: tail -f /tmp/mission-control.log"
echo "  • Stop: pkill -f 'node server.js'"
echo "  • Web UI: http://192.168.86.40:3333"