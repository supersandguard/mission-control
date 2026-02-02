# Analogy Section — Landing Page Changes

## What was added

A new **"Imagine a bank vault with three keys"** section on the SandGuard landing page (`sand/frontend/src/pages/Landing.tsx`).

### Location
Inserted **after the hero section** and **before the features section** ("What SandGuard does").

### Content — 3 visual cards

| Card | Emoji | Title | Message |
|------|-------|-------|---------|
| 1 | 🔐 | The Vault | Your crypto lives in a Safe wallet — a vault that needs multiple keys (signers) to open. 3 people must agree before any money moves. |
| 2 | 🙈 | The Problem | Someone slides a paper under the door that says "routine transfer." All 3 keyholders sign it without reading the actual contract. This is **blind signing**. |
| 3 | 🛡️ | The Fix | SandGuard **reads** the actual document, **simulates** what would happen, and **warns you** if something's wrong. Like a lawyer who reviews every contract before you sign. |

### ByBit hack callout
Below the 3 cards, a red-tinted warning box explains the real-world ByBit hack:
> "The paper said 'transfer funds' — but the actual contract said 'give everything to the attacker.' All signers approved because they trusted the summary, not the code. SandGuard would have caught this."

### Styling
- Matches existing dark theme (slate-950 background, emerald/cyan accents)
- The "Problem" card has a subtle red border (`border-red-500/20`)
- The "Fix" card has a subtle emerald border (`border-emerald-500/30`)
- Fully responsive: stacks vertically on mobile, 3-column grid on desktop
- Uses emojis for visual impact, short sentences, big text

### Existing "What is a Safe?" section
Already present in the page — no changes needed there.

## Commit
`621f7ee` — `feat(landing): add vault/keys analogy section explaining blind signing`

## Status
- ✅ TypeScript compiles clean
- ✅ Vite build succeeds
- ✅ Committed to local branch
- ❌ NOT pushed — waiting for review
