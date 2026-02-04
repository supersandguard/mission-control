# Mission Control Architecture

Mission Control is a comprehensive web dashboard for managing multi-agent Clawdbot systems. It provides real-time monitoring, configuration management, and operational control through a modern web interface.

## Overview

Mission Control consists of three main components:

1. **Express.js Backend** - API server with WebSocket support
2. **React Frontend** - Modern SPA built with Vite and Tailwind CSS
3. **Clawdbot Gateway Integration** - Proxy layer for seamless integration

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│  React Frontend │◄──►│  Express Server │◄──►│ Clawdbot Gateway│
│  (Port 3001)    │    │  (Port 3333)    │    │  (Port 18789)   │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
    Static Files           JSON Data Files        Tool Invocations
    (dist/)                (data/)                Sessions Management
                                                  Configuration
```

## Backend Architecture

### Express Server (server.js)

The backend serves as the central hub that:
- Serves the React SPA via static file serving
- Provides REST API for frontend consumption
- Acts as proxy to Clawdbot Gateway
- Manages local data persistence
- Handles authentication via token

### Key Components

#### 1. Gateway Proxy Layer
- **Function**: `gw(tool, args)` - Universal gateway communication
- **Purpose**: Abstracts Clawdbot tool invocations
- **Usage**: All session management, configuration, and tool operations

#### 2. Data Management
- **Location**: `data/` directory with JSON files
- **Files**: agents.json, subagents.json, tasks.json, preferences.json, etc.
- **Functions**: `readData()`, `writeData()` for persistence

#### 3. Authentication
- **Token Storage**: `data/.mc-token` (600 permissions)
- **Middleware**: `auth()` function validates Bearer tokens
- **Flexibility**: No token = open access, token present = required auth

#### 4. Workspace Integration
- **Location**: `/home/clawdbot/clawd` workspace
- **Files**: SOUL.md, MEMORY.md, HEARTBEAT.md, etc.
- **Access**: Direct file system operations for core agent files

## Frontend Architecture

### React SPA Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/              # Route components
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API communication
│   └── utils/              # Helper functions
├── public/                 # Static assets
└── dist/                   # Built output (served by Express)
```

### Key Features

#### 1. Real-time Updates
- **Polling**: Automatic refresh of status data
- **Frequency**: Configurable refresh intervals (default: 5s)
- **Scope**: System status, session activity, heartbeat state

#### 2. Multi-panel Dashboard
- **System Monitor**: CPU, memory, disk, network status
- **Session Management**: Active sessions, message history, spawning
- **Agent Configuration**: Sub-agent personalities and expertise
- **Task Board**: Kanban-style task management
- **Heartbeat Config**: Periodic check configuration

#### 3. Interactive Chat
- **Direct Communication**: Chat with any session
- **Command Bar**: Send preferences/commands to main agent
- **History Access**: Browse conversation transcripts

## Data Flow

### 1. Frontend → Backend → Gateway

```
User Action → React Component → API Call → Express Route → Gateway Tool → Response Chain
```

Example: Spawning a subagent
1. User clicks "Spawn Agent" in React UI
2. Component calls `/api/sessions/spawn` with task description
3. Express route calls `gw('sessions_spawn', taskData)`
4. Gateway creates new agent session
5. Response propagates back to update UI

### 2. Data Persistence

```
User Input → Express Endpoint → JSON File Write → File System
```

Example: Updating subagent personality
1. User edits agent config in UI
2. PATCH request to `/api/subagents/:id`
3. Express loads `data/subagents.json`
4. Merges changes and writes back to file
5. Updated data returned to frontend

### 3. Real-time Monitoring

```
React Hook → Polling Timer → API Request → System Data → UI Update
```

Example: System status updates
1. React component uses polling hook
2. Timer triggers `/api/status` call every 5s
3. Express gathers system metrics
4. Fresh data updates dashboard metrics

## WebSocket Events (Future)

While currently using HTTP polling, the architecture supports WebSocket integration:

```javascript
// Planned WebSocket events
ws.send({ type: 'session_message', sessionKey: 'agent:main:main' });
ws.send({ type: 'heartbeat_trigger', checkId: 'email' });
ws.send({ type: 'system_alert', level: 'warning', message: 'High CPU' });
```

## Security Model

### Authentication
- **Token-based**: Single shared token for simplicity
- **Storage**: Secure file with 600 permissions
- **Validation**: Middleware checks all protected routes
- **Flexibility**: Optional - no token means open access

### File Access
- **Whitelist**: Only predefined workspace files accessible
- **Validation**: Path validation prevents directory traversal
- **Scope**: Limited to agent workspace directory

### Gateway Integration
- **Localhost**: Gateway communication over localhost only
- **Tool Validation**: All gateway calls go through controlled proxy
- **Error Handling**: Gateway errors caught and sanitized

## Scalability Considerations

### Current Design
- **Single Instance**: Designed for single Clawdbot deployment
- **Local Files**: JSON file persistence for simplicity
- **Memory Footprint**: Minimal resource requirements

### Future Enhancements
- **Multi-node**: Support for multiple Clawdbot instances
- **Database**: Upgrade to SQLite or PostgreSQL for larger deployments
- **Real-time**: WebSocket support for instant updates
- **Authentication**: Multi-user support with role-based access

## Development Workflow

### Local Development
```bash
# Backend + Frontend development
./scripts/dev.sh

# Frontend only (with proxy to backend)
cd frontend && npm run dev

# Backend only
npm run dev
```

### Production Deployment
```bash
# Build frontend
./scripts/build.sh

# Start production server
./start.sh
```

### Monitoring
```bash
# Health check
./scripts/health-check.sh

# System monitoring
./scripts/monitor.sh

# Backup data
./scripts/backup.sh
```

## Configuration

### Environment Variables
- `PORT`: Express server port (default: 3333)
- `GATEWAY`: Clawdbot gateway URL (default: http://127.0.0.1:18789)
- `WORKSPACE`: Agent workspace path (default: /home/clawdbot/clawd)

### Data Files
- **preferences.json**: UI preferences and theme settings
- **subagents.json**: Agent personality configurations
- **heartbeat-checks.json**: Periodic check definitions
- **tasks.json**: Task board state
- **agents.json**: Active agent registry

This architecture provides a solid foundation for managing complex multi-agent systems while maintaining simplicity and reliability.