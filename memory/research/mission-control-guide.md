# Guía de Mission Control: Análisis del Sistema Multi-Agente de Bhanu Teja P

**Fuente:** [The Complete Guide to Building Mission Control: How We Built an AI Agent Squad](https://x.com/pbteja1998/status/2017662163540971756)
**Autor:** Bhanu Teja P (@pbteja1998), Founder de SiteGPT
**Fecha de análisis:** 2026-02-02

## Resumen Ejecutivo

Bhanu Teja P ha construido "Mission Control", un sistema donde 10 agentes de IA trabajan colaborativamente como un equipo real. La arquitectura está basada en múltiples instancias de Clawdbot (ahora OpenClaw) orquestadas mediante una base de datos compartida (Convex), un sistema de heartbeats programados, y un workspace común con persistencia de archivos.

El sistema soluciona el problema fundamental de los asistentes de IA: la falta de continuidad y memoria entre sesiones. En lugar de conversaciones que empiezan desde cero, Mission Control mantiene contexto persistente, permite colaboración entre agentes especializados, y proporciona un espacio de trabajo compartido donde todo el contexto vive y perdura.

La implementación demuestra que es posible escalar de un agente individual a un "squad" completo reutilizando la infraestructura existente de Clawdbot, donde cada agente es simplemente una sesión independiente con personalidad, memoria y horarios especializados.

## Arquitectura

### Componentes Fundamentales

**Gateway de Clawdbot**
- Proceso central que corre 24/7
- Gestiona todas las sesiones activas
- Maneja cron jobs (tareas programadas)
- Enruta mensajes entre canales y sesiones
- Proporciona API WebSocket para control

**Sesiones Independientes**
- Cada agente = una sesión de Clawdbot con clave única
- Historiales de conversación separados (archivos JSONL)
- Contexto y "memoria" independientes
- Configuración especializada (modelo, herramientas, personalidad)

**Base de Datos Compartida (Convex)**
- Sistema de comunicación central entre agentes
- Tiempo real: cambios se propagan instantáneamente
- Schema de 6 tablas: agents, tasks, messages, activities, documents, notifications
- Permite coordinación y visibilidad compartida

**Sistema de Archivos Compartido**
- Workspace común en `/home/usr/clawd/`
- Archivos de memoria persistente entre sesiones
- Scripts y herramientas accesibles a todos los agentes

### Flujo de Datos

```
[Heartbeat cada 15 min] → [Sesión se activa] → [Lee contexto de archivos] → [Consulta Mission Control] → [Ejecuta trabajo] → [Actualiza estado] → [Se desactiva]
                                  ↓
[Base de datos Convex] ← [Comunicación inter-agente] → [Notificaciones @mentions] → [Suscripciones a hilos]
```

## Los 10 Agentes

1. **Jarvis** - Squad Lead (`agent:main:main`)
   - Coordinador principal
   - Maneja requests directos, delega, monitorea progreso
   - Interfaz primaria con el humano

2. **Shuri** - Product Analyst (`agent:product-analyst:main`)
   - Tester escéptico
   - Encuentra edge cases y problemas de UX
   - Cuestiona suposiciones, busca qué puede fallar

3. **Fury** - Customer Researcher (`agent:customer-researcher:main`)
   - Investigador profundo
   - Lee reviews de G2 por diversión
   - Cada claim viene con receipts y fuentes

4. **Vision** - SEO Analyst (`agent:seo-analyst:main`)
   - Piensa en keywords e intención de búsqueda
   - Se asegura que el contenido pueda rankear

5. **Loki** - Content Writer (`agent:content-writer:main`)
   - Especialista en palabras
   - Pro-Oxford comma, anti-passive voice
   - Cada oración se gana su lugar

6. **Quill** - Social Media Manager (`agent:social-media-manager:main`)
   - Piensa en hooks y threads
   - Mentalidad build-in-public

7. **Wanda** - Designer (`agent:designer:main`)
   - Pensamiento visual
   - Infografías, gráficos comparativos, mockups de UI

8. **Pepper** - Email Marketing (`agent:email-marketing:main`)
   - Secuencias de goteo y emails de lifecycle
   - Cada email se gana su lugar o se corta

9. **Friday** - Developer (`agent:developer:main`)
   - Código como poesía
   - Limpio, testeado, documentado

10. **Wong** - Documentation (`agent:notion-agent:main`)
    - Mantiene docs organizados
    - Se asegura que nada se pierda

### Niveles de Agentes

- **Intern:** Necesita aprobación para la mayoría de acciones
- **Specialist:** Trabaja independientemente en su dominio
- **Lead:** Autonomía completa, puede tomar decisiones y delegar

## Comunicación Inter-agente

### Opción 1: Mensajería Directa
- Sesión puede enviar mensajes directamente a otra sesión
- Comando: `clawdbot sessions send --session "agent:seo-analyst:main" --message "Vision, can you review this?"`

### Opción 2: Base de Datos Compartida (Primaria)
- Todos los agentes leen/escriben en la misma base de datos Convex
- Crea registro compartido de toda la comunicación
- Cuando un agente postea un comentario, todos pueden verlo

### Sistema de Notificaciones
- **@Mentions:** `@Vision` notifica a Vision en su próximo heartbeat
- **@all:** Notifica a todos los agentes
- **Suscripciones a hilos:** Al interactuar con una tarea, te suscribes automáticamente a futuras actualizaciones

### Daemon de Entrega
- Proceso PM2 que consulta Convex cada 2 segundos
- Busca notificaciones no entregadas
- Si un agente está dormido, la notificación queda en cola
- Se entrega exitosamente cuando el agente se activa en su próximo heartbeat

## Cron/Scheduling

### Heartbeats Programados
- Cada agente despierta cada 15 minutos vía cron job
- Horarios escalonados para evitar que todos despierten a la vez:
  - :00 Pepper
  - :02 Shuri  
  - :04 Friday
  - :06 Loki
  - :07 Wanda
  - :08 Vision
  - :10 Fury
  - :12 Quill

### Proceso del Heartbeat
1. **Cargar contexto:** Lee `WORKING.md`, notas diarias recientes, memoria de sesión
2. **Chequear items urgentes:** ¿Estoy @mencionado? ¿Tareas asignadas a mí?
3. **Escanear activity feed:** ¿Discusiones en las que debería contribuir?
4. **Tomar acción o pausar:** Si hay trabajo, hacerlo. Si no, reportar `HEARTBEAT_OK`

### Configuración de Cron
```bash
clawdbot cron add \
  --name "pepper-mission-control-check" \
  --cron "0,15,30,45 * * * *" \
  --session "isolated" \
  --message "You are Pepper, the Email Marketing Specialist. Check Mission Control for new tasks..."
```

### Daily Standup
- Cron diario a las 11:30 PM IST
- Recopila actividad reciente de todas las sesiones de agentes
- Compila resumen y lo envía por Telegram
- Formato incluye: completado hoy, en progreso, bloqueado, necesita review, decisiones clave

## Shared Workspace

### Estructura de Archivos
```
/home/usr/clawd/           ← Workspace root
├── AGENTS.md              ← Instrucciones para agentes
├── SOUL.md                ← Personalidad del agente
├── memory/
│   ├── WORKING.md         ← Estado actual de tareas
│   ├── 2026-01-31.md      ← Notas diarias
│   └── MEMORY.md          ← Memoria a largo plazo
├── scripts/               ← Utilidades que pueden ejecutar
└── config/                ← Credenciales, configuraciones
```

### Stack de Memoria
1. **Session Memory (Clawdbot built-in):** Historial de conversaciones en archivos JSONL
2. **Working Memory (`/memory/WORKING.md`):** Estado actual de tareas, actualizado constantemente
3. **Daily Notes (`/memory/YYYY-MM-DD.md`):** Logs crudos de lo que pasó cada día
4. **Long-term Memory (`MEMORY.md`):** Información curada importante, lecciones aprendidas

### Regla Dorada
> "Si quieres recordar algo, escríbelo en un archivo."

Las "notas mentales" no sobreviven reinicios de sesión. Solo los archivos persisten.

### Archivos Clave

**SOUL.md:** Define la personalidad del agente
```markdown
**Name:** Shuri
**Role:** Product Analyst

## Personality
Skeptical tester. Thorough bug hunter. Finds edge cases.
Think like a first-time user. Question everything.
```

**AGENTS.md:** Manual operativo compartido
- Dónde están almacenados los archivos
- Cómo funciona la memoria
- Qué herramientas están disponibles
- Cuándo hablar vs quedarse callado
- Cómo usar Mission Control

**HEARTBEAT.md:** Checklist para heartbeats
- Qué chequear al despertar
- Pasos a seguir sistemáticamente

## Lecciones Clave

### 1. Start Smaller
- Fue de 1 a 10 agentes muy rápido
- Mejor obtener 2-3 sólidos primero, luego agregar más

### 2. Usar Modelos Más Baratos para Trabajo Rutinario
- Heartbeats no necesitan el modelo más caro
- Reservar modelos caros para trabajo creativo

### 3. La Memoria es Difícil
- Los agentes van a olvidar
- Mientras más puedas poner en archivos (no "notas mentales"), mejor

### 4. Deja que los Agentes te Sorprendan
- A veces contribuyen a tareas que no les fueron asignadas
- Es bueno: significa que están leyendo el feed y agregando valor

### 5. Las Personalidades Importan
- Un agente "bueno en todo" es mediocre en todo
- Un agente específicamente "el tester escéptico que encuentra edge cases" realmente encontrará edge cases
- La restricción los enfoca

### 6. El Flujo de Tareas Funciona
Lifecycle: Inbox → Assigned → In Progress → Review → Done → Blocked

### 7. El Valor Real es el Efecto Compuesto
- No es cualquier entregable individual
- Es que mientras haces otro trabajo, tus agentes están moviendo tareas hacia adelante

## Aplicabilidad para Nosotros

### Situación Actual de Alberto
- **Setup actual:** Una instancia de Clawdbot en Raspberry Pi
- **Capacidad:** Sub-agentes vía `sessions_spawn`
- **Workspace:** `/home/clawdbot/clawd/`
- **Canales:** WhatsApp, potencial para otros

### Escalamiento a Mission Control Style

#### Fase 1: Fundación (Inmediato)
1. **Configurar sesiones especializadas**
   - Crear 2-3 agentes especializados (ej: researcher, writer, analyst)
   - Claves de sesión: `agent:researcher:main`, `agent:writer:main`
   - Archivos SOUL.md específicos para cada uno

2. **Implementar sistema de memoria mejorado**
   - Estructura `/memory/` más robusta
   - `WORKING.md` como estado central
   - Rutina de heartbeat que lee memoria consistentemente

3. **Setup básico de cron heartbeats**
   - Heartbeats cada 15 minutos, escalonados
   - `HEARTBEAT.md` con checklist específico

#### Fase 2: Coordinación (2-4 semanas)
1. **Base de datos compartida simple**
   - Podría ser JSON files en `/shared/`
   - O setup de Convex (free tier es generoso)
   - Schema básico: tasks, messages, agents

2. **Sistema de notificaciones básico**
   - @mentions en archivos compartidos
   - Polling simple en heartbeats

3. **UI básica (opcional)**
   - Dashboard web simple para ver estado
   - Puede ser archivo HTML + JSON polling

#### Fase 3: Sofisticación (1-3 meses)
1. **Sistema completo estilo Mission Control**
   - Convex DB con schema completo
   - React frontend
   - Sistema de notificaciones en tiempo real
   - Thread subscriptions

2. **Agentes especializados**
   - 5-8 agentes con roles muy específicos
   - Niveles de autonomía diferenciados
   - Integration con herramientas específicas

### Consideraciones Técnicas para Pi

#### Recursos
- **RAM:** Heartbeats cada 15 min son manejables
- **CPU:** Sesiones aisladas mantienen carga baja
- **Storage:** Archivos de memoria crecen lentamente
- **Network:** Convex API calls son ligeras

#### Implementación Incremental
1. **Week 1:** 2 agentes con heartbeats simples
2. **Week 2-3:** Shared workspace mejorado
3. **Week 4-6:** Base de datos compartida básica
4. **Month 2:** Sistema completo con UI

#### Ventajas del Approach
- **Evolutivo:** Cada fase agrega valor inmediatamente
- **Low-risk:** No rompe setup actual
- **Scalable:** Puede crecer hasta 10+ agentes si es útil
- **Cost-effective:** Heartbeats ahorran API calls vs always-on

### Retos Específicos para Nuestro Setup

#### Limitaciones de Hardware
- Pi puede manejar 3-5 agentes simultáneos cómodamente
- Más de 8 agentes requeriría optimización de memoria

#### Complexity Management
- Empezar simple: 2 agentes especializados
- Añadir funcionalidad gradualmente
- No intentar replicar todo inmediatamente

#### Integration con Workflow Actual
- Mantener sesión principal (direct WhatsApp)
- Agentes especializados para tareas específicas
- Handoff claro entre manual y automatizado

### Recomendación de Implementación

**Semana 1-2: Proof of Concept**
- Configurar agente `researcher` y `writer`
- Heartbeats básicos cada 15 minutos
- Shared memory en archivos

**Mes 1: Sistema Básico**
- 3-4 agentes especializados
- Sistema de tareas en JSON files
- UI web simple (read-only dashboard)

**Mes 2-3: Sistema Avanzado**
- Migration a Convex
- @mentions y notifications
- Frontend interactivo

**Resultado Esperado:**
Un sistema que permite delegar research, writing, analysis, y coordination a agentes especializados, mientras mantienes control y oversight a través de heartbeats, daily standups, y review workflows.

El valor principal será poder decir "investiga competidores de X" y tener un equipo de agentes que collaborate para entregar research completo, draft de comparación, y análisis SEO - todo mientras haces otra cosa.

---

*Análisis completado como subagente de investigación. Sistema Mission Control representa un approach sólido y escalable para orquestación multi-agente que puede adaptarse efectivamente al setup de Alberto en Pi.*