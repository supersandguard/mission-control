# MEMORY.md - Long-Term Memory

## 🔑 Mis Accesos y Cuentas

### Google (umbraintention@gmail.com)
- **Gmail** - Puedo enviar correos
- **Google Calendar** - Crear eventos con Meet automático
- **Google Sheets** - Acceso completo
- **Google Drive** - Acceso completo
- **Google Docs** - Acceso completo
- **Google Tasks** - Lista de pendientes
- **YouTube** - Acceso API
- **Credenciales:** `~/.config/gcal/credentials.json` y `token.json`

### 1Password
- **Cuenta:** umbraintention@gmail.com
- **CLI:** `op` instalado y funcionando
- **Comando:** `op signin --account betooo`
- **Vaults:** Private, max umbra, Shared Fam. Nehmad

### Email de Alberto
- **Principal:** beto@oasisvault.io
- **Personal:** betooo.neh@gmail.com

## 🖥️ Hardware

### Raspberry Pi (clawdbot)
- **IP eth0:** 192.168.86.40
- **IP wlan0:** 192.168.84.24
- **SD actual:** La que vino con el Pi
- **SD nueva:** SanDisk High Endurance 256GB (llega martes 2026-01-30)

### Chromecast/Audio
- **Tofu:** Google Home Max (catt -d "Tofu")
- **Raspotify:** Spotify Connect habilitado

### Impresora
- **Epson L5590** - Configurada y funcionando

## 📱 Contactos Importantes

### Familia
- **Lydia Dabbah** - Esposa de Alberto - lydiadabbah@gmail.com
- **Papá de Alberto** - zurisi@hotmail.com

### Adela Carmona Reyes
- **Tel:** +52 55 1699 3609
- **Email:** adela@brick.mx

## 🏢 Ubicaciones

### Oficina de Alberto
Bosque de Duraznos 65, oficina 107B
Bosque de las Lomas, Miguel Hidalgo
11700 Ciudad de México, CDMX

## 🗓️ Cron Jobs Activos
- **9:00 AM** - Resumen de pendientes
- **9:00 PM** - Resumen de pendientes

## 💰 Crypto/Blockchain

### Wallet del Bot
- **Address:** `0xCc75959A8Fa6ed76F64172925c0799ad94ab0B84`
- **Key:** `~/.clawd-wallet/key.json`
- **Tools:** Foundry (cast) en `~/.foundry/bin/`

### Wallets de Alberto
- **EOA principal:** `0xfd20df09db039286e54670a4f32e99fbc51a146d` (wallet operativa OTC)
- **Safe multisig:** `0x32B8057a9213C1060Bad443E43F33FaB9A7e9EC7`
- Usa Morpho/Steakhouse para yield USDC, 1inch para swaps, consolida al Safe

### NFTs
- Signal Boards #284 (Stina Jones, Art Blocks) — minteado por mí, transferido a Alberto

### Lecciones Onchain
- Art Blocks V3 minters: `purchase(uint256,address)` con core contract address
- Safe/multisig necesita >21000 gas para recibir ETH
- Hasura API de Art Blocks: `artblocks-mainnet.hasura.app/v1/graphql`

## 🐦 X / Twitter (@beto_neh)
- Developer API registrada (Pay Per Use — necesita agregar créditos)
- Keys en 1Password vault "max umbra" item "X"
- Permisos: Read+Write (tokens regenerados)
- Cloudflare bloquea IP del Pi para web scraping — solo API oficial funciona
- Tor también bloqueado por Cloudflare

## 💾 Backup
- SSD Kingston SA400 960GB montado en /mnt/ssd
- Cron diario 3 AM: backup incremental de workspace, configs, wallet, keys
- Script: `/home/clawdbot/clawd/scripts/backup-ssd.sh`

## 📱 Contactos Importantes (nuevos)
- **JJ Hamui** — jj@hamui.com (amigo de Alberto)
- **Robert y Alin Shamosh** — padres de Sharon (7 Berajot 16 feb)

## 📝 Notas

### Viaje Cuernavaca
- Viernes 30 ene → Lunes 2 feb 2026
- Llevar cosas de Sienna

### Seguro Qualitas - Robo camioneta
- Denuncia levantada, certificación y acreditación hechas
- Pendiente: baja placas, tenencias, refacturación XML, llaves, comprobante domicilio, estado cuenta

### Herramientas útiles
- markmap-cli para mindmaps → Chromium headless screenshot
- libgen.li para libros (epub/pdf/mobi)
- SETUP-GUIDE.md tiene documentación completa de toda la instalación

---
*Última actualización: 2026-01-30*
