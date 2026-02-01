#!/bin/bash
# SandGuard Deploy Script
# Builds frontend and deploys to Netlify via API

set -e

NETLIFY_TOKEN="nfp_JEaYgYAAmEvtXmojEamaJwA6b9RYVbyC1156"
SITE_ID="8e92c2c6-7e03-4f35-a19f-001252b97436"
FRONTEND_DIR="$(dirname "$0")/frontend"
DIST_DIR="$FRONTEND_DIR/dist"

echo "🛡️  SandGuard Deploy"
echo "==================="

# Build frontend
echo "📦 Building frontend..."
cd "$FRONTEND_DIR"
rm -rf dist
NODE_OPTIONS="--max-old-space-size=256" npx vite build

# Add Netlify config files
cat > "$DIST_DIR/_redirects" << 'EOF'
/*      /index.html     200
EOF

cat > "$DIST_DIR/_headers" << 'EOF'
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
/assets/*
  Cache-Control: public, max-age=31536000, immutable
EOF

# Compute file digests
echo "🔑 Computing digests..."
cd "$DIST_DIR"
DIGEST_JSON=$(python3 -c "
import hashlib, os, json
files = {}
for root, dirs, filenames in os.walk('.'):
    for f in filenames:
        path = os.path.join(root, f)
        rel = path[1:]
        with open(path, 'rb') as fh:
            sha1 = hashlib.sha1(fh.read()).hexdigest()
        files[rel] = sha1
print(json.dumps({'files': files}))
")

# Create deploy
echo "🚀 Creating deploy..."
DEPLOY_ID=$(curl -sS "https://api.netlify.com/api/v1/sites/$SITE_ID/deploys" \
  -H "Authorization: Bearer $NETLIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$DIGEST_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))")

echo "   Deploy ID: $DEPLOY_ID"

# Upload files
echo "📤 Uploading files..."
for f in $(find "$DIST_DIR" -type f | sort); do
  rel="${f#$DIST_DIR}"
  code=$(curl -sS -X PUT -o /dev/null -w "%{http_code}" \
    "https://api.netlify.com/api/v1/deploys/$DEPLOY_ID/files$rel" \
    -H "Authorization: Bearer $NETLIFY_TOKEN" \
    -H "Content-Type: application/octet-stream" \
    --data-binary "@$f")
  echo "   $rel → $code"
done

# Wait for ready
sleep 3
STATE=$(curl -sS "https://api.netlify.com/api/v1/deploys/$DEPLOY_ID" \
  -H "Authorization: Bearer $NETLIFY_TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin).get('state',''))")

echo ""
echo "✅ Deploy $STATE"
echo "🌐 https://supersandguard.com"
echo "🌐 https://sandguard.netlify.app"
