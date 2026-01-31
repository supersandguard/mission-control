# Setup Pi Nuevo — Guía de instalación

*Guía de disaster recovery para Raspberry Pi con Clawdbot*

---

## 12. Instalar Clawdbot

- npm install -g clawdbot
- clawdbot configure
- Vincular WhatsApp (QR)
- Verificar gateway: clawdbot status

---

## 11. Verificar red

- WiFi: potato (potato07) / patata (patata07)
- eth0 esperado: 192.168.86.x
- Verificar Tailscale: tailscale status
- Verificar Syncthing: curl localhost:8384

---

## 10. Restaurar 1Password config desde SSD

- mkdir -p ~/.config/op && chmod 700 ~/.config/op
- cp /media/clawdbot/ssd/backup/config/op/* ~/.config/op/
- Probar: op vault list

---

## 9. Configurar backup diario

- chmod +x ~/clawd/scripts/backup.sh
- crontab -e → agregar: 0 3 * * * /home/clawdbot/clawd/scripts/backup.sh
- Respalda workspace + Google creds + 1Password config al SSD

---

## 8. Instalar apt packages

- sudo apt-get install -y tmux jq
- ffmpeg y htop ya vienen con el OS

---

## 7. Instalar pip packages

- pip3 install --break-system-packages catt yt-dlp
- pip3 install --break-system-packages google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
- Agregar ~/.local/bin a PATH en ~/.bashrc

---

## 6. Restaurar Google API creds desde SSD

- mkdir -p ~/.config/gcal
- cp /media/clawdbot/ssd/backup/config/gcal/* ~/.config/gcal/
- Si el refresh token expiró: generar nuevo con script OAuth
- Probar: python3 script de test calendar

---

## 5. Instalar 1Password CLI

- Agregar repo: curl -sS https://downloads.1password.com/linux/keys/1password.asc | sudo gpg --dearmor --output /usr/share/keyrings/1password-archive-keyring.gpg
- echo 'deb [arch=arm64 signed-by=...] https://downloads.1password.com/linux/debian/arm64 stable main' | sudo tee /etc/apt/sources.list.d/1password-cli.list
- sudo apt-get update && sudo apt-get install -y 1password-cli
- op account add (necesita email, Secret Key y password)
- Cuenta: betooo.neh@gmail.com, shorthand: betooo

---

## 4. Instalar Syncthing

- sudo apt-get install -y syncthing
- sudo systemctl enable syncthing@clawdbot --now
- Cambiar GUI a 0.0.0.0:8384 en ~/.local/state/syncthing/config.xml
- Agregar Umbrel como dispositivo (auto-accept ON)
- Umbrel Device ID: XZ22EHK-GCGWPOP-TAUBRUA-UQAKW4R-LPX46KA-VTUWWCJ-4JBPXKM-0AWTEAY
- Apuntar carpeta default a /media/clawdbot/ssd/syncthing/

---

## 3. Instalar Tailscale

- curl -fsSL https://tailscale.com/install.sh | sh
- sudo tailscale up --hostname Max-Umbra-2
- Abrir link de autenticación en browser
- Verificar: tailscale status

---

## 2. Restaurar workspace desde SSD

- cp /media/clawdbot/ssd/backup/clawd/* ~/clawd/ -r
- Incluye: MEMORY.md, TOOLS.md, IDENTITY.md, SOUL.md, USER.md, HEARTBEAT.md
- Memorias en memory/, scripts en scripts/

---

## 1. Montar SSD

- Conectar SSD Kingston 960GB por USB
- sudo mkdir -p /media/clawdbot/ssd
- sudo mount /dev/sda2 /media/clawdbot/ssd
- Agregar a fstab: UUID=0763f5fd-433b-403c-8c74-795888cbde46 /media/clawdbot/ssd ext4 defaults,nofail 0 2
- Verificar con: df -h /media/clawdbot/ssd

---


*Generado el 30 de enero 2026 — Max Umbra 🖤*
