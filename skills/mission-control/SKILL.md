---
name: mission-control
description: Web dashboard for managing multi-agent Clawdbot systems. Provides real-time monitoring of sessions, system resources (CPU/RAM/disk), sub-agent management with personality configuration, task boards, heartbeat check configuration, workspace file editing, cron job management, and chat interface. Use when setting up a command center for a Clawdbot deployment, monitoring agent activity, or managing multi-agent operations through a web UI.
---

# Mission Control

Mission Control is a comprehensive web dashboard for managing multi-agent Clawdbot systems. It provides a unified interface for monitoring, configuration, and operational control of your Clawdbot deployment.

## Quick Start

Get Mission Control running in 4 commands:

```bash
# 1. Extract the skill to your desired location
cp -r assets/* ./mission-control/
cd mission-control/

# 2. Run the setup script (installs deps, builds frontend, initializes data)
./scripts/setup.sh

# 3. Start Mission Control
./start.sh

# 4. Open in browser
open http://localhost:3001
```

The setup script will generate a random auth token. Copy it from the output to access the dashboard.

## Core Features

### 🖥️ System Monitoring
- **Real-time Metrics**: CPU, memory, disk usage with live updates
- **Network Status**: Interface IPs and connectivity information
- **Gateway Health**: Clawdbot gateway configuration and status
- **Uptime Tracking**: System and service uptime monitoring

### 👥 Session Management
- **Active Sessions**: View all running agent sessions
- **Message History**: Browse conversation transcripts
- **Chat Interface**: Send messages directly to any session
- **Session Control**: Reset, cleanup, and manage session lifecycle
- **Subagent Spawning**: Create new parallel agent sessions for tasks

### 🤖 Sub-Agent Configuration
- **Personality Design**: Configure agent personalities and expertise areas
- **Model Selection**: Choose AI models for different agent roles
- **Role Management**: Define agent roles (research, content, analysis, etc.)
- **Invocation Tracking**: Monitor agent usage and performance

### 📋 Task Board
- **Kanban Interface**: Organize tasks across backlog, in-progress, and done columns
- **Task Management**: Create, update, and track project tasks
- **Priority System**: Set task priorities and deadlines
- **Status Workflow**: Move tasks through completion stages

### ❤️ Heartbeat Configuration
- **Periodic Checks**: Configure automated monitoring checks
- **Check Types**: Email, calendar, social media, system health
- **Frequency Control**: Set check intervals and priorities
- **Overdue Detection**: Identify missed or delayed checks

### 📁 Workspace Editing
- **Core Files**: Edit SOUL.md, MEMORY.md, HEARTBEAT.md, USER.md
- **Memory Management**: Browse daily memory files by date
- **Configuration Files**: Update TOOLS.md, AGENTS.md, IDENTITY.md
- **Syntax Highlighting**: Markdown editor with live preview

### ⏰ Cron Job Management
- **Job Scheduling**: View and manage scheduled tasks
- **Manual Execution**: Trigger cron jobs on-demand
- **Job Status**: Monitor execution history and results
- **Configuration**: Update job schedules and parameters

### 💬 Command Interface
- **Preference System**: Send configuration changes to main agent
- **Direct Commands**: Execute agent commands through web interface
- **History Tracking**: View command history and responses
- **Auto-processing**: Commands automatically routed to appropriate agent

## Architecture

Mission Control follows a three-tier architecture:

```
React Frontend (Vite + Tailwind) ←→ Express API Server ←→ Clawdbot Gateway
```

- **Frontend**: Modern React SPA with real-time updates
- **Backend**: Express.js API server with authentication
- **Gateway Integration**: Direct proxy to Clawdbot tool system
- **Data Persistence**: JSON files for configuration and state

## Configuration

### Authentication
Mission Control uses token-based authentication:

```bash
# Set custom auth token (optional)
echo "your-secret-token" > data/.mc-token
chmod 600 data/.mc-token

# Or use auto-generated token from setup
cat data/.mc-token
```

### Port Configuration
Default port is 3001. To change:

```bash
# Edit start.sh
PORT=3333 node server.js

# Or set environment variable
export PORT=3333
./start.sh
```

### Gateway URL
Mission Control auto-detects the Clawdbot gateway at `http://127.0.0.1:18789`. For custom setups:

```bash
# Edit server.js line 8
const GATEWAY = 'http://your-gateway-host:port';
```

## Available Scripts

### Production Scripts
- `./start.sh` - Start Mission Control server
- `./scripts/setup.sh` - Complete installation and build process

### Development Scripts
- `./scripts/dev.sh` - Start development servers with hot reload
- `./scripts/build.sh` - Build frontend for production

### Maintenance Scripts
- `./scripts/health-check.sh` - Verify system health
- `./scripts/backup.sh` - Backup data and configuration
- `./scripts/restart.sh` - Restart all services
- `./scripts/monitor.sh` - System monitoring and logging

## Data Structure

Mission Control stores configuration in JSON files:

### Core Data Files
- **agents.json** - Agent registry and metadata
- **subagents.json** - Sub-agent personality configurations
- **tasks.json** - Task board state and history
- **heartbeat-checks.json** - Periodic check definitions
- **preferences.json** - UI preferences and command history

### Template Structure
```json
// subagents.json example
{
  "agents": [
    {
      "id": "research-analyst",
      "name": "Research Assistant", 
      "emoji": "🔍",
      "role": "Research & Analysis",
      "personality": "Analytical, thorough, detail-oriented...",
      "expertise": ["Web research", "Data analysis", "Report writing"],
      "model": "anthropic/claude-sonnet-4-20250514",
      "status": "active"
    }
  ]
}
```

## Customization

### Adding Custom Checks
Edit `data/heartbeat-checks.json` to add monitoring checks:

```json
{
  "id": "custom_check",
  "name": "📊 Custom Monitor", 
  "description": "Monitor custom system metric",
  "enabled": true,
  "frequencyHours": 2,
  "priority": "high"
}
```

### Creating Sub-Agents
Use the web interface or directly edit `data/subagents.json`:

1. Define personality and expertise areas
2. Select appropriate AI model
3. Set role and status
4. Configure invocation tracking

### Task Board Setup
The kanban board supports custom task workflows:

- **Backlog**: New and planned tasks
- **In Progress**: Active work
- **Done**: Completed tasks
- **Custom Columns**: Modify `data/tasks.json` structure

## Integration Points

### Clawdbot Gateway
- **Tool Invocations**: All gateway tools accessible via proxy
- **Session Management**: Direct integration with session system
- **Configuration**: Live gateway config reading and writing

### Workspace Files
- **Direct Access**: Read/write core agent configuration files
- **Memory Integration**: Browse and edit daily memory entries
- **Heartbeat Management**: Live editing of HEARTBEAT.md checkboxes

### Cron System
- **Job Management**: Full CRUD operations on scheduled tasks
- **Execution Control**: Manual job triggering and monitoring
- **History Access**: View execution logs and results

## Security Considerations

### File Access
- **Whitelist**: Only predefined workspace files accessible
- **Path Validation**: Prevents directory traversal attacks
- **Permission Checks**: Validates file system permissions

### Network Security
- **Localhost Binding**: Gateway communication limited to localhost
- **Token Authentication**: Configurable access control
- **Error Sanitization**: Gateway errors filtered for security

### Data Protection
- **Credential Exclusion**: No real tokens or secrets in templates
- **Backup Encryption**: Backup script supports encrypted archives
- **Session Isolation**: Session data properly scoped and cleaned

## Troubleshooting

### Common Issues

**Frontend won't load**
```bash
# Rebuild frontend
./scripts/build.sh
# Check if dist/ directory exists
ls -la frontend/dist/
```

**Gateway connection failed**
```bash
# Verify gateway is running
curl http://127.0.0.1:18789/health
# Check gateway URL in server.js
```

**Authentication issues**
```bash
# Check token file
cat data/.mc-token
# Verify file permissions
ls -la data/.mc-token
```

**Port conflicts**
```bash
# Check what's using port 3001
lsof -i :3001
# Change port in start.sh
```

### Health Check
Run the health check script to diagnose issues:

```bash
./scripts/health-check.sh
```

This validates:
- Server responsiveness
- Gateway connectivity  
- File permissions
- Data file integrity
- Frontend build status

## Bundled Resources

This skill includes complete source code in the `assets/` directory:

### Application Files
- `server.js` - Express API server
- `start.sh` - Production startup script
- `package.json` - Node.js dependencies
- `frontend/` - Complete React application with built dist/

### Scripts Collection
- `scripts/setup.sh` - Installation and setup automation
- `scripts/dev.sh` - Development environment
- `scripts/build.sh` - Production build process
- `scripts/health-check.sh` - System health validation
- `scripts/backup.sh` - Data backup utilities
- `scripts/monitor.sh` - System monitoring
- `scripts/restart.sh` - Service restart automation

### Data Templates
- `data/agents.json` - Agent registry template
- `data/subagents.json` - Sub-agent configuration examples
- `data/heartbeat-checks.json` - Monitoring check templates
- `data/tasks.json` - Empty task board
- `data/preferences.json` - Default UI preferences

### Reference Documentation
- `references/api-reference.md` - Complete API endpoint documentation
- `references/architecture.md` - System architecture and design patterns

Mission Control provides a powerful, unified interface for managing complex multi-agent Clawdbot deployments. Its modular architecture and comprehensive feature set make it ideal for both development and production environments.