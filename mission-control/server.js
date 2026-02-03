const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// Check if Express is available, fallback to http module if needed
let express;
let useExpress = false;

try {
  express = require('express');
  useExpress = true;
  console.log('✓ Using Express framework');
} catch (err) {
  console.log('⚠️ Express not available, using http module');
  useExpress = false;
}

const PORT = 8090;
const TOKEN_FILE = '/home/clawdbot/.secrets/mc-token';

// File mappings for /api/files/:name
const FILE_MAPPINGS = {
  soul: '/home/clawdbot/clawd/SOUL.md',
  heartbeat: '/home/clawdbot/clawd/HEARTBEAT.md',
  memory: '/home/clawdbot/clawd/MEMORY.md',
  identity: '/home/clawdbot/clawd/IDENTITY.md'
};

const READ_ONLY_FILES = ['memory'];

// Utility functions
async function readAuthToken() {
  try {
    const token = await fs.readFile(TOKEN_FILE, 'utf8');
    return token.trim();
  } catch (err) {
    console.error('Error reading auth token:', err);
    throw new Error('Auth token not available');
  }
}

async function readFile(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      return ''; // Return empty string for missing files
    }
    throw err;
  }
}

async function writeFile(filePath, content) {
  await fs.writeFile(filePath, content, 'utf8');
}

async function readConfig() {
  try {
    const configPath = '/home/clawdbot/.clawdbot/clawdbot.json';
    const content = await fs.readFile(configPath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading config:', err);
    return {};
  }
}

async function writeConfig(config) {
  try {
    const configPath = '/home/clawdbot/.clawdbot/clawdbot.json';
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    
    // Send SIGUSR1 to gateway process to trigger reload
    try {
      execSync('kill -SIGUSR1 $(pgrep -f "clawdbot gateway") 2>/dev/null');
      console.log('✓ Sent config reload signal to gateway');
    } catch (err) {
      console.warn('⚠️ Could not send reload signal to gateway:', err.message);
    }
  } catch (err) {
    console.error('Error writing config:', err);
    throw err;
  }
}

function deepMerge(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

async function parsePendientes() {
  try {
    const content = await readFile(FILE_MAPPINGS.heartbeat);
    const lines = content.split('\n');
    const pendientes = [];
    let inPendientesSection = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.trim() === '## Pendientes') {
        inPendientesSection = true;
        continue;
      }
      
      if (inPendientesSection && line.startsWith('##')) {
        break; // End of Pendientes section
      }
      
      if (inPendientesSection) {
        const checkboxMatch = line.match(/^- \[([x ])\] (.+)$/);
        if (checkboxMatch) {
          pendientes.push({
            text: checkboxMatch[2].trim(),
            done: checkboxMatch[1] === 'x',
            line: i
          });
        }
      }
    }
    
    return pendientes;
  } catch (err) {
    console.error('Error parsing pendientes:', err);
    return [];
  }
}

async function updatePendiente(index, done) {
  try {
    const content = await readFile(FILE_MAPPINGS.heartbeat);
    const lines = content.split('\n');
    const pendientes = await parsePendientes();
    
    if (index < 0 || index >= pendientes.length) {
      throw new Error('Invalid pendiente index');
    }
    
    const targetLine = pendientes[index].line;
    const currentLine = lines[targetLine];
    const checkbox = done ? '[x]' : '[ ]';
    const newLine = currentLine.replace(/\[[ x]\]/, checkbox);
    
    lines[targetLine] = newLine;
    const newContent = lines.join('\n');
    
    await writeFile(FILE_MAPPINGS.heartbeat, newContent);
    return true;
  } catch (err) {
    console.error('Error updating pendiente:', err);
    throw err;
  }
}

function getSystemStatus() {
  try {
    const config = readConfig();
    
    return {
      uptime: Math.round(process.uptime()),
      hostname: os.hostname(),
      freeMemory: os.freemem(),
      totalMemory: os.totalmem(),
      nodeVersion: process.version,
      heartbeatConfig: config.agents?.defaults?.heartbeat || {},
      model: config.agents?.defaults?.model || "anthropic/claude-opus-4-5"
    };
  } catch (err) {
    return {
      uptime: Math.round(process.uptime()),
      hostname: os.hostname(),
      freeMemory: os.freemem(),
      totalMemory: os.totalmem(),
      nodeVersion: process.version,
      heartbeatConfig: {},
      model: "anthropic/claude-opus-4-5"
    };
  }
}

// Express server setup
if (useExpress) {
  const app = express();
  
  // Middleware
  app.use(express.json({ limit: '10mb' }));
  
  // CORS headers for local dev
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    
    next();
  });
  
  // Auth middleware for API routes
  const requireAuth = async (req, res, next) => {
    if (!req.path.startsWith('/api/')) {
      return next(); // Skip auth for static files
    }
    
    const authHeader = req.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }
    
    const token = authHeader.slice(7); // Remove 'Bearer ' prefix
    
    try {
      const validToken = await readAuthToken();
      if (token !== validToken) {
        return res.status(403).json({ error: 'Invalid token' });
      }
      next();
    } catch (err) {
      return res.status(500).json({ error: 'Auth system error' });
    }
  };
  
  app.use(requireAuth);
  
  // API Routes
  
  // Files endpoints
  app.get('/api/files/:name', async (req, res) => {
    try {
      const { name } = req.params;
      
      if (!FILE_MAPPINGS[name]) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      const content = await readFile(FILE_MAPPINGS[name]);
      res.json({ content });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  app.put('/api/files/:name', async (req, res) => {
    try {
      const { name } = req.params;
      const { content } = req.body;
      
      if (!FILE_MAPPINGS[name]) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      if (READ_ONLY_FILES.includes(name)) {
        return res.status(403).json({ error: 'File is read-only' });
      }
      
      if (typeof content !== 'string') {
        return res.status(400).json({ error: 'Content must be a string' });
      }
      
      await writeFile(FILE_MAPPINGS[name], content);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // Config endpoints
  app.get('/api/config', async (req, res) => {
    try {
      const config = await readConfig();
      res.json(config);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  app.patch('/api/config', async (req, res) => {
    try {
      const patch = req.body;
      const currentConfig = await readConfig();
      const newConfig = deepMerge(currentConfig, patch);
      
      await writeConfig(newConfig);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // Status endpoint
  app.get('/api/status', async (req, res) => {
    try {
      const status = getSystemStatus();
      res.json(status);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // Pendientes endpoints
  app.get('/api/pendientes', async (req, res) => {
    try {
      const pendientes = await parsePendientes();
      res.json(pendientes);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  app.patch('/api/pendientes', async (req, res) => {
    try {
      const { index, done } = req.body;
      
      if (typeof index !== 'number' || typeof done !== 'boolean') {
        return res.status(400).json({ error: 'Invalid parameters. Expected: { index: number, done: boolean }' });
      }
      
      await updatePendiente(index, done);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // Serve static files
  app.use(express.static(__dirname));
  
  // Start server
  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 Mission Control API server running on http://0.0.0.0:${PORT}`);
    console.log(`📱 Access from network: http://192.168.86.40:${PORT}`);
    
    try {
      const token = await readAuthToken();
      console.log(`🔑 Auth token loaded (${token.length} chars)`);
    } catch (err) {
      console.error('❌ Could not load auth token:', err.message);
    }
  });
  
} else {
  // Fallback to plain HTTP module implementation
  const http = require('http');
  const url = require('url');
  const querystring = require('querystring');
  
  async function parseBody(req) {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch (err) {
          reject(new Error('Invalid JSON'));
        }
      });
      req.on('error', reject);
    });
  }
  
  function sendJSON(res, data, status = 200) {
    res.writeHead(status, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    });
    res.end(JSON.stringify(data));
  }
  
  async function checkAuth(req) {
    if (!req.url.startsWith('/api/')) return true;
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }
    
    try {
      const token = authHeader.slice(7);
      const validToken = await readAuthToken();
      return token === validToken;
    } catch (err) {
      return false;
    }
  }
  
  const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const { pathname, query } = parsedUrl;
    const method = req.method;
    
    try {
      // Handle CORS preflight
      if (method === 'OPTIONS') {
        res.writeHead(200, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization'
        });
        return res.end();
      }
      
      // Check auth for API routes
      if (pathname.startsWith('/api/')) {
        const isAuthorized = await checkAuth(req);
        if (!isAuthorized) {
          return sendJSON(res, { error: 'Unauthorized' }, 401);
        }
      }
      
      // API Routes
      if (pathname.startsWith('/api/files/')) {
        const name = pathname.split('/api/files/')[1];
        
        if (method === 'GET') {
          if (!FILE_MAPPINGS[name]) {
            return sendJSON(res, { error: 'File not found' }, 404);
          }
          const content = await readFile(FILE_MAPPINGS[name]);
          return sendJSON(res, { content });
        }
        
        if (method === 'PUT') {
          if (!FILE_MAPPINGS[name]) {
            return sendJSON(res, { error: 'File not found' }, 404);
          }
          if (READ_ONLY_FILES.includes(name)) {
            return sendJSON(res, { error: 'File is read-only' }, 403);
          }
          
          const body = await parseBody(req);
          if (typeof body.content !== 'string') {
            return sendJSON(res, { error: 'Content must be a string' }, 400);
          }
          
          await writeFile(FILE_MAPPINGS[name], body.content);
          return sendJSON(res, { success: true });
        }
      }
      
      if (pathname === '/api/config') {
        if (method === 'GET') {
          const config = await readConfig();
          return sendJSON(res, config);
        }
        
        if (method === 'PATCH') {
          const patch = await parseBody(req);
          const currentConfig = await readConfig();
          const newConfig = deepMerge(currentConfig, patch);
          await writeConfig(newConfig);
          return sendJSON(res, { success: true });
        }
      }
      
      if (pathname === '/api/status' && method === 'GET') {
        const status = getSystemStatus();
        return sendJSON(res, status);
      }
      
      if (pathname === '/api/pendientes') {
        if (method === 'GET') {
          const pendientes = await parsePendientes();
          return sendJSON(res, pendientes);
        }
        
        if (method === 'PATCH') {
          const { index, done } = await parseBody(req);
          if (typeof index !== 'number' || typeof done !== 'boolean') {
            return sendJSON(res, { error: 'Invalid parameters' }, 400);
          }
          await updatePendiente(index, done);
          return sendJSON(res, { success: true });
        }
      }
      
      // Serve static files
      if (pathname === '/' || pathname === '/index.html') {
        const indexPath = path.join(__dirname, 'index.html');
        const content = await fs.readFile(indexPath, 'utf8');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content);
        return;
      }
      
      // 404 for everything else
      sendJSON(res, { error: 'Not found' }, 404);
      
    } catch (err) {
      console.error('Server error:', err);
      sendJSON(res, { error: 'Internal server error' }, 500);
    }
  });
  
  server.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 Mission Control HTTP server running on http://0.0.0.0:${PORT}`);
    console.log(`📱 Access from network: http://192.168.86.40:${PORT}`);
    
    try {
      const token = await readAuthToken();
      console.log(`🔑 Auth token loaded (${token.length} chars)`);
    } catch (err) {
      console.error('❌ Could not load auth token:', err.message);
    }
  });
}