const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3333;
const GATEWAY = 'http://127.0.0.1:18789';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// Gateway proxy
async function gw(tool, args = {}) {
    const res = await fetch(`${GATEWAY}/tools/invoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool, args })
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error?.message || 'Gateway error');
    return data.result?.details || JSON.parse(data.result?.content?.[0]?.text || '{}');
}

// Data files
async function readData(file) {
    try {
        return JSON.parse(await fs.readFile(path.join(__dirname, 'data', file), 'utf8'));
    } catch (e) {
        if (e.code === 'ENOENT') {
            if (file === 'tasks.json') return { tasks: [], nextId: 1 };
            if (file === 'agents.json') return { agents: [] };
            return {};
        }
        throw e;
    }
}
async function writeData(file, data) {
    await fs.writeFile(path.join(__dirname, 'data', file), JSON.stringify(data, null, 2));
}

// Sessions
app.get('/api/sessions', async (req, res) => {
    try {
        res.json(await gw('sessions_list', {
            limit: parseInt(req.query.limit) || 20,
            kinds: req.query.kinds?.split(','),
            activeMinutes: req.query.activeMinutes ? parseInt(req.query.activeMinutes) : undefined,
            messageLimit: req.query.messageLimit ? parseInt(req.query.messageLimit) : undefined
        }));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/sessions/:key/history', async (req, res) => {
    try {
        res.json(await gw('sessions_history', {
            sessionKey: req.params.key,
            limit: parseInt(req.query.limit) || 20,
            includeTools: req.query.includeTools === 'true'
        }));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/sessions/:key/send', async (req, res) => {
    try {
        res.json(await gw('sessions_send', { sessionKey: req.params.key, message: req.body.message }));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/sessions/spawn', async (req, res) => {
    try { res.json(await gw('sessions_spawn', req.body)); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/sessions/:key/status', async (req, res) => {
    try { res.json(await gw('session_status', { sessionKey: req.params.key })); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// Cron
app.get('/api/cron', async (req, res) => {
    try { res.json(await gw('cron', { action: 'list' })); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// Tasks
app.get('/api/tasks', async (req, res) => {
    try { res.json(await readData('tasks.json')); }
    catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/tasks', async (req, res) => {
    try { await writeData('tasks.json', req.body); res.json({ ok: true }); }
    catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/tasks', async (req, res) => {
    try {
        const data = await readData('tasks.json');
        const task = {
            id: data.nextId, title: req.body.title, description: req.body.description || '',
            status: req.body.status || 'backlog', priority: req.body.priority || 'medium',
            assignedTo: req.body.assignedTo || null,
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), comments: []
        };
        data.tasks.push(task);
        data.nextId++;
        await writeData('tasks.json', data);
        res.json(task);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Agents
app.get('/api/agents', async (req, res) => {
    try { res.json(await readData('agents.json')); }
    catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/agents', async (req, res) => {
    try { await writeData('agents.json', req.body); res.json({ ok: true }); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// SPA fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mission Control running on http://0.0.0.0:${PORT}`);
});
