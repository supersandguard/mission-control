# SandGuard — Product Vision

> "Los agentes traen de la mano al humano con la menor fricción posible."
> — Alberto, Feb 2 2026

## Core Insight

SandGuard no es una herramienta para humanos que ya tienen Safe.
SandGuard es **infraestructura para agentes** que protegen a sus humanos.

## The Agent-First Flow

```
Agent discovers SandGuard (Moltbook, Clawdbot skill, API)
        ↓
Agent creates Safe wallet for their human (programmatic)
        ↓
Agent sends human ONE link: "Add your 2 hardware wallets here"
        ↓
Human clicks link, connects 2 HWWs (2 clicks, done)
        ↓
SandGuard monitors all transactions automatically
        ↓
Agent alerts human if anything looks suspicious
        ↓
Human only touches their wallet to SIGN (when agent says it's safe)
```

## What the Human Experiences

1. Gets a message from their agent: "Te creé una bóveda segura para tu crypto. Solo necesitas conectar tus llaves de hardware aquí: [link]"
2. Clicks link → Safe app → adds 2 hardware wallets
3. Done. Never thinks about it again.
4. Agent handles: monitoring, decoding, risk scoring, alerts
5. Human only acts when: signing approved transactions, or agent flags something

## What the Agent Does (Behind the Scenes)

1. Deploys Safe via Safe SDK (Factory contract on Base)
2. Sets initial config: 2-of-3 (human HWW1 + human HWW2 + agent recovery key)
3. Registers Safe with SandGuard (free tier auto-activated)
4. Monitors pending transactions 24/7
5. Decodes + simulates + risk-scores every tx
6. Sends human plain-language summary: "This transaction sends 100 USDC to 0x... — risk: LOW ✅"
7. If HIGH risk: "⚠️ This transaction upgrades the wallet contract to an unverified address. DO NOT SIGN."

## Why This Wins

- **For humans:** Zero learning curve. Don't need to understand Safe, multisig, or calldata.
- **For agents:** SandGuard is their security API. They look competent by protecting their human.
- **For SandGuard:** Distribution through agents is viral. Every Clawdbot with the skill = potential customer.
- **For Safe ecosystem:** More Safes deployed = more value in the ecosystem.

## Key Technical Requirements

1. Programmatic Safe creation (Safe SDK / Factory)
2. Signer management URL generation (Safe App link)
3. Agent-to-SandGuard API (create Safe, register, monitor)
4. Push notifications to agent when tx is queued
5. Risk-scored transaction summaries in natural language

## Competitive Moat

Nobody else is building agent-first crypto security.
- Tenderly: developer tool, not agent-facing
- Pocket Universe: browser extension, human-first
- Safe Guard modules: on-chain only, no AI decode

SandGuard + Clawdbot skill = **the security layer for the agentic economy.**

---

*This document defines the north star. Everything we build should reduce friction for the human and increase capability for the agent.*
