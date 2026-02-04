# Mission Control API Reference

The Mission Control API provides comprehensive management capabilities for Clawdbot systems. All endpoints require authentication via token (if configured).

## Authentication

Authentication is handled via Bearer token in the `Authorization` header or `token` query parameter.

### Auth Endpoints
- **GET** `/api/auth/status` - Check authentication status
- **POST** `/api/auth/login` - Authenticate with token

## System Status

### GET `/api/status`
Returns comprehensive system information including:
- System uptime and performance metrics
- Memory usage (total, used, free, percentage)
- CPU information (cores, model, load average)
- Disk usage for main storage and SSD
- Network interfaces and IPs
- Gateway configuration
- Heartbeat configuration
- Session information

## Gateway Management

### GET `/api/gateway/config`
Get current Clawdbot gateway configuration.

### PATCH `/api/gateway/config`
Update gateway configuration.

### POST `/api/gateway/restart`
Restart the Clawdbot gateway.

## Sessions Management

### GET `/api/sessions`
List active sessions with optional filtering:
- `limit` - Number of sessions to return (default: 20)
- `kinds` - Comma-separated session types to filter
- `activeMinutes` - Filter by activity in last N minutes
- `messageLimit` - Limit messages per session

### GET `/api/sessions/:key/history`
Get message history for a specific session:
- `limit` - Number of messages (default: 20)
- `includeTools` - Include tool calls (default: false)

### POST `/api/sessions/:key/send`
Send message to a session.

### POST `/api/sessions/spawn`
Spawn a new subagent session.

### GET `/api/sessions/:key/status`
Get detailed status of a specific session.

### POST `/api/sessions/:key/reset`
Reset/clear a session's history.

### DELETE `/api/sessions/:key`
Delete a session and its transcript.

### POST `/api/sessions/cleanup`
Cleanup old subagent sessions:
- `maxAgeHours` - Delete sessions older than N hours (default: 24)

## Heartbeat Management

### GET `/api/heartbeat/checks`
Get heartbeat checks configuration with status:
- Returns check definitions with last run times and overdue status
- Merges with state from heartbeat-state.json

### PUT `/api/heartbeat/checks`
Update entire heartbeat checks configuration.

### PATCH `/api/heartbeat/checks/:id`
Update specific heartbeat check.

### POST `/api/heartbeat/checks`
Add new heartbeat check.

### DELETE `/api/heartbeat/checks/:id`
Remove heartbeat check.

## Sub-Agents Management

### GET `/api/subagents`
Get all configured sub-agents with their personalities, expertise, and invocation stats.

### POST `/api/subagents`
Create new sub-agent configuration.

### PATCH `/api/subagents/:id`
Update sub-agent configuration.

### DELETE `/api/subagents/:id`
Remove sub-agent configuration.

## Preferences & Command Bar

### GET `/api/preferences`
Get preferences/commands history.

### POST `/api/preferences`
Submit new preference/command - automatically notifies main agent.

### PATCH `/api/preferences/:id`
Update preference entry status.

### DELETE `/api/preferences/:id`
Remove preference entry.

## Tools Management

### GET `/api/tools`
Get tools status and configuration.

### PATCH `/api/tools/:id`
Update tool status/configuration.

## Skills Management

### GET `/api/skills`
Get skills status and information.

### GET `/api/skills/:id/content`
Get skill content (SKILL.md).

### PATCH `/api/skills/:id`
Update skill status.

## Task Board

### GET `/api/tasks`
Get all tasks from the kanban board.

### POST `/api/tasks`
Create new task.

### PUT `/api/tasks`
Update entire tasks collection.

## Agents Registry

### GET `/api/agents`
Get agents registry.

### PUT `/api/agents`
Update agents registry.

## Workspace File Management

### GET `/api/files/:name`
Read workspace files. Supported files:
- `memory` → MEMORY.md
- `heartbeat` → HEARTBEAT.md
- `soul` → SOUL.md
- `user` → USER.md
- `identity` → IDENTITY.md
- `tools` → TOOLS.md
- `agents` → AGENTS.md

### PUT `/api/files/:name`
Write workspace files.

### GET `/api/memory/recent`
Get recent memory entries (last 10 days).

### GET `/api/memory/:date`
Read specific memory day file (YYYY-MM-DD format).

### PUT `/api/memory/:date`
Write specific memory day file.

## HEARTBEAT.md Integration

### GET `/api/pendientes`
Extract pending items from HEARTBEAT.md checkboxes.

### POST `/api/pendientes`
Add new pending item to HEARTBEAT.md.

### PATCH `/api/pendientes/:line`
Toggle checkbox state in HEARTBEAT.md.

## Cron Job Management

### GET `/api/cron`
List all cron jobs.

### PATCH `/api/cron/:id`
Update cron job configuration.

### DELETE `/api/cron/:id`
Remove cron job.

### POST `/api/cron/:id/run`
Manually trigger cron job execution.

## Error Handling

All endpoints return JSON responses. Errors include:
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (missing/invalid token)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

Error responses contain `{"error": "description"}` format.