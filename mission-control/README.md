# Mission Control 🎛️

**Version 2.0** - Advanced web UI for managing your multi-agent Clawdbot system with real-time monitoring, WebSocket support, and enhanced features.

## 🚀 Quick Start

```bash
# Start the server
./start.sh

# Or use development mode with hot reload
./scripts/dev.sh

# Health check
./scripts/health-check.sh

# Real-time monitoring dashboard
./scripts/monitor.sh
```

## 🌐 Access

- **Local:** http://localhost:3333
- **Network:** http://192.168.86.40:3333
- **WebSocket:** ws://192.168.86.40:3333

## ✨ Features

### 🎯 Dashboard
- **Real-time agent monitoring** with live status updates
- **System health indicators** (CPU, RAM, disk, uptime)
- **Gateway status** monitoring with connection health
- **Message sending** to agents with instant feedback
- **Task spawning** for parallel agent operations
- **Session history** viewing with formatted output

### 📋 Task Management
- **Kanban-style task board** (enhanced version coming soon)
- **Task filtering** by agent, priority, status
- **Batch operations** for multiple tasks
- **Real-time task updates** via WebSocket
- **Task assignment** to specific agents

### 📈 Activity Monitoring
- **Real-time activity feed** for all system events
- **Session tracking** with detailed metrics
- **Cron job monitoring** and execution logs
- **WebSocket event broadcasting** for live updates

### ⚙️ System Features
- **WebSocket connectivity** for real-time updates
- **System resource monitoring** (CPU, RAM, disk usage)
- **Gateway health checks** with automatic retry
- **Notification system** with different alert types
- **Data backup** and recovery systems
- **Enhanced error handling** with user-friendly messages

## 🔧 API Endpoints

### Health & System
- `GET /api/health` - Complete system health check
- `GET /api/system` - Real-time system statistics

### Sessions & Agents
- `GET /api/sessions` - List active sessions
- `POST /api/sessions/:key/send` - Send message to agent
- `POST /api/sessions/spawn` - Spawn new agent task
- `GET /api/agents` - List configured agents
- `POST /api/agents` - Add new agent
- `DELETE /api/agents/:id` - Remove agent

### Tasks
- `GET /api/tasks` - List tasks with filtering
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/batch` - Batch operations

### Activity & Monitoring
- `GET /api/activity` - Get activity feed
- `GET /api/cron` - List cron jobs
- `POST /api/cron` - Create scheduled job

## 🔌 Real-time Features

Mission Control uses WebSocket connections for real-time updates:

- **Live agent status** updates
- **System metrics** streaming
- **Task board** real-time updates
- **Notification** broadcasting
- **Gateway status** changes
- **Activity feed** live streaming

## 📜 Scripts

### Core Scripts
- `./start.sh` - Production server startup
- `./scripts/dev.sh` - Development mode with hot reload
- `./scripts/restart.sh` - Safe server restart
- `./scripts/build.sh` - Build frontend and install dependencies

### Monitoring & Maintenance
- `./scripts/monitor.sh` - Real-time CLI dashboard
- `./scripts/health-check.sh` - Comprehensive health check
- `./scripts/backup.sh` - Data backup with versioning

### Script Usage Examples
```bash
# Start monitoring dashboard
./scripts/monitor.sh

# Create backup before changes
./scripts/backup.sh

# Check system health
./scripts/health-check.sh

# Restart server if needed
./scripts/restart.sh
```

## 📊 System Requirements

### Raspberry Pi Optimization
- **ARM64 compatible** - Tested on Raspberry Pi
- **Memory efficient** - Works with 906MB RAM
- **CDN-based frontend** - No heavy build process
- **Minimal dependencies** - Only essential packages

### Dependencies
**Backend:**
- express - Web server framework
- ws - WebSocket server
- cors - Cross-origin resource sharing
- node-cron - Scheduled task management

**Frontend:**
- React 18 (CDN)
- Tailwind CSS (CDN)
- Babel (CDN for JSX)

## 🏗️ Architecture

```
mission-control/
├── server.js              # Enhanced Express + WebSocket server
├── start.sh               # Production startup
├── data/                  # JSON data storage
│   ├── agents.json        # Agent configurations
│   └── tasks.json         # Task board data
├── frontend/dist/         # Optimized single-page app
├── scripts/               # Utility scripts
│   ├── dev.sh            # Development mode
│   ├── monitor.sh        # CLI dashboard
│   ├── health-check.sh   # System health
│   ├── restart.sh        # Server restart
│   └── backup.sh         # Data backup
└── backups/               # Automatic backup storage
```

## 🎨 UI/UX Features

### Design System
- **Dark theme** optimized for command centers
- **Real-time animations** for status changes
- **Responsive design** for mobile and desktop
- **Notification system** with toast messages
- **Loading states** with shimmer effects
- **Modal dialogs** with backdrop blur

### Accessibility
- **Keyboard navigation** support
- **Screen reader** friendly
- **High contrast** color scheme
- **Responsive breakpoints** for all devices

## 🔒 Security Features

- **Input validation** on all endpoints
- **Error handling** without data exposure
- **Graceful degradation** when services are unavailable
- **Data backup** with automatic retention
- **Session isolation** for different agents

## 📈 Performance

### Optimizations
- **WebSocket connections** reduce server load
- **Efficient polling** with smart intervals
- **Data caching** for repeated requests
- **Background monitoring** with minimal overhead
- **Memory-conscious** design for Pi constraints

### Monitoring
- **System resource tracking** (CPU, RAM, disk)
- **Gateway connection** health monitoring
- **WebSocket connection** status tracking
- **Error rate** monitoring and alerting

## 🔧 Troubleshooting

### Common Issues

**Server won't start:**
```bash
# Check if port is in use
lsof -i:3333

# Kill existing processes
pkill -f "node server.js"

# Restart
./scripts/restart.sh
```

**WebSocket connection issues:**
```bash
# Check health
./scripts/health-check.sh

# Test WebSocket (if wscat installed)
echo '{"type":"ping"}' | wscat -c ws://localhost:3333
```

**Gateway connection problems:**
```bash
# Check Gateway status
curl http://localhost:18789/tools/invoke \
  -H "Content-Type: application/json" \
  -d '{"tool": "sessions_list", "args": {}}'
```

### Logs
- **Server logs:** `/tmp/mission-control.log` (when using nohup)
- **Real-time monitoring:** `./scripts/monitor.sh`
- **Health check:** `./scripts/health-check.sh`

## 🔮 What's Next

Planned improvements for future versions:
- **Advanced task workflows** with dependencies
- **Agent performance metrics** and analytics
- **Custom dashboards** with drag-and-drop widgets
- **Alert rules** and automated responses
- **Multi-node support** for distributed systems
- **Plugin system** for custom integrations

## 💡 Tips

- Use `./scripts/monitor.sh` for real-time CLI monitoring
- Create backups before major changes with `./scripts/backup.sh`
- The WebSocket connection enables live updates without page refresh
- System stats update every 30 seconds automatically
- Gateway health is checked every 5 minutes
- Task data is automatically backed up on changes

---

**Built for Alberto's Clawdbot system** - A command center worthy of a multi-agent AI operation! 🚀