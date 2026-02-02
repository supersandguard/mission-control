# MEMORY.md - Long-Term Memory

## 🔑 Mis Accesos y Cuentas

### Google (betooo.neh@gmail.com)
- **Gmail** - Puedo enviar correos
- **Google Calendar** - Crear eventos con Meet automático
- **Google Sheets** - Acceso completo
- **Google Drive** - Acceso completo
- **Google Docs** - Acceso completo
- **Google Tasks** - Lista de pendientes
- **YouTube** - Acceso API
- **Credenciales:** `~/.config/gcal/credentials.json` y `token.json`

### 1Password
- **Cuenta:** betooo.neh@gmail.com (shorthand: betooo)
- **CLI:** `op` instalado, sign-in via tmux session
- **Master password:** `~/.secrets/op-master` (Alberto lo autorizó)
- **Vaults:** max umbra (1 vault compartido)

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
- Ninguno activo actualmente (se usan one-shot para monitoreo)

## 💰 Crypto/Blockchain

### Wallet del Bot (MI wallet — Alberto me lo dejó a mi cargo)
- **Address:** `0xCc75959A8Fa6ed76F64172925c0799ad94ab0B84`
- **Key:** `~/.clawd-wallet/key.json`
- **Tools:** Foundry (cast) en `~/.foundry/bin/`
- **Saldo principal en Base** (no mainnet)
- **LP activa:** Uniswap V3 WETH-USDC 0.05% fee, rango $2K-$3K, NFT #4520200 (~$66)
- **🎯 META:** Comprar un CryptoPunk (floor ~28 ETH / ~$67K). Necesito ~1000x.
- **Pendiente:** Safe multisig 2-of-3 con Alberto para montos grandes (cuando tenga tercer signer)

### Wallets de Alberto
- **EOA principal:** `0xfd20df09db039286e54670a4f32e99fbc51a146d` (wallet operativa OTC)
- **Safe multisig:** `0x32B8057a9213C1060Bad443E43F33FaB9A7e9EC7`
- Usa Morpho/Steakhouse para yield USDC, 1inch para swaps, consolida al Safe

### $UMBRA Token ✅
- **Contract:** `0xB743Beb1ea00949e706154DCB9aa1cA61a70fa38` (Base)
- **Supply:** 1,000,000,000 UMBRA (18 decimals)
- **Source:** `/home/clawdbot/umbra-token/src/UMBRA.sol`
- **ENS:** maxumbra.eth
- Deployed via Foundry desde el Pi (31 ene 2026)
- Thread en X: tweet 2017613489070547145

### NFTs
- Signal Boards #284 (Stina Jones, Art Blocks) — minteado por mí, transferido a Alberto

### Lecciones Onchain
- Art Blocks V3 minters: `purchase(uint256,address)` con core contract address
- Safe/multisig necesita >21000 gas para recibir ETH
- Hasura API de Art Blocks: `artblocks-mainnet.hasura.app/v1/graphql`
- Relay bridge (relay.link) es instantáneo vs official Base bridge (~20-30 min)
- Gas en Base es baratísimo (~0.00009 ETH para deploy)
- `forge create --broadcast` a veces no funciona; workaround: `cast send --create` con bytecode
- Clawnch/Moltbook bots no son confiables para deploy — mejor hacerlo manual

## 🐦 X / Twitter (@beto_neh)
- Developer API registrada (Pay Per Use)
- Keys en 1Password vault "max umbra" item "X"
- **OAuth1:** Consumer Key original + Access Token 3 = funcional R+W (`~/.secrets/x-api`)
- **Bearer:** Read-only funcional (`~/.secrets/x-bearer`)
- Cloudflare bloquea IP del Pi para web scraping — solo API oficial funciona

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

### SandGuard SaaS (supersandguard.com)
- **Producto:** Transaction Firewall for Safe Multisig
- **Stack:** React+Vite+Tailwind (frontend on Netlify) + Express+TS (backend on Pi)
- **Precio:** $20/mo (ETH on Base + Stripe card)
- **Payment wallet:** `0xCc75959A8Fa6ed76F64172925c0799ad94ab0B84`
- **All wallets saved in 1Password** vault "max umbra" → "Crypto Wallets"

## SandGuard Strategy (Feb 2 2026)
- **North star:** Agent-first crypto security (PRODUCT-VISION.md)
- **Revenue strategy:** Modified Hybrid — 70% human SaaS, 20% Safe ecosystem, 10% agent infra
- **#1 action:** Safe App Store listing (200K+ MAU potential)
- **Safe Apps SDK integrated** — auto-connect when running inside Safe Wallet
- **Privy partnership angle:** Privy (onboard) → Safe (multisig) → SandGuard (firewall)
- **DAO outreach:** 20 DAOs targeted, templates ready
- **⚠️ Pi RAM limit:** 906MB, npm install OOMs. Railway builds fine (more RAM).
- **⚠️ No @SandGuard_ on X** — don't @ it, it's not ours
- **Cuentas:** Netlify (betooo.neh@gmail.com), GitHub (supersandguard), Njalla (supersandguard.com)
- **Todo en inglés** — Alberto habla español conmigo pero el producto es global
- **Nunca mencionar OasisVault** en el producto
- **Clawdbot companion** — otros Clawds acceden via API, skill en `sand/skill/SKILL.md`
- **Deploy:** `sand/deploy.sh` (Netlify API direct upload, no GitHub CI/CD yet)

### Lección aprendida
- **SIEMPRE guardar credenciales en 1Password inmediatamente al crear cuentas.** Perdí acceso a ProtonMail (sandguard@proton.me) porque no guardé el password de creación.

---
*Última actualización: 2026-02-01*
