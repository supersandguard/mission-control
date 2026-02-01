#!/bin/bash
# Sand - Transaction Firewall PWA
# Start backend API + frontend static server

SAND_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$SAND_DIR/backend"
FRONTEND_DIST="$SAND_DIR/frontend/dist"

# Colors
GREEN='\033[0;32m'
NC='\033[0m'

echo "🛡️  Starting Sand..."

# Kill existing
pkill -f "node.*sand.*server.js" 2>/dev/null
pkill -f "python3.*http.server.*3000" 2>/dev/null
sleep 1

# Start backend
if [ -f "$BACKEND_DIR/dist/server.js" ]; then
  cd "$BACKEND_DIR"
  nohup node dist/server.js > /tmp/sand-api.log 2>&1 &
  echo -e "${GREEN}✓${NC} Backend API started (port 3001)"
else
  echo "⚠️  Backend not built. Run: cd $BACKEND_DIR && npx esbuild src/index.ts --bundle --platform=node --outfile=dist/server.js --format=esm --external:express --external:cors --external:ethers --external:dotenv"
fi

# Start frontend
if [ -d "$FRONTEND_DIST" ]; then
  cd "$FRONTEND_DIST"
  nohup python3 -m http.server 3000 --bind 0.0.0.0 > /dev/null 2>&1 &
  echo -e "${GREEN}✓${NC} Frontend started (port 3000)"
else
  echo "⚠️  Frontend not built. Run: cd $SAND_DIR/frontend && npx vite build"
fi

echo "🛡️  Sand ready!"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
