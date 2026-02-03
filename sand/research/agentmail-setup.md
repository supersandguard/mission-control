# AgentMail Setup — Max Umbra Email

## Status: PENDIENTE (necesita signup via browser)

## Qué es
AgentMail (YC backed) — email inboxes para AI agents via API. Como Gmail pero para agentes.

## Plan: Free Tier
- 3 inboxes
- 3,000 emails/mes
- 3 GB storage
- Gratis, sin tarjeta

## Lo que queremos
- Inbox: maxumbra@agentmail.to (o similar)
- Para: comunicación oficial de Max Umbra, recibir respuestas, newsletters, etc.

## SDK instalado
```bash
pip3 install agentmail  # ✅ ya instalado v0.2.11
```

## Pasos para completar
1. Ir a https://console.agentmail.to
2. Crear cuenta (Google OAuth o email)
3. Crear API key
4. Guardar API key en ~/.secrets/agentmail-api-key
5. Crear inbox:

```python
from agentmail import AgentMail
import os

client = AgentMail(api_key=os.getenv("AGENTMAIL_API_KEY"))

inbox = client.inboxes.create(
    username="maxumbra",
    domain="agentmail.to"
)
print(inbox)
```

6. Guardar config en 1Password
7. Actualizar TOOLS.md e IDENTITY.md con el email

## Pricing upgrade si necesitamos
- $20/mes → 10 inboxes, 10K emails, custom domains
- Custom domain: podríamos usar maxumbra.eth email o similar
