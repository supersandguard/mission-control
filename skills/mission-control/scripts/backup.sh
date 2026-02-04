#!/bin/bash
# Backup Mission Control data

cd "$(dirname "$0")/.."

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="backups/$TIMESTAMP"

echo "💾 Creating backup: $BACKUP_DIR"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup data files
if [ -d "data" ]; then
    cp -r data/ "$BACKUP_DIR/"
    echo "✅ Data files backed up"
else
    echo "⚠️  No data directory found"
fi

# Backup configuration
cp package.json "$BACKUP_DIR/"
cp server.js "$BACKUP_DIR/"
echo "✅ Configuration files backed up"

# Create metadata
cat > "$BACKUP_DIR/backup-info.json" << EOF
{
    "timestamp": "$TIMESTAMP",
    "date": "$(date -Iseconds)",
    "version": "$(node -p "require('./package.json').version")",
    "node_version": "$(node --version)",
    "hostname": "$(hostname)",
    "backup_type": "manual"
}
EOF

echo "✅ Backup created successfully"
echo "📁 Location: $BACKUP_DIR"

# List recent backups
echo ""
echo "📚 Recent backups:"
ls -la backups/ 2>/dev/null | tail -5 || echo "   No previous backups found"

# Cleanup old backups (keep last 10)
if [ -d "backups" ]; then
    BACKUP_COUNT=$(ls -1 backups/ | wc -l)
    if [ "$BACKUP_COUNT" -gt 10 ]; then
        echo "🧹 Cleaning up old backups (keeping 10 most recent)..."
        ls -1t backups/ | tail -n +11 | xargs -I {} rm -rf backups/{}
    fi
fi

echo "💾 Backup process complete!"