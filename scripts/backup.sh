#!/bin/bash
# Daily backup to SSD
rsync -a --delete /home/clawdbot/clawd/ /media/clawdbot/ssd/backup/clawd/
rsync -a /home/clawdbot/.config/gcal/ /media/clawdbot/ssd/backup/config/gcal/
rsync -a /home/clawdbot/.config/op/ /media/clawdbot/ssd/backup/config/op/
echo "$(date): Backup completed" >> /media/clawdbot/ssd/backup/backup.log
