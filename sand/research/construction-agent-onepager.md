# Agente Interno de Obra — One Pager

## ¿Qué es?
Un asistente de AI que vive en un Raspberry Pi (o servidor) y se conecta por WhatsApp con tu equipo. Tiene todos los procedimientos, procesos, reportes y lecciones aprendidas de la empresa. Los residentes le preguntan por WhatsApp y responde al instante.

---

## ¿Qué puede hacer?

**Consultas inmediatas:**
- "¿Cuál es el proceso para solicitar un cambio de orden?"
- "¿Qué dice el manual sobre impermeabilización de azoteas?"
- "¿Cuál es el rendimiento esperado de un albañil en muro de block?"

**Reportes y datos vivos:**
- Consultar avance de obra vs programa
- Estado de cuenta del proyecto
- Rendimientos reales vs esperados
- Retrasos y causas

**Lecciones aprendidas:**
- "Tuve un problema con el proveedor X" → lo registra
- "¿Qué problemas han tenido otros proyectos con losa postensada?" → responde del historial

**Push automático:**
- Resumen semanal de avance por proyecto
- Alertas de retrasos críticos
- Recordatorios de entregables

---

## Arquitectura

```
[Residentes]  ←WhatsApp→  [Clawdbot en Pi/VPS]  ←lee→  [Docs + Sheets]
```

**Componentes:**

1. **Raspberry Pi 4/5** (~$35-70 USD) o VPS ($5/mes)
2. **Clawdbot** — software open source, gratis
3. **WhatsApp** — número dedicado de la empresa
4. **API de AI** — Claude (Anthropic) ~$5-20/mes según uso
5. **Google Sheets** — reportes de obra, programas, estados de cuenta
6. **Google Drive** — manuales, procedimientos en PDF/markdown
7. **Workspace** — carpeta con toda la info estructurada

**Costo mensual estimado: $10-25 USD**

---

## Seguridad

- Solo responde a números autorizados (whitelist)
- Servidor separado — no se mezcla con info personal
- Sin acceso a internet abierto ni ejecución de código
- Solo lectura de documentos + escritura en sheets específicos
- Los residentes no pueden modificar la info base

---

## Setup Paso a Paso

### 1. Hardware
- Comprar Raspberry Pi 4/5 (4GB RAM mínimo)
- MicroSD 32GB + cable ethernet + fuente de poder
- Conectar a la red de la oficina

### 2. Instalar
```bash
# Flashear Raspberry Pi OS (64-bit) con SSH habilitado
# Conectarse por SSH y correr:
curl -fsSL https://clawd.bot/install.sh | bash
clawdbot onboard --install-daemon
```

### 3. Configurar WhatsApp
```bash
clawdbot configure
# Seleccionar WhatsApp → escanear QR con el cel dedicado
```

### 4. Configurar acceso
- Agregar números de residentes al whitelist
- Crear grupo de WhatsApp "Obra [Proyecto]" si se prefiere

### 5. Armar el workspace
Crear carpetas con la info de la empresa:
```
~/clawd/
├── SOUL.md              # Personalidad y reglas del agente
├── procedimientos/
│   ├── cambios-de-orden.md
│   ├── seguridad-obra.md
│   ├── control-calidad.md
│   └── proveedores.md
├── lecciones/
│   ├── 2024.md
│   └── 2025.md
├── reportes/            # Links a Google Sheets
│   └── README.md
└── rendimientos/
    ├── albañileria.md
    ├── concreto.md
    └── acabados.md
```

### 6. Conectar Google Sheets
- Crear sheets para: programa de obra, estado de cuenta, rendimientos
- El agente lee los sheets en tiempo real cuando le preguntan

### 7. Entrenar al agente
- Escribir SOUL.md con las reglas: tono profesional, responder solo con info verificada, registrar lecciones aprendidas
- Subir todos los PDFs/manuales como markdown

---

## Ejemplo de Conversación

**Residente:** ¿Cuál es el proceso para solicitar un cambio de orden?

**Agente:** De acuerdo al manual de procedimientos:
1. Llenar formato CO-001 con descripción del cambio
2. Incluir impacto en costo y programa
3. Enviar a supervisión para VoBo
4. Supervisión tiene 48h para aprobar/rechazar
5. Si se aprueba, actualizar programa y presupuesto
¿Necesitas el formato CO-001?

**Residente:** Sí, mándalo

**Agente:** [Envía PDF del formato]

---

## Próximos Pasos

1. **Conseguir el Pi** y conectarlo a internet
2. **Instalar Clawdbot** (3 comandos)
3. **Juntar la info** — manuales, procedimientos, rendimientos
4. **Estructurar el workspace** — convertir PDFs a markdown
5. **Dar de alta los números** de residentes
6. **Probar** con un residente piloto

---

## ¿Necesitas ayuda?
La comunidad de Clawdbot está en Discord: https://discord.com/invite/clawd
Docs completos: https://docs.clawd.bot
