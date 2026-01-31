# Guía Completa de Instalación y Configuración de Clawdbot

## Hardware
- **Raspberry Pi 3 Model B** Rev 1.2
- **SSD:** Kingston SA400 960GB (USB, montado en /mnt/ssd)
- **Speaker:** Google Home Max "Tofu" (Chromecast)

---

## 1. Sistema Operativo
```bash
# Debian 13 (Trixie) arm64
# Raspberry Pi OS basado en Debian

# Actualizar sistema
sudo apt update && sudo apt upgrade -y
```

## 2. Node.js (v22)
```bash
# Instalar Node.js 22 via NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar
node --version  # v22.22.0
npm --version   # 10.9.4
```

## 3. Clawdbot
```bash
# Instalar globalmente
sudo npm install -g clawdbot

# Versión actual: 2026.1.24-3

# Primera configuración
clawdbot configure

# Iniciar el gateway
clawdbot gateway start

# Verificar status
clawdbot status
```

### Conectar WhatsApp
```bash
# Desde el chat o CLI, se genera QR para vincular WhatsApp
# El bot se vincula como dispositivo adicional (como WhatsApp Web)
```

### Workspace
```bash
# El workspace está en:
cd /home/clawdbot/clawd

# Es un git repo con estos archivos clave:
# AGENTS.md  - Instrucciones del agente
# SOUL.md    - Personalidad
# USER.md    - Info del usuario
# TOOLS.md   - Notas de herramientas
# IDENTITY.md - Identidad del bot
# HEARTBEAT.md - Pendientes/tareas
# MEMORY.md  - Memoria a largo plazo
# memory/    - Notas diarias
# scripts/   - Scripts utilitarios
```

---

## 4. Google APIs
```bash
# Crear proyecto en Google Cloud Console
# Habilitar APIs: Calendar, Gmail, Sheets, Drive, Docs, Tasks, YouTube

# Crear OAuth credentials (Desktop app)
# Descargar credentials.json

mkdir -p ~/.config/gcal
# Colocar credentials.json ahí

# La primera vez que se usa, se abre OAuth flow y genera token.json
# Credenciales en: ~/.config/gcal/credentials.json + token.json

# Email de servicio: umbraintention@gmail.com
```

### Paquetes Python para Google
```bash
pip3 install --break-system-packages \
  google-api-python-client \
  google-auth-httplib2 \
  google-auth-oauthlib
```

---

## 5. 1Password CLI
```bash
# Instalar
curl -sS https://downloads.1password.com/linux/keys/1password.asc | \
  sudo gpg --dearmor --output /usr/share/keyrings/1password-archive-keyring.gpg
echo "deb [arch=arm64 signed-by=/usr/share/keyrings/1password-archive-keyring.gpg] https://downloads.1password.com/linux/debian/arm64 stable main" | \
  sudo tee /etc/apt/sources.list.d/1password-cli.list
sudo apt update && sudo apt install -y 1password-cli

# Configurar cuenta
op account add --address my.1password.com --email betooo.neh@gmail.com

# Crear archivo de credenciales
mkdir -p ~/.config/op && chmod 700 ~/.config/op
cat > ~/.config/op/credentials << 'EOF'
OP_ACCOUNT=betooo
OP_EMAIL=betooo.neh@gmail.com
OP_ADDRESS=my.1password.com
EOF
chmod 600 ~/.config/op/credentials

# Iniciar sesión
echo 'MASTER_PASSWORD' | op signin --account betooo --raw
# Devuelve session token, exportar como OP_SESSION_betooo

# Vaults accesibles: Private, max umbra, Shared Fam. Nehmad
```

---

## 6. Tailscale (VPN mesh)
```bash
# Instalar
curl -fsSL https://tailscale.com/install.sh | sh

# Iniciar sesión
sudo tailscale up

# Cuenta: iamnehmad@gmail.com
# Nodos en la red:
# - max-umbra-2 (este Pi) - 100.105.206.114
# - betos-macbook-air - 100.82.120.49
# - google-pixel-3 - 100.82.128.91
# - iphone-14-pro - 100.86.157.26
# - pciam / pciam2 - Windows PCs
# - umbrel-1 - 100.89.104.123

# Verificar
tailscale status
```

---

## 7. Foundry (Ethereum toolkit)
```bash
# Instalar foundryup
curl -L https://foundry.paradigm.xyz | bash

# Instalar Foundry (forge, cast, anvil, chisel)
export PATH="$HOME/.foundry/bin:$PATH"
foundryup

# Agregar al .bashrc
echo 'export PATH="$HOME/.foundry/bin:$PATH"' >> ~/.bashrc

# Herramientas:
# cast - interactuar con contratos, enviar tx, consultar blockchain
# forge - compilar/deploy contratos
# anvil - nodo local de prueba

# Wallet del bot:
# Address: 0xCc75959A8Fa6ed76F64172925c0799ad94ab0B84
# Key guardada en: ~/.clawd-wallet/key.json
```

---

## 8. Chromecast / Música (catt)
```bash
pip3 install --break-system-packages catt

# Speaker: Tofu (Google Home Max)
catt -d "Tofu" cast "URL"        # Reproducir stream/video
catt -d "Tofu" volume 50          # Volumen
catt -d "Tofu" stop               # Parar

# Streams configurados:
# Indie mixtape: http://stream.zeno.fm/0r0xa792kwzuv
# Lofi radio:    http://stream.zeno.fm/fyn8eh3h5f8uv
```

---

## 9. Multimedia
```bash
# yt-dlp - descargar videos/audio
sudo apt install -y yt-dlp

# ffmpeg - procesamiento de audio/video
sudo apt install -y ffmpeg

# Chromium - browser headless para screenshots/automation
sudo apt install -y chromium

# pdftotext - extraer texto de PDFs
sudo apt install -y poppler-utils

# unrar - descomprimir archivos RAR
sudo apt install -y unrar
```

---

## 10. Tor (proxy anonimato)
```bash
sudo apt install -y tor

# Se usa como SOCKS proxy en 127.0.0.1:9050
# Útil para bypass de bloqueos (aunque X/Cloudflare lo bloquea también)

# Verificar
curl --socks5-hostname 127.0.0.1:9050 https://check.torproject.org/api/ip
```

---

## 11. X / Twitter API
```bash
pip3 install --break-system-packages tweepy twikit twscrape

# Developer API:
# - Registrar app en developer.x.com
# - Plan: Pay Per Use (requiere método de pago)
# - Permisos: Read and Write
# - Keys guardadas en 1Password vault "max umbra" item "X"
#   - Consumer Key + Secret
#   - Access Token + Secret (regenerar después de cambiar permisos)
#   - Bearer Token

# Nota: Cloudflare bloquea la IP del Pi para acceso web a x.com
# Solo funciona via API oficial, no scraping
```

---

## 12. Email (SMTP)
```bash
# Gmail SMTP via App Password
# Cuenta: betooo.neh@gmail.com
# SMTP: smtp.gmail.com:587 (STARTTLS)
# App Password: guardado en 1Password → vault "max umbra" → item "Google"

# Python ejemplo:
# import smtplib
# server = smtplib.SMTP('smtp.gmail.com', 587)
# server.starttls()
# server.login('betooo.neh@gmail.com', APP_PASSWORD)
```

---

## 13. Mindmaps (markmap)
```bash
# Instalar en el workspace
cd /home/clawdbot/clawd
npm install markmap-lib markmap-render markmap-common

# CLI (se instala on-demand via npx)
npx markmap-cli input.md -o output.html --no-open

# Screenshot del HTML:
chromium --headless=new --no-sandbox --disable-gpu \
  --virtual-time-budget=10000 \
  --screenshot=output.png --window-size=1600,1000 \
  "file:///path/to/output.html"
```

---

## 14. Backup automático
```bash
# SSD montado en /mnt/ssd (Kingston SA400 960GB)
sudo mount /dev/sda2 /mnt/ssd

# Script de backup: /home/clawdbot/clawd/scripts/backup-ssd.sh
# Cron: todos los días a las 3 AM
# crontab -e:
0 3 * * * /home/clawdbot/clawd/scripts/backup-ssd.sh >> /home/clawdbot/clawd/scripts/backup.log 2>&1

# Respalda: clawd/, .clawdbot/, .config/, .clawd-wallet/, .foundry/, .ssh/
```

---

## 15. Syncthing (sincronización de archivos)
```bash
# Instalar
sudo apt install -y syncthing

# Habilitar como servicio del usuario clawdbot
sudo systemctl enable syncthing@clawdbot
sudo systemctl start syncthing@clawdbot

# Versión: v1.29.5
# GUI: http://localhost:8384 (o http://192.168.86.40:8384 desde la red)
# API Key: NfvuC7QyCxQoNzb2JtwbNdihPSFPYt4N

# Device ID del Pi:
# VEN2BSI-XXR5HF2-JEHLTMY-A5F2ADL-LNSPFDE-LR4D7WE-GBFHXHQ-GQZSOAT

# Dispositivos conectados:
# - clawdbot (este Pi)
# - umbrel (XZ22EHK-GCGWPOP-...)

# Carpetas compartidas:
# 1. "clawdbot syncthing" → ~/clawdbot syncthing/
# 2. "Default Folder" → /media/clawdbot/ssd/syncthing/

# Config: ~/.local/state/syncthing/config.xml
```

## 16. Red
```bash
# Interfaces:
# eth0: 192.168.86.40 (cable - red principal)
# wlan0: 192.168.84.24 (wifi)
# Tailscale: 100.105.206.114

# WiFi configurado:
# SSID: potato (password: potato07)
# SSID: patata (password: patata07) - guest

# Hostname: clawdbot
```

---

## Resumen de cuentas y servicios

| Servicio | Cuenta | Notas |
|----------|--------|-------|
| WhatsApp | Vinculado al cel de Alberto | Gateway de Clawdbot |
| Google APIs | umbraintention@gmail.com | Calendar, Gmail, Drive, etc |
| 1Password | betooo.neh@gmail.com | CLI configurado |
| Tailscale | iamnehmad@gmail.com | VPN mesh |
| X/Twitter | @beto_neh | API Developer (Pay Per Use) |
| Gmail SMTP | betooo.neh@gmail.com | App password en 1Password |
| Ethereum | 0xCc75...0B84 | Wallet del bot |

---

## Pendientes de configurar
- [ ] Spotify (librespot / spotify_player)
- [ ] X API créditos (agregar método de pago)
- [ ] SSH al Umbrel (para exit node / proxy)
- [ ] Brave Search API key (para web_search)
