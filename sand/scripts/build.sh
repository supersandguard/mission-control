#!/bin/bash
# Sand - Build script (memory-friendly for Pi)

SAND_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "🔨 Building Sand..."

# Build backend with esbuild (fast, low memory)
echo "📦 Backend..."
cd "$SAND_DIR/backend"
npx esbuild src/index.ts \
  --bundle \
  --platform=node \
  --outfile=dist/server.js \
  --format=esm \
  --external:express \
  --external:cors \
  --external:ethers \
  --external:dotenv

if [ $? -ne 0 ]; then
  echo "❌ Backend build failed"
  exit 1
fi
echo "✅ Backend built (dist/server.js)"

# Build frontend with Vite
echo "📦 Frontend..."
cd "$SAND_DIR/frontend"

# Free memory before vite build
sync && echo 3 | sudo tee /proc/sys/vm/drop_caches > /dev/null 2>&1

npx vite build

if [ $? -ne 0 ]; then
  echo "❌ Frontend build failed (try freeing memory: stop syncthing, etc.)"
  exit 1
fi
echo "✅ Frontend built (dist/)"

echo "🎉 Build complete! Run: bash scripts/start.sh"
