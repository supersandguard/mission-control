const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');
const cron = require('node-cron');
const os = require('os');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = 3333;

// Store connected WebSocket clients
const clients = new Set();

// System stats cache
let systemStats = {
  lastUpdate: null,
  cpu: 0,
  memory: 0,
  disk: 0,
  uptime: 0,
  gatewayStatus: 'unknown'
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// Enhanced logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');
  clients.add(ws);
  
  // Send current system stats to new client
  ws.send(JSON.stringify({
    type: 'system_stats',
    data: systemStats
  }));

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

// Broadcast to all connected clients
function broadcast(message) {
  const payload = JSON.stringify(message);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// Enhanced Gateway proxy function with retry and error handling
async function gatewayInvoke(tool, args = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch('http://127.0.0.1:18789/tools/invoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool, args }),
        timeout: 10000 // 10 second timeout
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error?.message || 'Gateway error');
      }
      
      systemStats.gatewayStatus = 'connected';
      return data.result?.details || JSON.parse(data.result?.content?.[0]?.text || '{}');
    } catch (error) {
      systemStats.gatewayStatus = 'error';
      if (i === retries - 1) {
        console.error(`Gateway invoke failed after ${retries} retries (${tool}):`, error.message);
        throw error;
      }
      console.warn(`Gateway invoke attempt ${i + 1} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
    }
  }
}

// System monitoring functions
async function getSystemStats() {
  try {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const uptime = os.uptime();
    
    // Calculate CPU usage (simplified)
    const cpuUsage = cpus.reduce((acc, cpu, index) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
      const idle = cpu.times.idle;
      return acc + (100 - (idle / total * 100));
    }, 0) / cpus.length;

    const memoryUsage = ((totalMem - freeMem) / totalMem) * 100;

    // Try to get disk usage (Linux specific)
    let diskUsage = 0;
    try {
      const { execSync } = require('child_process');
      const dfOutput = execSync('df / | tail -1 | awk \'{print $5}\' | sed \'s/%//\'').toString().trim();
      diskUsage = parseInt(dfOutput) || 0;
    } catch (err) {
      diskUsage = 0; // Fallback if df command fails
    }

    return {
      lastUpdate: new Date().toISOString(),
      cpu: Math.round(cpuUsage),
      memory: Math.round(memoryUsage),
      disk: diskUsage,
      uptime: Math.round(uptime),
      gatewayStatus: systemStats.gatewayStatus
    };
  } catch (error) {
    console.error('Error getting system stats:', error);
    return systemStats; // Return cached stats on error
  }
}

// Helper functions for data files with backup and validation
async function readDataFile(filename) {
  try {
    const content = await fs.readFile(path.join(__dirname, 'data', filename), 'utf8');
    const data = JSON.parse(content);
    
    // Validate data structure
    if (filename === 'agents.json' && !data.agents) {
      throw new Error('Invalid agents.json structure');
    }
    if (filename === 'tasks.json' && (!data.tasks || typeof data.nextId !== 'number')) {
      throw new Error('Invalid tasks.json structure');
    }
    
    return data;
  } catch (error) {
    console.warn(`Error reading ${filename}, using defaults:`, error.message);
    
    // Return default structures with error handling
    if (filename === 'agents.json') {
      return { 
        agents: [{
          id: "clawd",
          name: "Clawd",
          role: "Lead / Personal Assistant",
          emoji: "🖤",
          sessionKey: "agent:main:main",
          description: "Squad lead. Handles direct requests, delegates, coordinates.",
          level: "lead",
          color: "#e94560"
        }]
      };
    } else if (filename === 'tasks.json') {
      return { tasks: [], nextId: 1 };
    }
    throw error;
  }
}

async function writeDataFile(filename, data) {
  try {
    const filepath = path.join(__dirname, 'data', filename);
    const backupPath = `${filepath}.backup`;
    
    // Create backup of existing file
    try {
      await fs.copyFile(filepath, backupPath);
    } catch (err) {
      // File might not exist yet, that's okay
    }
    
    // Write new data with pretty formatting
    await fs.writeFile(filepath, JSON.stringify(data, null, 2));
    
    // Broadcast data changes to connected clients
    broadcast({
      type: 'data_update',
      filename: filename.replace('.json', ''),
      data: data
    });
    
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
    throw error;
  }
}

// Enhanced API Routes with better error handling

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Test gateway connection
    let gatewayHealth = 'unknown';
    try {
      await gatewayInvoke('sessions_list', { limit: 1 }, 1);
      gatewayHealth = 'healthy';
    } catch (err) {
      gatewayHealth = 'error';
    }

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      gateway: gatewayHealth,
      system: await getSystemStats()
    };

    res.json(health);
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// System stats endpoint
app.get('/api/system', async (req, res) => {
  try {
    const stats = await getSystemStats();
    systemStats = stats;
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enhanced sessions endpoints
app.get('/api/sessions', async (req, res) => {
  try {
    const result = await gatewayInvoke('sessions_list', {
      limit: parseInt(req.query.limit) || 10,
      kinds: req.query.kinds ? req.query.kinds.split(',') : undefined,
      activeMinutes: req.query.activeMinutes ? parseInt(req.query.activeMinutes) : undefined
    });
    
    // Broadcast session update to WebSocket clients
    broadcast({
      type: 'sessions_update',
      data: result
    });
    
    res.json(result);
  } catch (error) {
    res.status(503).json({ error: 'Gateway unavailable: ' + error.message });
  }
});

app.get('/api/sessions/:key/history', async (req, res) => {
  try {
    const result = await gatewayInvoke('sessions_history', {
      sessionKey: req.params.key,
      limit: parseInt(req.query.limit) || 50,
      includeTools: req.query.includeTools === 'true'
    });
    res.json(result);
  } catch (error) {
    res.status(503).json({ error: 'Gateway unavailable: ' + error.message });
  }
});

app.post('/api/sessions/:key/send', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    const result = await gatewayInvoke('sessions_send', {
      sessionKey: req.params.key,
      message: message.trim()
    });

    // Broadcast message sent event
    broadcast({
      type: 'message_sent',
      sessionKey: req.params.key,
      message: message.trim(),
      timestamp: new Date().toISOString()
    });

    res.json(result);
  } catch (error) {
    res.status(503).json({ error: 'Gateway unavailable: ' + error.message });
  }
});

app.post('/api/sessions/spawn', async (req, res) => {
  try {
    const { task, label, model, agentId } = req.body;
    if (!task || !task.trim()) {
      return res.status(400).json({ error: 'Task cannot be empty' });
    }

    const result = await gatewayInvoke('sessions_spawn', {
      task: task.trim(),
      label: label || `Task-${Date.now()}`,
      model: model || undefined,
      agentId: agentId || undefined
    });

    // Broadcast spawn event
    broadcast({
      type: 'session_spawned',
      task: task.trim(),
      label: label,
      timestamp: new Date().toISOString()
    });

    res.json(result);
  } catch (error) {
    res.status(503).json({ error: 'Gateway unavailable: ' + error.message });
  }
});

// Enhanced agents endpoints
app.get('/api/agents', async (req, res) => {
  try {
    const data = await readDataFile('agents.json');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/agents', async (req, res) => {
  try {
    // Validate agents data
    if (!req.body.agents || !Array.isArray(req.body.agents)) {
      return res.status(400).json({ error: 'Invalid agents data structure' });
    }

    await writeDataFile('agents.json', req.body);
    res.json({ success: true, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/agents', async (req, res) => {
  try {
    const { name, role, emoji, sessionKey, description, level, color } = req.body;
    
    // Validate required fields
    if (!name || !sessionKey) {
      return res.status(400).json({ error: 'Name and sessionKey are required' });
    }

    const data = await readDataFile('agents.json');
    const newAgent = {
      id: sessionKey.split(':').pop() || name.toLowerCase().replace(/\s+/g, '-'),
      name,
      role: role || 'Agent',
      emoji: emoji || '🤖',
      sessionKey,
      description: description || 'Agent description',
      level: level || 'agent',
      color: color || '#3b82f6'
    };

    // Check for duplicate sessionKey
    if (data.agents.some(agent => agent.sessionKey === sessionKey)) {
      return res.status(400).json({ error: 'Agent with this session key already exists' });
    }

    data.agents.push(newAgent);
    await writeDataFile('agents.json', data);

    res.json(newAgent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/agents/:id', async (req, res) => {
  try {
    const data = await readDataFile('agents.json');
    const agentIndex = data.agents.findIndex(agent => agent.id === req.params.id);
    
    if (agentIndex === -1) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    data.agents.splice(agentIndex, 1);
    await writeDataFile('agents.json', data);

    res.json({ success: true, deleted: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enhanced tasks endpoints
app.get('/api/tasks', async (req, res) => {
  try {
    const data = await readDataFile('tasks.json');
    
    // Add filtering support
    let filteredTasks = data.tasks;
    if (req.query.status) {
      filteredTasks = filteredTasks.filter(task => task.status === req.query.status);
    }
    if (req.query.assignedTo) {
      filteredTasks = filteredTasks.filter(task => task.assignedTo === req.query.assignedTo);
    }
    if (req.query.priority) {
      filteredTasks = filteredTasks.filter(task => task.priority === req.query.priority);
    }

    res.json({ tasks: filteredTasks, total: data.tasks.length, filtered: filteredTasks.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description, priority, assignedTo, dueDate } = req.body;
    
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const data = await readDataFile('tasks.json');
    const newTask = {
      id: data.nextId,
      title: title.trim(),
      description: description?.trim() || '',
      status: 'backlog',
      priority: priority || 'medium',
      assignedTo: assignedTo || null,
      dueDate: dueDate || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: []
    };

    data.tasks.push(newTask);
    data.nextId++;
    
    await writeDataFile('tasks.json', data);

    // Broadcast task creation
    broadcast({
      type: 'task_created',
      task: newTask
    });

    res.json(newTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const updates = req.body;
    
    const data = await readDataFile('tasks.json');
    const taskIndex = data.tasks.findIndex(task => task.id === taskId);
    
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Update task with provided fields
    const updatedTask = {
      ...data.tasks[taskIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    data.tasks[taskIndex] = updatedTask;
    await writeDataFile('tasks.json', data);

    // Broadcast task update
    broadcast({
      type: 'task_updated',
      task: updatedTask
    });

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const data = await readDataFile('tasks.json');
    const taskIndex = data.tasks.findIndex(task => task.id === taskId);
    
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const deletedTask = data.tasks.splice(taskIndex, 1)[0];
    await writeDataFile('tasks.json', data);

    // Broadcast task deletion
    broadcast({
      type: 'task_deleted',
      taskId: taskId
    });

    res.json({ success: true, deleted: deletedTask });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Batch task operations
app.post('/api/tasks/batch', async (req, res) => {
  try {
    const { action, taskIds, updates } = req.body;
    
    if (!action || !taskIds || !Array.isArray(taskIds)) {
      return res.status(400).json({ error: 'Invalid batch operation parameters' });
    }

    const data = await readDataFile('tasks.json');
    let modifiedTasks = [];

    taskIds.forEach(id => {
      const taskIndex = data.tasks.findIndex(task => task.id === parseInt(id));
      if (taskIndex !== -1) {
        if (action === 'update' && updates) {
          data.tasks[taskIndex] = {
            ...data.tasks[taskIndex],
            ...updates,
            updatedAt: new Date().toISOString()
          };
          modifiedTasks.push(data.tasks[taskIndex]);
        } else if (action === 'delete') {
          modifiedTasks.push(data.tasks.splice(taskIndex, 1)[0]);
        }
      }
    });

    await writeDataFile('tasks.json', data);

    // Broadcast batch operation
    broadcast({
      type: 'tasks_batch_update',
      action,
      tasks: modifiedTasks
    });

    res.json({ success: true, action, modified: modifiedTasks.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cron and automation endpoints
app.get('/api/cron', async (req, res) => {
  try {
    const result = await gatewayInvoke('cron', { action: 'list' });
    res.json(result);
  } catch (error) {
    res.status(503).json({ error: 'Gateway unavailable: ' + error.message });
  }
});

app.post('/api/cron', async (req, res) => {
  try {
    const { schedule, command, label } = req.body;
    
    if (!schedule || !command) {
      return res.status(400).json({ error: 'Schedule and command are required' });
    }

    const result = await gatewayInvoke('cron', {
      action: 'add',
      schedule,
      command,
      label: label || `Job-${Date.now()}`
    });

    broadcast({
      type: 'cron_job_added',
      job: result
    });

    res.json(result);
  } catch (error) {
    res.status(503).json({ error: 'Gateway unavailable: ' + error.message });
  }
});

// Activity feed endpoint (enhanced)
app.get('/api/activity', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const [sessionsData, cronData] = await Promise.all([
      gatewayInvoke('sessions_list', { limit: limit, activeMinutes: 1440 }).catch(() => ({ sessions: [] })),
      gatewayInvoke('cron', { action: 'runs', limit: 20 }).catch(() => ({ runs: [] }))
    ]);

    const activities = [];

    // Add session activities
    (sessionsData.sessions || []).forEach(session => {
      activities.push({
        id: `session-${session.key}`,
        type: 'session',
        timestamp: session.lastActivity || session.createdAt,
        description: `Session ${session.isActive ? 'active' : 'idle'}: ${session.label || session.key}`,
        metadata: {
          sessionKey: session.key,
          messageCount: session.messageCount,
          model: session.model,
          isActive: session.isActive
        }
      });
    });

    // Add cron activities
    (cronData.runs || []).forEach(run => {
      activities.push({
        id: `cron-${run.id}`,
        type: 'cron',
        timestamp: run.completedAt || run.startedAt,
        description: `Cron job ${run.status}: ${run.label || run.id}`,
        metadata: {
          jobId: run.jobId,
          status: run.status,
          duration: run.duration
        }
      });
    });

    // Sort by timestamp (newest first)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({ activities: activities.slice(0, limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

// Background monitoring tasks
function startSystemMonitoring() {
  // Update system stats every 30 seconds
  cron.schedule('*/30 * * * * *', async () => {
    try {
      const stats = await getSystemStats();
      systemStats = stats;
      
      // Broadcast system stats to connected clients
      broadcast({
        type: 'system_stats',
        data: stats
      });
    } catch (error) {
      console.error('Error updating system stats:', error);
    }
  });

  // Ping gateway every 5 minutes to check health
  cron.schedule('*/5 * * * *', async () => {
    try {
      await gatewayInvoke('sessions_list', { limit: 1 }, 1);
      if (systemStats.gatewayStatus !== 'connected') {
        systemStats.gatewayStatus = 'connected';
        broadcast({
          type: 'gateway_status',
          status: 'connected',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      if (systemStats.gatewayStatus !== 'error') {
        systemStats.gatewayStatus = 'error';
        broadcast({
          type: 'gateway_status',
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  });

  console.log('📊 System monitoring started');
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Mission Control server running on http://0.0.0.0:${PORT}`);
  console.log(`📱 Access from network: http://192.168.86.40:${PORT}`);
  console.log(`🔌 WebSocket server ready for real-time updates`);
  
  startSystemMonitoring();
  
  // Initial system stats load
  getSystemStats().then(stats => {
    systemStats = stats;
    console.log(`📊 System monitoring active: ${stats.memory}% RAM, Gateway: ${stats.gatewayStatus}`);
  });
});