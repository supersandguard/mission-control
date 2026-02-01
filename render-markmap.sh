#!/bin/bash
# Wait for system to settle after reboot
sleep 5
# Copy files back to /tmp
cp /home/clawdbot/clawd/sombra-inline.html /tmp/
# Take screenshot with chromium
DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1000/bus \
chromium --headless --no-sandbox \
  --disable-dev-shm-usage --disable-extensions \
  --disable-gpu \
  --screenshot=/tmp/sombra-markmap-final.png \
  --window-size=1600,900 \
  "file:///tmp/sombra-inline.html"
echo "Screenshot done: $(ls -la /tmp/sombra-markmap-final.png 2>/dev/null)"
