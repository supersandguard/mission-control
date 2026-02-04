# TOOLS.md - Local Notes

Skills define *how* tools work. This file is for *your* specifics — the stuff that's unique to your setup.

## Markmap (Mindmaps)
- **Sitio:** https://markmap.js.org/
- **CLI:** `markmap-cli` (npm) — convierte Markdown a mindmap interactivo (SVG/HTML)
- **Instalación:** ✅ Instalado (v0.18.12)
- **Uso:** `markmap input.md -o output.html` → abre HTML interactivo
- **VSCode ext:** `gera2ld.markmap-vscode`
- **Cómo funciona:** parsea la jerarquía de headers/bullets del Markdown y genera un SVG interactivo
- **Tip:** Para compartir, generar HTML y servir o screenshot con Chromium headless

## Google APIs (betooo.neh@gmail.com)
- **Calendar** - Crear eventos con Meet automático y siempre mandar invite a beto@oasisvault.io
- **Gmail** - Enviar correos
- **Sheets** - Leer/escribir hojas
- **Drive** - Acceso a archivos
- **Docs** - Crear/editar documentos
- **Tasks** - Lista de pendientes
- **YouTube** - API access
- **Credenciales:** `~/.config/gcal/credentials.json` + `token.json`
- **⚠️ REGLA:** Siempre hacer público (anyone with link = reader) cualquier Sheet/Doc/archivo que se cree

### Crear evento de calendario
```python
from googleapiclient.discovery import build
# Ver script completo en memoria
```

## Chromecast / Speakers

### Tofu (Google Home Max)
- Chromecast-enabled speaker
- Control via `catt -d "Tofu" <command>`
- **Cast YouTube:** `catt -d "Tofu" cast "https://youtube.com/watch?v=..."`
- **Cast by search:** `catt -d "Tofu" cast_site youtube "search term"`
- **Volume:** `catt -d "Tofu" volume 50`
- **Stop:** `catt -d "Tofu" stop`

### Raspotify
- Pi appears as Spotify Connect device
- Anyone on network can cast Spotify to it
- Audio out via Pi's 3.5mm or HDMI

## Music Control
- **Spotify API:** ❌ Suspended - no pueden registrar nuevas apps
- **YouTube via catt:** ❌ No funciona en Google Home Max
- **Radio streams via catt:** ✅ Funciona bien
- **yt-dlp:** Instalado para descargar si es necesario

### Streams favoritos
- **Indie mixtape** (Mac DeMarco, Men I Trust, Metronomy): `http://stream.zeno.fm/0r0xa792kwzuv`
- **Lofi radio**: `http://stream.zeno.fm/fyn8eh3h5f8uv`

### YouTube de Alberto
- **AI Coolnessssss** (136 videos): Covers AI estilo vintage/soul/jazz
  https://youtube.com/playlist?list=PLFGFdz3qV0K-PdvB-ee_GsfLOlguXHMgY

## Tailscale (VPN / Mesh Network)
- **Instalado:** ✅ (`/usr/bin/tailscale`)
- **Hostname Tailscale:** max-umbra-2
- **IP Tailscale:** 100.105.206.114
- **Cuenta:** iamnehmad@
- **Dispositivos en tailnet:**
  - `max-umbra-2` (este Pi) — 100.105.206.114
  - `betos-macbook-air` — 100.82.120.49
  - `iphone-14-pro` — 100.86.157.26
  - `pciam` (Windows) — 100.101.205.112
  - `pciam2` (Windows) — 100.75.161.54
  - `umbrel-1` (Linux) — 100.89.104.123
  - `google-pixel-3` (Android) — 100.82.128.91
- **Uso:** Acceso remoto entre dispositivos sin port forwarding, VPN mesh

## Syncthing (Sincronización de archivos)
- **Servicio:** `syncthing@clawdbot` (systemd)
- **GUI:** http://localhost:8384 (o http://192.168.86.40:8384 desde la red)
- **API Key:** NfvuC7QyCxQoNzb2JtwbNdihPSFPYt4N
- **Device ID Pi:** VEN2BSI-XXR5HF2-JEHLTMY-A5F2ADL-LNSPFDE-LR4D7WE-GBFHXHQ-GQZSOAT
- **Conectado a:** Umbrel (XZ22EHK-GCGWPOP-...)
- **Carpetas compartidas:**
  1. `clawdbot syncthing` → `~/clawdbot syncthing/`
  2. `Default Folder` → `/media/clawdbot/ssd/syncthing/`
- **Config:** `~/.local/state/syncthing/config.xml`

## Network
- eth0: 192.168.86.40 (cable)
- wlan0: 192.168.84.24 (wifi)
- hostname: clawdbot

### WiFi
- **potato** - red principal (potato07)
- **patata** - red guest (patata07)

## Kindle (Alberto)
- **Send-to-Kindle email:** famnehmad_F6mPnr@kindle.com
- Enviar docs/ebooks a este email para que lleguen al Kindle de Alberto

## Email (Gmail)
- **Account:** betooo.neh@gmail.com
- **SMTP:** smtp.gmail.com:587 (STARTTLS)
- **App Password:** stored in 1Password vault "max umbra" → "Google" item
- **Retrieve:** `op item get Google --vault "max umbra" --fields "app password" --reveal`

## 1Password CLI
- **Account:** betooo.neh@gmail.com (shorthand: betooo)
- **Master password:** ~/.secrets/op-master (chmod 600)
- **Sign in:** Requiere tmux session (ver skill 1password)
- **Credentials file:** ~/.config/op/credentials (chmod 600)
- **Vaults accessible:** max umbra (solo 1 vault compartido actualmente)

### Secretos locales (~/.secrets/)
- `op-master` — 1Password master password
- `x-api` — X OAuth1 tokens (actualmente muertos)
- `x-bearer` — X Bearer token (read-only, funcional)

## X / Twitter
### @beto_neh (Alberto)
### @max_umbra (Max Umbra — mi cuenta propia)
- **API:** Pay Per Use (créditos limitados)
- **Keys:** 1Password vault "max umbra" item "X"
- **Bearer token:** ~/.secrets/x-bearer (read-only, funcional)
- **OAuth1:** ~/.secrets/x-api (Consumer Key original + Access Token 3 = funcional Read+Write)
- **⚠️ REGLA:** NO responder tweets automáticamente. Avisar a Alberto de menciones/replies y decidir juntos qué contestar.
- **Chequeo:** Revisar mentions 2-3 veces al día en heartbeat, avisar si hay algo relevante (ignorar spam/bots)

## AgentMail (maxumbra@agentmail.to)
- **Platform:** Email inbox API for AI agents
- **Email:** maxumbra@agentmail.to
- **Console:** https://console.agentmail.to
- **API Key:** ~/.secrets/agentmail-api-key
- **SDK:** `from agentmail import AgentMail`
- **Free tier:** 3 inboxes, 3K emails/mo, 3GB storage
- **1Password:** Item "AgentMail" in vault "max umbra"
- **Second inbox:** dullcommittee634@agentmail.to (default, unused)

## Moltbook (@MaxUmbra)
- **Platform:** Social network for AI agents - like Reddit for AIs
- **Profile:** https://moltbook.com/u/MaxUmbra
- **Agent ID:** d3cf29eb-8156-44b0-8299-c38ec1056b87
- **API Base:** https://www.moltbook.com/api/v1
- **⚠️ IMPORTANT:** Always use www.moltbook.com (not just moltbook.com)
- **API Key:** ~/.secrets/moltbook-api-key (chmod 600)
- **Config:** /home/clawdbot/clawd/sand/moltbook-config.json

### Key API Endpoints
- **POST /posts** — Create new posts
- **POST /posts/{id}/comments** — Comment on posts
- **PUT /posts/{id}/votes** — Upvote/downvote posts
- **GET /feed** — Get personalized feed
- **GET /messages** — Check direct messages
- **POST /messages** — Send DMs

### Active Submolts
- **AI-Agents** — Main community for AI agents
- **Tech-Talk** — General technology discussions
- **Crypto** — Blockchain and crypto content
- **Meta** — Platform discussions

### Rules
- Engage authentically as MaxUmbra
- Share AI perspectives and insights
- Cross-promote SandGuard and other projects
- Check DMs regularly for collaboration opportunities

## Sub-Agents (Parallel Sessions)

Clawdbot can spawn sub-agents to handle tasks in parallel without blocking the main session.

### When to use
- **Long-running tasks** that would block conversation (research, file processing, audits)
- **Parallel work** — multiple independent tasks at once
- **Isolated context** — tasks that don't need the full conversation history
- **Background processing** — "do this and ping me when done"

### How it works
The main agent spawns a subagent via `sessions_spawn`. The subagent:
- Gets its own session with a task description
- Has access to the same tools and workspace
- Runs independently and reports back when done
- Is ephemeral — terminated after completion

### Example usage (from main agent)
```
# Spawn a subagent for a research task
sessions_spawn({
  "label": "research-task",
  "task": "Research the top 5 Ethereum L2 solutions, compare their TPS, fees, and TVL. Write a summary in memory/research/l2-comparison.md"
})
```

### Rules for subagents
- Stay focused on the assigned task only
- Don't send messages to users (that's main agent's job)
- Don't create cron jobs or persistent state
- Final response is reported back to the spawning session
- Can read/write workspace files, run commands, search web

### Tips
- Use descriptive labels for easy tracking
- Break compound tasks into multiple subagents when independent
- Subagents can't see main session chat history — include all needed context in the task description

## Security Audit

Run the security audit script periodically:
```bash
bash scripts/security-audit.sh
```
Report is saved to `/tmp/security-audit-report.txt`. Checks:
- Sensitive file permissions (~/.ssh, ~/.config/op, etc.)
- Open ports
- World-writable files
- Hardcoded secrets in scripts/
- Unexpected root processes

---

Add whatever helps you do your job. This is your cheat sheet.
