#!/bin/bash
# Backup diario al SSD Kingston
# Se ejecuta via cron todos los días a las 3 AM

SSD="/mnt/ssd"
BACKUP_DIR="$SSD/backup/daily"

# Verificar que el SSD esté montado
if ! mountpoint -q "$SSD" 2>/dev/null; then
    sudo mount /dev/sda2 "$SSD" 2>/dev/null
    if ! mountpoint -q "$SSD"; then
        echo "ERROR: SSD no disponible"
        exit 1
    fi
fi

mkdir -p "$BACKUP_DIR"

# Rsync incremental (solo copia lo que cambió)
rsync -a --delete /home/clawdbot/clawd/ "$BACKUP_DIR/clawd/"
rsync -a --delete /home/clawdbot/.clawdbot/ "$BACKUP_DIR/.clawdbot/"
rsync -a --delete /home/clawdbot/.config/ "$BACKUP_DIR/.config/"
rsync -a --delete /home/clawdbot/.clawd-wallet/ "$BACKUP_DIR/.clawd-wallet/"
rsync -a --delete /home/clawdbot/.foundry/ "$BACKUP_DIR/.foundry/"
rsync -a --delete /home/clawdbot/.ssh/ "$BACKUP_DIR/.ssh/"

# Guardar timestamp
date > "$BACKUP_DIR/last-backup.txt"
echo "Backup completado: $(date)"
