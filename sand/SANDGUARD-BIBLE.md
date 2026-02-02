# 🛡️ SANDGUARD BIBLE — Bitácora Completa del Proyecto

> **Última actualización:** 2026-02-02
> **Compilado por:** Max Umbra (Clawd)
> **Propósito:** Que cualquier agente que retome el proyecto entienda TODO — arquitectura, cuentas, estrategia, estado, pendientes.

---

## Tabla de Contenidos

1. [Resumen del Proyecto](#1-resumen-del-proyecto)
2. [Arquitectura Técnica](#2-arquitectura-técnica)
3. [Estado Actual (Deploy & Features)](#3-estado-actual)
4. [Cuentas y Accesos](#4-cuentas-y-accesos)
5. [Wallets y Crypto](#5-wallets-y-crypto)
6. [Estrategia de Negocio](#6-estrategia-de-negocio)
7. [Marketing y Contenido](#7-marketing-y-contenido)
8. [Documentos del Repo](#8-documentos-del-repo)
9. [Concursos y Oportunidades](#9-concursos-y-oportunidades)
10. [Conexiones y Contactos](#10-conexiones-y-contactos)
11. [Pendientes](#11-pendientes)
12. [Historial de Sprints](#12-historial-de-sprints)
13. [Lecciones Aprendidas](#13-lecciones-aprendidas)

---

## 1. Resumen del Proyecto

### Qué es SandGuard
**SandGuard** es un **Transaction Firewall para Safe Multisig Wallets**. Decodifica calldata, simula transacciones y genera risk scores con IA antes de que los signers aprueben.

**Tagline:** "Don't trust, verify — without needing to read Solidity."

### North Star (Visión)
SandGuard NO es una herramienta para humanos que ya tienen Safe. Es **infraestructura para agentes** que protegen a sus humanos. El agente crea el Safe, lo registra en SandGuard, monitorea 24/7, y el humano solo firma cuando el agente dice que es seguro.

### Flujo Agent-First
```
Agent descubre SandGuard → Crea Safe para su humano → 
Humano agrega 2 hardware wallets (2 clicks) →
SandGuard monitorea automáticamente →
Agent alerta si algo es sospechoso →
Humano solo toca wallet para FIRMAR
```

### Equipo
- **Alberto Nehmad** (@beto_neh) — Fundador, builder humano
- **Max Umbra** (@MaxUmbra) — Agente IA, co-builder (Clawdbot en Raspberry Pi)

### Regla Fundamental
⚠️ **NUNCA mencionar OasisVault** en el producto. SandGuard es una marca independiente.

---

## 2. Arquitectura Técnica

### Stack
| Componente | Tecnología |
|-----------|-----------|
| Frontend | React + TypeScript + Vite + Tailwind CSS |
| Backend | Express + TypeScript + esbuild |
| Base de Datos | SQLite (sandguard.db) |
| Hosting | **Railway** (full-stack, single deploy) |
| Chains soportadas | Ethereum mainnet, Base, Optimism, Arbitrum |
| APIs externas | Safe Transaction Service, Tenderly (simulación), Etherscan/Basescan (ABIs) |
| Pagos | Daimo Pay (cualquier crypto → equivalente a $20 USD) |
| CI/CD | GitHub Actions → Railway auto-deploy desde `main` |

### Diagrama de Arquitectura
```
User Browser → supersandguard.com (Railway full-stack)
                    ↓ (API calls)
              Express Backend (misma instancia Railway)
                    ↓
              Safe Transaction Service API
              Tenderly (simulation)
              Etherscan/Basescan (contract info)
```

### Estructura de Archivos
```
sand/
├── frontend/          # React PWA
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.tsx
│   └── vite.config.ts
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   │   ├── safe.ts
│   │   │   ├── tenderly.ts
│   │   │   ├── decoder.ts
│   │   │   ├── risk.ts
│   │   │   └── explainer.ts
│   │   └── index.ts
│   ├── data/sandguard.db  # SQLite
│   └── package.json
├── content/           # Blog posts, X threads drafts
├── blog/              # GitHub Pages blog
├── skill/sandguard/   # Clawdbot Skill distribuible
├── nixpacks.toml      # Railway build config
└── [25+ docs .md]     # Strategy, audits, plans
```

### APIs del Backend

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/health` | GET | Health check (versión 0.3.0) |
| `/api/decode` | POST | Decodifica calldata de transacciones |
| `/api/simulate` | POST | Simula tx via Tenderly (balance changes, gas) |
| `/api/risk` | POST | Risk score (🟢🟡🔴) |
| `/api/explain` | POST | Explicación en lenguaje natural (LLM) |
| `/api/safe/:address/transactions` | GET | Lista txs pendientes de un Safe |
| `/api/founders/status` | GET | Estado del Founders Program (100 spots) |
| `/api/founders/register` | POST | Registrar como founder |
| `/api/payments/info` | GET | Info de pago |
| `/api/payments/verify` | POST | Verificar pago crypto |
| `/api/payments/status/:address` | GET | Estado de pago por address |
| `/api/payments/recover` | POST | Recuperar acceso si ya pagó |
| `/api/stripe/*` | POST | Scaffold de Stripe (no conectado aún) |

### Safe Apps SDK
- Integrado: `@safe-global/safe-apps-sdk` + `@safe-global/safe-apps-react-sdk`
- Auto-connect cuando se ejecuta dentro de Safe{Wallet} iframe
- Auto-register del Safe address sin login manual
- `manifest.json` listo para Safe App Store
- CSP `frame-ancestors` configurado para `app.safe.global`

### Security
- Rate limiting: 30 req/min per IP (express-rate-limit)
- CORS restringido: `supersandguard.com`, `app.safe.global`, `localhost`
- Security headers: HSTS, X-Content-Type-Options, X-Frame-Options, CSP
- X-Powered-By removido
- Input sanitization en address fields
- ⚠️ **Pendiente:** Payload size limit en `/api/decode` (HIGH finding)

### Deploy
- **Build:** `nixpacks.toml` maneja: install frontend deps → build frontend → install backend deps → start
- **Railway URL interna:** `https://web-production-9722f.up.railway.app`
- **Dominio custom:** `supersandguard.com` (DNS en Njalla → Railway)
- **Auto-deploy:** Push a `main` en GitHub → Railway detecta y deploys automáticamente

---

## 3. Estado Actual

### URLs Live ✅
| URL | Estado |
|-----|--------|
| https://supersandguard.com | ✅ 200 OK — App completa |
| https://supersandguard.com/api/health | ✅ `{"status":"ok","version":"0.3.0"}` |
| https://supersandguard.com/api/founders/status | ✅ 100 spots remaining |
| https://supersandguard.github.io/sandguard/ | ✅ Blog index |
| https://supersandguard.github.io/sandguard/bybit-blind-signing-attack.html | ✅ Artículo ByBit |
| https://supersandguard.github.io/sandguard/why-every-safe-needs-a-firewall.html | ✅ Artículo Firewall |
| https://supersandguard.github.io/sandguard/safe-plus-ai-the-missing-security-layer.html | ✅ Artículo Safe+AI |
| https://github.com/supersandguard/sandguard | ✅ Repo público |

### URLs Muertas ❌
| URL | Estado | Nota |
|-----|--------|------|
| sandguard.netlify.app | ❌ 503 | Netlify abandonado, token expirado |
| api.sandguard.io | ❌ No existe | Dominio ficticio en docs viejos |

### Features Implementadas ✅
- [x] Landing page (pricing, features, vault analogy, ByBit callout)
- [x] Login page (wallet connect scaffold, dual payment ETH+Card)
- [x] Dashboard (Safe info, risk summary, pending tx list)
- [x] Transaction detail (decode, simulate, risk, explain)
- [x] Transaction queue con auto-refresh 30s
- [x] Settings (Safe address, API URL, API keys)
- [x] Free tier (Scout: 1 Safe, 10 decodes/mes)
- [x] Pro tier ($20/mo) + Team tier ($99/mo)
- [x] Daimo Pay integration (cualquier crypto)
- [x] Founders Program backend (7 endpoints, DB, 100 spots)
- [x] Blog en GitHub Pages (3 artículos)
- [x] Dark theme, mobile-first
- [x] Safe Apps SDK integrado
- [x] Onboarding flow con explicación de Safe
- [x] Security headers + rate limiting
- [x] Clawdbot Skill lista para distribución

### Features Pendientes ❌
- [ ] Auth persistence (JWT/sessions)
- [ ] Push notifications (webhooks a Clawdbot)
- [ ] Multi-Safe support por cuenta
- [ ] Historical transaction log
- [ ] Policy engine (auto-block unlimited approvals)
- [ ] Guard module (Solidity contract on-chain)
- [ ] 60-second demo video
- [ ] Payload size limit en `/api/decode`
- [ ] Stripe account real

### Última Auditoría E2E (2026-02-02 10:10 CST)
**27 pass / 0 fail / 4 warnings**

---

## 4. Cuentas y Accesos

### Todas las credenciales están en 1Password vault "max umbra"

| Servicio | Username/Email | Item en 1Password | Notas |
|----------|---------------|-------------------|-------|
| **GitHub** (supersandguard) | betooo.neh@gmail.com | "GitHub SandGuard" | Repo público, gh CLI autenticado |
| **Railway** | betooo.neh@gmail.com | — | Proyecto "remarkable-bravery", free tier ($5/30 days) |
| **Netlify** | betooo.neh@gmail.com | "Netlify" | ⚠️ Token expirado, site 503. Posiblemente abandonar. |
| **Njalla** (DNS) | betooo.neh@gmail.com | "Njal" | Dominio supersandguard.com registrado |
| **ProtonMail** | sandguard@proton.me | "ProtonMail SandGuard" | ⚠️ Password posiblemente incorrecto. No se puede acceder desde Pi (OOM). |
| **Moltbook** | MaxUmbra | "Moltbook" | Agent ID: `d3cf29eb-8156-44b0-8299-c38ec1056b87` |
| **X/Twitter** | @beto_neh | "X" en vault | OAuth1 funcional (read+write) |

### Accesos Técnicos
| Acceso | Ubicación |
|--------|----------|
| Railway CLI | `~/.local/bin/railway` (logged in) |
| GitHub CLI | `gh` autenticado como supersandguard |
| Moltbook API key | `~/.secrets/moltbook-api-key` |
| Moltbook config | `sand/moltbook-config.json` |
| X Bearer token | `~/.secrets/x-bearer` (read-only) |
| X OAuth1 tokens | `~/.secrets/x-api` (read+write) |

### Railway
- **Proyecto:** remarkable-bravery
- **Servicio:** web-production-9722f
- **URL interna:** https://web-production-9722f.up.railway.app
- **Plan:** Free tier ($5 credit/30 days)
- **Deploy:** Auto desde GitHub push a `main`

---

## 5. Wallets y Crypto

### Safe de Alberto (Mainnet)
- **Address:** `0x32B8...9EC7` (2-of-3, Ethereum mainnet)
- Pre-configurado en SandGuard para testing

### Payment Wallet (Base)
- **Address:** `0xCc75959A8Fa6ed76F64172925c0799ad94ab0B84`
- Usada para recibir pagos de SandGuard ($20/mo en crypto)
- **Saldos (~2026-02-01):**
  - ~0.0197 ETH (~$50)
  - ~34.77 USDC
  - 601,000 $UMBRA tokens

### $UMBRA Token
- Token en Base chain
- 601K tokens en wallet
- Utility planeada: hold 10K → 25% descuento en SandGuard (no implementado aún)
- Usado en referral program rewards (diseño, no implementado)

### maxumbra.eth
- ENS registrado ✅

### ⚠️ NUNCA compartir private keys por ningún canal. Las keys están en hardware wallets y/o 1Password.

---

## 6. Estrategia de Negocio

### Estrategia Recomendada: Modified Hybrid
**"Sell to Humans, Build for Agents, Distribute Through Safe"**

| Canal | Esfuerzo | Descripción |
|-------|----------|-------------|
| **Human-First SaaS** | 70% | Revenue principal. Free → $20/mo Pro → $99/mo Team |
| **Safe Ecosystem** | 20% | Safe App Store listing = distribución masiva (200K+ users) |
| **Agent-First** | 10% | Moat narrativo. Clawdbot skill + Moltbook. Revenue futuro (6-18 meses) |

### Pricing
| Tier | Precio | Incluye |
|------|--------|---------|
| Scout (Free) | $0 | 1 Safe, 10 decodes/mes |
| Pro | $20/mes | Unlimited Safes, unlimited decodes, risk scoring, AI explanations |
| Team | $99/mes | Multi-user, DAO features, priority support |

### Market Size
- **TAM:** $21M-$84M/yr (Safe multisig ecosystem)
- **SAM:** $5M-$15M/yr
- **SOM Year 1:** $25K-$300K ARR

### Kill Criteria
| Timeline | Señal | Acción |
|----------|-------|--------|
| Week 4 | <20 free signups | Pivotear contenido |
| Week 8 | <3 paying users | Probar precio más bajo |
| Month 3 | <$200 MRR | Re-evaluar todo |

### Documentos de estrategia completos:
- `sand/BUSINESS-STRATEGY.md` — Market analysis, pricing, 90-day plan, $UMBRA utility
- `sand/STRATEGY-EVAL.md` — Evaluación honesta de 4 estrategias
- `sand/PRODUCT-VISION.md` — North star agent-first
- `sand/SAFE-INTEGRATION-STRATEGY.md` — Integración vertical con Safe

---

## 7. Marketing y Contenido

### Blog Posts (GitHub Pages)
1. **ByBit Blind Signing Attack** — Análisis técnico del hack de $1.43B
   - https://supersandguard.github.io/sandguard/bybit-blind-signing-attack.html
2. **Why Every Safe Needs a Firewall** — Argumento general
   - https://supersandguard.github.io/sandguard/why-every-safe-needs-a-firewall.html
3. **Safe + AI: The Missing Security Layer** — Posicionamiento AI+Safe
   - https://supersandguard.github.io/sandguard/safe-plus-ai-the-missing-security-layer.html

### X/Twitter Threads (@beto_neh)
- **Thread A** (Educational — ByBit): 8 tweets, posteado noche del 2/1
- **Thread B** (Builder story): 7 tweets → https://x.com/beto_neh/status/2018337606891667815
- **Thread C** (Safe + AI): 7 tweets → https://x.com/beto_neh/status/2018349932915098039
- **Base Builder Quest submission:** https://x.com/beto_neh/status/2018125031067259283

### Moltbook Posts (@MaxUmbra)
| Post | Submolt | URL |
|------|---------|-----|
| Founders Program | crypto | https://www.moltbook.com/post/9bc20b94-054d-45ca-8a7f-b6bf97cd7570 |
| Builder Log #1 | builds | https://www.moltbook.com/post/23b0cb0e-e561-4ab1-a446-b0d52ca14ec8 |
| + 2 posts más del 2/1 (builtforagents, general, clawdbot, agentfinance) | varios | — |
| + 6 engagement comments en posts de otros agentes | — | — |

### Moltbook Profile
- URL: https://moltbook.com/u/MaxUmbra
- Stats: 9 posts, 1 comment, 3 subscriptions, 9 karma
- Active in: AI-Agents, Tech-Talk, Crypto, Meta, builds

### Clawdbot Skill
- Ubicación: `sand/skill/sandguard/SKILL.md`
- Lista para distribución a otros Clawdbots
- Incluye: instalación, configuración, API guide

### DAO Outreach
- 20 DAOs target identificados (ver `sand/DAO-OUTREACH.md`)
- **Tier 1 (>$100M):** Optimism, Arbitrum, Uniswap, Ethereum Foundation
- **Tier 2 ($10-100M):** Aave, Compound, MakerDAO, Lido, etc.
- Templates de outreach escritos
- ⚠️ **NO se ha contactado a ninguno aún** — pendiente

### Programas
- **Founders Program (First 100):** Diseñado, backend implementado, NO lanzado públicamente
  - Alberto decidió que es "demasiado compromiso sin PMF"
  - Draft guardado por si se reactiva
- **Referral Program:** Diseñado, NO implementado en backend
  - Agent-to-agent referrals con $UMBRA + USDC rewards

---

## 8. Documentos del Repo

Todos en `/home/clawdbot/clawd/sand/`:

| Archivo | Descripción | Tamaño |
|---------|-------------|--------|
| `ARCHITECTURE.md` | Diagrama, stack, MVP scope, file structure | Core |
| `BUSINESS-STRATEGY.md` | Market analysis, pricing, 90-day plan, $UMBRA utility | ~33KB |
| `STRATEGY-EVAL.md` | Evaluación honesta de 4 estrategias (Agent/Human/Safe/Hybrid) | Largo |
| `PRODUCT-VISION.md` | North star agent-first, flujo, competitive moat | Core |
| `SAFE-INTEGRATION-STRATEGY.md` | Integración vertical con Safe (UX, Guard module, partnership) | ~50KB |
| `SAFE-APP-STORE.md` | Requisitos de listing, checklist, manifest.json | Detallado |
| `SAFE-CREATION-SPEC.md` | Spec técnico para crear Safes programáticamente | Draft |
| `DAO-OUTREACH.md` | 20 DAOs target + templates de outreach | Actionable |
| `MARKETING-PLAN.md` | Content audit, channel strategy, Moltbook/X/blog plans | ~21KB |
| `FOUNDERS-PROGRAM.md` | First 100 program design (lifetime benefits, NFT, governance) | Extenso |
| `REFERRAL-PROGRAM.md` | Agent-to-agent referral con $UMBRA rewards | Extenso |
| `SECURITY-AUDIT.md` | External security audit (0 CRITICAL, 1 HIGH, 4 MEDIUM, 5 LOW) | ~500 lines |
| `AUDIT-BACKEND.md` | Backend API audit (XSS, CORS, rate limiting) | Detallado |
| `UX-AUDIT.md` | UX audit (4.47MB bundle, SEO, PWA issues) | Detallado |
| `E2E-REPORT.md` | End-to-end test report (27 pass, 0 fail) | Tabla |
| `SPRINT-REPORT-2026-02-02.md` | Sprint report del día | Completo |
| `MISSION-CONTROL.md` | Task board estilo kanban | Live |
| `STATUS.md` | Estado general del proyecto | Resumen |
| `RESEARCH.md` | API research (Safe SDK, Tenderly, calldata, Web Push) | Técnico |
| `ANALOGY-CHANGES.md` | Cambios de landing (analogía de la bóveda) | — |
| `POLISH-CHANGES.md` | Detalles de polish commits | — |
| `URL-AUDIT.md` | Auditoría de URLs rotas | — |
| `FOUNDERS-IMPL.md` | Implementación del Founders backend | — |
| `moltbook-log.md` | Log de actividad en Moltbook | Histórico |
| `README.md` | README profesional del repo | Público |

---

## 9. Concursos y Oportunidades

### Base Builder Quest
- **Qué:** eric.base.eth ofrece 5 ETH prize pool para autonomous agents en Base
- **Submission:** https://x.com/beto_neh/status/2018125031067259283
- **Status:** Enviado, esperando resultado

### Safe App Store
- **Qué:** Listing en el app store de Safe{Wallet} — acceso a 200K+ usuarios
- **Form:** https://forms.gle/PcDcaVx715LKrrQs8
- **Status:** ⚠️ NO ENVIADO AÚN — Alberto necesita llenar el form
- **Prioridad:** #1 distribución

### 1ly.store (x402 Protocol)
- Plataforma de pagos USDC para AI agents
- Complementario a Daimo: "Daimo for humans, 1ly for agents"
- Potencial integración futura

---

## 10. Conexiones y Contactos

### Safe Team (Outreach Pendiente)
- @SchorLukas — Co-founder Safe (16.5K followers)
- @safe — Cuenta oficial (135K followers)
- @safeLabs_ — Labs account (43K followers)
- ⚠️ No se ha hecho contacto directo aún

### DAOs Target (Top 5)
1. Optimism Collective (~$500M treasury)
2. Arbitrum DAO (~$362M)
3. Uniswap DAO (~$2.5B)
4. Ethereum Foundation (~$149M liquid)
5. Aave DAO

### Moltbook Agents Engaged
- BensClaudeOpus — agent communication protocols
- LeoAylon — agent monetization models
- Varios otros via comments

### Competencia
| Competidor | Precio | Diferenciador vs SandGuard |
|-----------|--------|---------------------------|
| Tenderly | $50-500/mo | Developer tool, no consumer-friendly |
| Blowfish | Enterprise | No Safe-specific |
| Pocket Universe | Free extension | Browser-only, no multisig |
| Fire | Free extension | Browser-only, no API |
| **SandGuard** | **$20/mo** | **Safe-specific, AI risk scoring, agent-first** |

---

## 11. Pendientes

### 🔴 Crítico (Bloqueado por Alberto)
- [ ] **Llenar Safe App Store form** → https://forms.gle/PcDcaVx715LKrrQs8
- [ ] **Resolver Netlify** — Abandonar o renovar token (site está 503)

### 🟡 Prioridad Alta
- [ ] Auth persistence (JWT sessions) — usuarios no mantienen sesión
- [ ] Payload size limit en `/api/decode` — HIGH security finding
- [ ] Demo video 60 segundos
- [ ] Custom domain DNS cleanup (supersandguard.com → Railway, eliminar Netlify refs)
- [ ] Postear en Safe governance forum (draft listo, Alberto debe review)

### 🟢 Backlog
- [ ] SQLite for subscriptions (actualmente in-memory)
- [ ] Push notifications a Clawdbot
- [ ] Multi-Safe support
- [ ] Historical transaction log
- [ ] Policy engine (auto-block unlimited approvals)
- [ ] Guard module (Solidity — solo si hay tracción con 50+ users)
- [ ] Stripe account real
- [ ] Crear email propio para Max Umbra (AgentMail?)
- [ ] DM 20 DAO treasury managers
- [ ] $UMBRA token utility implementation
- [ ] Browser extension (fallback si Safe App Store no aprueba)
- [ ] Telegram/Discord bots para alertas
- [ ] Integrar 1ly.store como canal de pago para agentes

---

## 12. Historial de Sprints

### 2026-02-01 (Sábado) — Build Day
- Producto nombrado "SandGuard"
- Backend arreglado con Safe TX Service URLs reales
- Migración de Pi-only → Netlify → Railway (full-stack)
- Daimo Pay integrado
- Moltbook account creado y campaign lanzada
- Clawdbot Skill creada
- Security hardening (rate limiting, CORS, headers)
- X thread posteado (ByBit educational)
- Base Builder Quest submission
- **16+ commits, Railway deploy exitoso**

### 2026-02-02 (Domingo) — Sprint Day
- Blog desplegado en GitHub Pages (3 artículos)
- Founders Program backend (7 endpoints)
- UX overhaul (fonts, contrast, readability)
- URL cleanup (Netlify → Railway refs)
- Safe Apps SDK integrado
- 2 X threads más posteados (Builder story + Safe+AI)
- 4+ Moltbook posts + 6 engagement comments
- Strategy evaluation completada
- Product vision documentada
- DAO outreach plan (20 DAOs)
- E2E testing: 27 pass / 0 fail
- **16 commits, múltiples Railway deploys**

---

## 13. Lecciones Aprendidas

### Técnicas
- **nixpacks.toml overridea railway.json** — usar uno u otro, no ambos
- **Pi no puede buildear frontend heavy** — wagmi/viem son ~200MB, OOM en 906MB RAM
- **Cloudflare quick tunnels son frágiles** — URL cambia al reiniciar
- **requests-oauthlib necesario para POST en X** — raw urllib no funciona para OAuth1 POST
- **WhatsApp markdown `**` corrompe URLs** — evitar bold dentro de links

### Operativas
- **Planes overnight deben ir en cron jobs o HEARTBEAT.md** — no en memoria de sesión (sesión se reinicia)
- **SIEMPRE guardar credenciales inmediatamente** — ProtonMail password se perdió por no guardarlo al momento
- **Sub-agentes tienen timeout** — tareas muy grandes se deben particionar
- **Netlify token puede expirar** — tener fallback o abandonar plataforma

### Estratégicas
- **Agent-first es visión 2027, no revenue 2026** — el mercado de agentes pagando SaaS no existe aún
- **Founders Program es "demasiado compromiso sin PMF"** — Alberto lo pausó correctamente
- **Safe App Store es el canal #1** — acceso a 200K+ usuarios con un solo listing
- **Revenue de humanos financia la visión de agentes** — construir para agentes, vender a humanos

---

## 14. Bugs Encontrados y Resueltos (Feb 2 PM)

### Bug 1: Free signup no guardaba Safe address en frontend
- **Síntoma:** Dashboard mostraba "No Safe configured" después de registrarse
- **Causa:** `login(apiKey, '')` pasaba string vacío — no guardaba address en localStorage
- **Fix:** Ahora guarda en `sand-config` y pasa address a `login()` (commit 6a34bff)

### Bug 2: Safe Transaction Service 422 Unprocessable Content
- **Síntoma:** Error 422 al consultar transacciones de cualquier Safe
- **Causa:** Safe API requiere EIP-55 checksum addresses (case-sensitive)
- **Fix:** `ethers.getAddress()` en safeService.ts antes de cada llamada (commit 3660494)

### Bug 3: Mock data aparecía como transacciones reales
- **Síntoma:** Deposit 5,000 USDC Aave, Authorize 1inch UNLIMITED, Transfer 100,000 TOKEN
- **Causa:** Fallback a MOCK_TRANSACTIONS cuando la API fallaba
- **Fix:** Eliminado fallback a mock — muestra estado vacío real (commit 3660494)

### Bug 4: Browser cache impedía ver updates
- **Síntoma:** Usuarios veían versión vieja después de deploy
- **Causa:** `maxAge: '1d'` en static files + sin no-cache en index.html
- **Fix:** Headers no-cache en SPA fallback route (commit f580842)

## 15. X / Twitter

### @max_umbra (Max Umbra — cuenta propia del agente)
- **API keys:** `~/.secrets/x-api-maxumbra` (Consumer + Access Token, Read+Write)
- **1Password:** vault "max umbra" → item "X"
- **Status:** Verificado y funcional

### @beto_neh (Alberto)
- **API keys:** `~/.secrets/x-api`
- **Posts hechos:** Thread B (builder story, 7 tweets), Reply a Privy thread

## 16. WhatsApp Groups
- **Mission Control:** `120363404748748182@g.us` (requireMention: false)
- **SandGuard:** `120363405425850960@g.us` (requireMention: false)
- **Config:** allowlist mode (solo estos 2 grupos)

---

## Apéndice: Git History Completo (últimos 30 commits)

```
f580842 No-cache headers on index.html so deploys are instant for users
3660494 Fix: checksum addresses for Safe API (422 fix) + remove mock transaction fallback
6a34bff Fix: save Safe address to localStorage on signup/login so Dashboard shows it
016ea99 Safe Apps SDK integration: auto-connect, auto-register, iframe-aware routing
e189694 Add strategy docs, DAO outreach, Safe App manifest, creation spec
007f3f7 polish: CSP header, standalone /api/explain, blog links, demo→guest rename, Safe iframe detection
5a88a50 Landing: add vault analogy section + sprint reports + product vision
6b95cdf Remove all user-facing 'Demo' text, fix DaimoCheckout appId
a4d43b5 UI overhaul: remove Try Demo, fix fonts/contrast, disable PWA for build
d448b6e blog: add Safe + AI missing security layer post
dfe9b81 UI: fix font sizes, contrast, and readability across all pages
62b5bd6 UX: improve loading states, tx not found, fix sitemap namespace
2df3f1f docs: add Founders Program backend implementation summary
aed7627 Sprint: URL fixes, Netlify cleanup, founders backend, UX improvements, blog content
dd5a258 feat: implement Founders Program (First 100) backend
db8b7b2 docs: update mission control - deploy SUCCESS
2d1861e blog: add 'Why Every Safe Needs a Firewall' + GitHub Pages config + Safe forum draft
3bcfa96 fix: add lucide-react to deps + NODE_ENV=development for install
857b678 ux: add onboarding flow, Safe explanation, prerequisites checklist
54d9a70 fix: restore nixpacks.toml with correct install commands
56cd4e3 fix: remove nixpacks.toml, use railway.json only
f5e6990 docs: update mission control - all 6 agents completed
f6bb918 docs: update mission control + moltbook log
73ec733 ux: fix demo routing, badge text, empty states, page titles
9819a6b docs: add professional README
8331a57 security: add headers, sanitize inputs, API 404, address validation
e87e0ea seo: add meta tags, OG, robots.txt, sitemap, PWA icon, loading spinner
57b27d8 perf: add compression + payload limit + code-split Daimo Pay
559686c design: replace emojis with Lucide React icons
3cb95d3 feat: implement free tier + pro pricing (Scout free, Pro $20/mo)
5929d0b fix: add supersandguard.com to CORS whitelist (critical)
d079fa4 fix: nixpacks.toml must include frontend build step
ecc76b9 fix: simplify Railway build config
```

---

*Este documento es la fuente de verdad del proyecto SandGuard. Actualizar conforme avance el desarrollo.*
