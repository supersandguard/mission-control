#!/usr/bin/env bash
# security-audit.sh — Security audit for the Clawdbot workspace
# Generates report at /tmp/security-audit-report.txt
set -uo pipefail

REPORT="/tmp/security-audit-report.txt"
HOME_DIR="$HOME"
WORKSPACE="/home/clawdbot/clawd"

exec > "$REPORT" 2>&1

echo "============================================"
echo "  CLAWDBOT SECURITY AUDIT REPORT"
echo "  $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo "============================================"
echo ""

# ─── 1. Sensitive file permissions ───
echo "## 1. Sensitive File Permissions"
echo "─────────────────────────────────"
for dir in "$HOME_DIR/.clawd-wallet" "$HOME_DIR/.config/op" "$HOME_DIR/.config/gcal" "$HOME_DIR/.ssh"; do
  if [ -d "$dir" ]; then
    echo "📁 $dir"
    find "$dir" -maxdepth 2 -type f 2>/dev/null | while IFS= read -r file; do
      perms=$(stat -c '%a' "$file" 2>/dev/null || echo "???")
      owner=$(stat -c '%U:%G' "$file" 2>/dev/null || echo "???")
      last_digit="${perms: -1}"
      if [ "$perms" = "777" ] || echo "$last_digit" | grep -qE '[2367]'; then
        echo "  🚨 WORLD-WRITABLE: $file (perms: $perms, owner: $owner)"
      elif echo "$last_digit" | grep -qE '[4-7]'; then
        echo "  ⚠️  WORLD-READABLE: $file (perms: $perms, owner: $owner)"
      else
        echo "  ✅ $file (perms: $perms, owner: $owner)"
      fi
    done
  else
    echo "📁 $dir — not found (skipped)"
  fi
  echo ""
done

# ─── 2. Open ports ───
echo "## 2. Open Ports (Listening)"
echo "─────────────────────────────"
if command -v ss &>/dev/null; then
  ss -tlnp 2>/dev/null || echo "(ss command failed)"
else
  echo "ss command not available"
fi
echo ""

# ─── 3. Files with dangerous permissions in home ───
echo "## 3. Files with 777 or World-Writable in \$HOME"
echo "──────────────────────────────────────────────────"
dangerous=$(find "$HOME_DIR" -maxdepth 3 -type f -perm 0777 \
  ! -path "*/node_modules/*" ! -path "*/.cache/*" ! -path "*/tmp/*" \
  ! -path "*/.npm/*" ! -path "*/.local/*" 2>/dev/null | head -30 || true)

if [ -n "$dangerous" ]; then
  echo "$dangerous" | while IFS= read -r f; do
    perms=$(stat -c '%a' "$f" 2>/dev/null || echo "???")
    echo "  🚨 $f (perms: $perms)"
  done
else
  echo "  ✅ No 777-permission files found."
fi
echo ""

# ─── 4. Hardcoded secrets in scripts/ ───
echo "## 4. Hardcoded Secrets Scan (scripts/)"
echo "────────────────────────────────────────"
SCRIPTS_DIR="$WORKSPACE/scripts"
if [ -d "$SCRIPTS_DIR" ]; then
  hits=$(grep -rniE 'sk_live|sk_test|secret_key|password\s*=|private_key|api_key\s*=|AKIA[0-9A-Z]{16}|ghp_[a-zA-Z0-9]{36}|xox[bporas]-' \
    "$SCRIPTS_DIR" \
    --include='*.sh' --include='*.py' --include='*.js' --include='*.ts' --include='*.env' \
    2>/dev/null || true)
  
  if [ -n "$hits" ]; then
    echo "$hits" | while IFS= read -r hit; do
      echo "  🚨 POSSIBLE SECRET: $hit"
    done
  else
    echo "  ✅ No hardcoded secrets detected in scripts."
  fi
  
  # Check for .env files
  env_files=$(find "$WORKSPACE" -maxdepth 2 -name '.env*' -type f 2>/dev/null || true)
  if [ -n "$env_files" ]; then
    echo ""
    echo "  📋 .env files found (review manually):"
    echo "$env_files" | while IFS= read -r f; do
      perms=$(stat -c '%a' "$f" 2>/dev/null || echo "???")
      echo "    - $f (perms: $perms)"
    done
  fi
else
  echo "  scripts/ directory not found."
fi
echo ""

# ─── 5. Processes running as root ───
echo "## 5. Services Running as Root (non-system)"
echo "─────────────────────────────────────────────"
root_procs=$(ps -eo user,pid,args 2>/dev/null | awk '$1 == "root"' | \
  grep -vE 'systemd|init|agetty|sshd|cron|dbus|login|udev|dhcpcd|avahi|rsyslog|kworker|migration|watchdog|ksoftirq|rcu_|irq/|kernel|ps |awk |grep |kthreadd|kdevtmpfs|netns|khungtask|oom_reap|writeback|kcompactd|crypto|kblockd|blkcg|edac|devfreq|mmc|scsi|dm_bufio|kswapd|jbd2|ext4|cpuhp|pool_|kauditd|hwrng|vchiq|cec-|card[0-9]|SMIO|blkmapd|accounts-daemon|bluetoothd|polkitd|ModemManager|NetworkManager|thermald|wpa_supplicant|cupsd|rpcbind|\[.*\]' \
  || true)

if [ -n "$root_procs" ]; then
  echo "  Review these root processes:"
  echo "$root_procs" | head -20 | while IFS= read -r proc; do
    echo "  ⚠️  $proc"
  done
else
  echo "  ✅ No unexpected root processes found."
fi
echo ""

# ─── Summary ───
CRIT_COUNT=$(grep -c '🚨' "$REPORT" 2>/dev/null || echo "0")
WARN_COUNT=$(grep -c '⚠️' "$REPORT" 2>/dev/null || echo "0")

echo "============================================"
echo "  SUMMARY"
echo "============================================"
if [ "$CRIT_COUNT" -gt 0 ]; then
  echo "  🚨 CRITICAL ISSUES: $CRIT_COUNT"
fi
if [ "$WARN_COUNT" -gt 0 ]; then
  echo "  ⚠️  WARNINGS: $WARN_COUNT"
fi
if [ "$CRIT_COUNT" -eq 0 ] && [ "$WARN_COUNT" -eq 0 ]; then
  echo "  ✅ ALL CLEAR — No security issues detected."
elif [ "$CRIT_COUNT" -eq 0 ]; then
  echo "  ⚠️  Minor warnings only — review recommended."
else
  echo "  🚨 CRITICAL ISSUES FOUND — Action required!"
fi
echo "============================================"

# Output summary to terminal too
exec >&2 2>&1
echo "Security audit complete. Report: $REPORT"
grep -cE '🚨|⚠️' "$REPORT" | head -1 || true
