const express = require('express');
const fs = require('fs').promises;
const os = require('os');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3333;
const GATEWAY = 'http://127.0.0.1:18789';
const WORKSPACE = '/home/clawdbot/clawd';
const SESSIONS_STORE = '/home/clawdbot/.clawdbot/agents/main/sessions/sessions.json';
const SESSIONS_DIR = '/home/clawdbot/.clawdbot/agents/main/sessions';
const MC_TOKEN_FILE = path.join(__dirname, 'data', '.mc-token');

const startTime = Date.now();

app.use(cors());
app.use(express.json());

// ── Auth Middleware ───────────────────────────────────────
async function getToken() {
    try { return (await fs.readFile(MC_TOKEN_FILE, 'utf8')).trim(); }
    catch (e) { return null; }
}

async function auth(req, res, next) {
    const token = await getToken();
    if (!token) return next(); // no token set = open access
    const provided = (req.headers.authorization || '').replace('Bearer ', '').trim()
        || req.query.token;
    if (provided === token) return next();
    res.status(401).json({ error: 'Unauthorized' });
}

// Public routes (no auth)
app.get('/api/auth/status', async (req, res) => {
    const token = await getToken();
    const provided = (req.headers.authorization || '').replace('Bearer ', '').trim();
    res.json({ authRequired: !!token, authenticated: !token || provided === token });
});

app.post('/api/auth/login', async (req, res) => {
    const token = await getToken();
    if (!token) return res.json({ ok: true });
    if (req.body.token === token) return res.json({ ok: true });
    res.status(401).json({ error: 'Invalid token' });
});

// Apply auth to everything else
app.use('/api', auth);

// Serve static files
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// ── Gateway proxy ────────────────────────────────────────
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

// Gateway config has nested structure: details -> {ok, result} -> result.config
async function getGwConfig() {
    const raw = await gw('gateway', { action: 'config.get' });
    // raw = {ok, result: {path, config, ...}}
    return raw?.result?.config || raw?.config || raw;
}

// ── Data files ───────────────────────────────────────────
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

// ══════════════════════════════════════════════════════════
// STATUS & SYSTEM
// ══════════════════════════════════════════════════════════

app.get('/api/status', async (req, res) => {
    try {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const cpus = os.cpus();
        const loadAvg = os.loadavg();
        const ifaces = os.networkInterfaces();

        // Get IPs
        const ips = {};
        for (const [name, addrs] of Object.entries(ifaces)) {
            const v4 = addrs.find(a => a.family === 'IPv4' && !a.internal);
            if (v4) ips[name] = v4.address;
        }

        // Disk usage
        let disk = {};
        try {
            const { execSync } = require('child_process');
            const dfOut = execSync("df -h / | tail -1").toString().trim().split(/\s+/);
            disk = { label: 'SD', mount: '/', total: dfOut[1], used: dfOut[2], avail: dfOut[3], pct: dfOut[4] };
        } catch (e) {}

        let ssd = {};
        try {
            const { execSync } = require('child_process');
            const ssdOut = execSync("df -h /mnt/ssd 2>/dev/null | tail -1").toString().trim().split(/\s+/);
            if (ssdOut.length >= 5 && ssdOut[5]?.includes('ssd')) {
                ssd = { label: 'SSD', mount: '/mnt/ssd', total: ssdOut[1], used: ssdOut[2], avail: ssdOut[3], pct: ssdOut[4] };
            }
        } catch (e) {}

        // Gateway config for heartbeat/model info
        let gwCfg = {};
        try { gwCfg = await getGwConfig(); } catch (e) {}

        const heartbeat = gwCfg?.agents?.defaults?.heartbeat || {};
        let model = gwCfg?.agents?.defaults?.model || 'unknown';

        // Get runtime model from session_status
        let sessionInfo = {};
        try {
            const ssRaw = await gw('session_status', {});
            const ssText = ssRaw?.statusText || '';
            const modelMatch = ssText.match(/Model:\s*(\S+)/);
            if (modelMatch) model = modelMatch[1];
            const contextMatch = ssText.match(/Context:\s*(\S+)/);
            const versionMatch = ssText.match(/Clawdbot\s+(\S+)/);
            const compactMatch = ssText.match(/Compactions:\s*(\d+)/);
            sessionInfo = {
                context: contextMatch ? contextMatch[1] : null,
                version: versionMatch ? versionMatch[1] : null,
                compactions: compactMatch ? parseInt(compactMatch[1]) : 0,
            };
        } catch (e) {}

        // Heartbeat state
        let hbState = {};
        try {
            hbState = JSON.parse(await fs.readFile(path.join(WORKSPACE, 'memory/heartbeat-state.json'), 'utf8'));
        } catch (e) {}

        res.json({
            uptime: Math.floor((Date.now() - startTime) / 1000),
            systemUptime: os.uptime(),
            hostname: os.hostname(),
            platform: `${os.type()} ${os.release()}`,
            arch: os.arch(),
            memory: {
                total: totalMem,
                used: usedMem,
                free: freeMem,
                pct: Math.round((usedMem / totalMem) * 100)
            },
            cpu: { cores: cpus.length, model: cpus[0]?.model || 'unknown', load: loadAvg },
            disk,
            ssd,
            network: ips,
            model,
            heartbeat: {
                enabled: !!heartbeat.every,
                every: heartbeat.every || null,
                activeHours: heartbeat.activeHours || null,
                prompt: heartbeat.prompt || null
            },
            heartbeatState: hbState,
            session: sessionInfo,
            gateway: {
                url: GATEWAY,
                channels: Object.keys(gwCfg?.channels || {}),
                thinking: gwCfg?.agents?.defaults?.thinking || null
            }
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════
// GATEWAY CONFIG
// ══════════════════════════════════════════════════════════

app.get('/api/gateway/config', async (req, res) => {
    try { res.json(await getGwConfig()); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/gateway/config', async (req, res) => {
    try {
        const result = await gw('gateway', { action: 'config.patch', raw: JSON.stringify(req.body) });
        res.json({ ok: true, result });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════
// HEARTBEAT CHECKS CONFIG
// ══════════════════════════════════════════════════════════

const HB_CHECKS_FILE = path.join(__dirname, 'data', 'heartbeat-checks.json');
const HB_STATE_FILE = path.join(WORKSPACE, 'memory', 'heartbeat-state.json');

app.get('/api/heartbeat/checks', async (req, res) => {
    try {
        const checks = JSON.parse(await fs.readFile(HB_CHECKS_FILE, 'utf8'));
        let state = {};
        try { state = JSON.parse(await fs.readFile(HB_STATE_FILE, 'utf8')); } catch (e) {}

        // Merge last-run times into checks
        const lastChecks = state.lastChecks || {};
        const enriched = (checks.checks || []).map(c => {
            let lastRun = lastChecks[c.id] || null;
            // Special cases
            if (c.id === 'daily_review' && state.lastDailyReview) {
                lastRun = new Date(state.lastDailyReview + 'T21:00:00').getTime() / 1000;
            }
            if (c.id === 'moltbook' && state.lastMoltbookCheck) {
                lastRun = state.lastMoltbookCheck;
            }
            const lastRunMs = lastRun ? (lastRun > 1e12 ? lastRun : lastRun * 1000) : null;
            const overdue = c.enabled && lastRunMs
                ? (Date.now() - lastRunMs) > (c.frequencyHours * 3600000)
                : c.enabled && !lastRunMs;
            return { ...c, lastRun: lastRunMs, overdue };
        });

        res.json({ checks: enriched, notes: state.notes || null });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/heartbeat/checks', async (req, res) => {
    try {
        await fs.writeFile(HB_CHECKS_FILE, JSON.stringify({ checks: req.body.checks }, null, 2));
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/heartbeat/checks/:id', async (req, res) => {
    try {
        const data = JSON.parse(await fs.readFile(HB_CHECKS_FILE, 'utf8'));
        const idx = (data.checks || []).findIndex(c => c.id === req.params.id);
        if (idx === -1) return res.status(404).json({ error: 'Check not found' });
        data.checks[idx] = { ...data.checks[idx], ...req.body };
        await fs.writeFile(HB_CHECKS_FILE, JSON.stringify(data, null, 2));
        res.json({ ok: true, check: data.checks[idx] });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/heartbeat/checks', async (req, res) => {
    try {
        const data = JSON.parse(await fs.readFile(HB_CHECKS_FILE, 'utf8'));
        data.checks = data.checks || [];
        data.checks.push(req.body);
        await fs.writeFile(HB_CHECKS_FILE, JSON.stringify(data, null, 2));
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/heartbeat/checks/:id', async (req, res) => {
    try {
        const data = JSON.parse(await fs.readFile(HB_CHECKS_FILE, 'utf8'));
        data.checks = (data.checks || []).filter(c => c.id !== req.params.id);
        await fs.writeFile(HB_CHECKS_FILE, JSON.stringify(data, null, 2));
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════
// GATEWAY RESTART
// ══════════════════════════════════════════════════════════

app.post('/api/gateway/restart', async (req, res) => {
    try {
        const gwRes = await fetch('http://127.0.0.1:18789/tools/invoke', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tool: 'gateway', args: { action: 'restart', reason: 'Dashboard restart button' } })
        });
        const data = await gwRes.json();
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════
// PREFERENCES (Command Bar)
// ══════════════════════════════════════════════════════════

const PREFS_FILE = path.join(__dirname, 'data', 'preferences.json');

app.get('/api/preferences', async (req, res) => {
    try { res.json(JSON.parse(await fs.readFile(PREFS_FILE, 'utf8'))); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/preferences', async (req, res) => {
    try {
        const text = req.body.text;
        if (!text) return res.status(400).json({ error: 'Text required' });
        const data = JSON.parse(await fs.readFile(PREFS_FILE, 'utf8'));
        const pref = {
            id: 'pref_' + Date.now(),
            text,
            category: null,
            target: null,
            status: 'pending',
            createdAt: Date.now(),
            appliedAt: null,
            response: null
        };
        data.preferences.unshift(pref);
        await fs.writeFile(PREFS_FILE, JSON.stringify(data, null, 2));

        // Notify main session via gateway
        try {
            const gwRes = await fetch('http://127.0.0.1:18789/tools/invoke', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tool: 'sessions_send', args: { sessionKey: 'agent:main:main', message: `[Dashboard Command] New preference from the Mission Control chat: "${text}". Process it: read /home/clawdbot/clawd/mission-control/data/preferences.json, find preference id "${pref.id}", categorize it, decide where it goes (SOUL.md, USER.md, HEARTBEAT.md, etc), apply the change to the relevant file, then update the preference entry with: category, target, status="applied", response (short explanation in Spanish of what you did and where).` } })
            });
        } catch (e) { console.error('Notify error:', e.message); }

        res.json({ ok: true, preference: pref });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/preferences/:id', async (req, res) => {
    try {
        const data = JSON.parse(await fs.readFile(PREFS_FILE, 'utf8'));
        const idx = data.preferences.findIndex(p => p.id === req.params.id);
        if (idx === -1) return res.status(404).json({ error: 'Not found' });
        data.preferences[idx] = { ...data.preferences[idx], ...req.body };
        await fs.writeFile(PREFS_FILE, JSON.stringify(data, null, 2));
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/preferences/:id', async (req, res) => {
    try {
        const data = JSON.parse(await fs.readFile(PREFS_FILE, 'utf8'));
        data.preferences = data.preferences.filter(p => p.id !== req.params.id);
        await fs.writeFile(PREFS_FILE, JSON.stringify(data, null, 2));
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════
// SUB-AGENTS
// ══════════════════════════════════════════════════════════

const AGENTS_FILE = path.join(__dirname, 'data', 'subagents.json');

app.get('/api/subagents', async (req, res) => {
    try { res.json(JSON.parse(await fs.readFile(AGENTS_FILE, 'utf8'))); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/subagents/:id', async (req, res) => {
    try {
        const data = JSON.parse(await fs.readFile(AGENTS_FILE, 'utf8'));
        const idx = data.agents.findIndex(a => a.id === req.params.id);
        if (idx === -1) return res.status(404).json({ error: 'Agent not found' });
        data.agents[idx] = { ...data.agents[idx], ...req.body };
        await fs.writeFile(AGENTS_FILE, JSON.stringify(data, null, 2));
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/subagents', async (req, res) => {
    try {
        const data = JSON.parse(await fs.readFile(AGENTS_FILE, 'utf8'));
        const agent = {
            id: req.body.id || 'agent_' + Date.now(),
            name: req.body.name || 'New Agent',
            emoji: req.body.emoji || '🤖',
            role: req.body.role || '',
            personality: req.body.personality || '',
            expertise: req.body.expertise || [],
            model: req.body.model || 'anthropic/claude-sonnet-4-20250514',
            status: 'active',
            invocations: 0,
            lastInvoked: null,
            createdAt: new Date().toISOString()
        };
        data.agents.push(agent);
        await fs.writeFile(AGENTS_FILE, JSON.stringify(data, null, 2));
        res.json({ ok: true, agent });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/subagents/:id', async (req, res) => {
    try {
        const data = JSON.parse(await fs.readFile(AGENTS_FILE, 'utf8'));
        data.agents = data.agents.filter(a => a.id !== req.params.id);
        await fs.writeFile(AGENTS_FILE, JSON.stringify(data, null, 2));
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════
// TOOLS STATUS
// ══════════════════════════════════════════════════════════

const TOOLS_FILE = path.join(__dirname, 'data', 'tools-status.json');

app.get('/api/tools', async (req, res) => {
    try { res.json(JSON.parse(await fs.readFile(TOOLS_FILE, 'utf8'))); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/tools/:id', async (req, res) => {
    try {
        const data = JSON.parse(await fs.readFile(TOOLS_FILE, 'utf8'));
        const idx = (data.tools || []).findIndex(t => t.id === req.params.id);
        if (idx === -1) return res.status(404).json({ error: 'Tool not found' });
        data.tools[idx] = { ...data.tools[idx], ...req.body };
        await fs.writeFile(TOOLS_FILE, JSON.stringify(data, null, 2));
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════
// SKILLS
// ══════════════════════════════════════════════════════════

const SKILLS_FILE = path.join(__dirname, 'data', 'skills-status.json');
const SKILLS_DIR = '/usr/lib/node_modules/clawdbot/skills';

app.get('/api/skills', async (req, res) => {
    try { res.json(JSON.parse(await fs.readFile(SKILLS_FILE, 'utf8'))); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/skills/:id/content', async (req, res) => {
    try {
        const content = await fs.readFile(path.join(SKILLS_DIR, req.params.id, 'SKILL.md'), 'utf8');
        res.json({ content });
    } catch (e) { res.status(404).json({ error: 'Skill file not found' }); }
});

app.patch('/api/skills/:id', async (req, res) => {
    try {
        const data = JSON.parse(await fs.readFile(SKILLS_FILE, 'utf8'));
        const idx = (data.skills || []).findIndex(s => s.id === req.params.id);
        if (idx === -1) return res.status(404).json({ error: 'Skill not found' });
        data.skills[idx] = { ...data.skills[idx], ...req.body };
        await fs.writeFile(SKILLS_FILE, JSON.stringify(data, null, 2));
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════
// PENDIENTES (HEARTBEAT.md checkboxes)
// ══════════════════════════════════════════════════════════

app.get('/api/pendientes', async (req, res) => {
    try {
        const content = await fs.readFile(path.join(WORKSPACE, 'HEARTBEAT.md'), 'utf8');
        const lines = content.split('\n');
        const items = [];
        lines.forEach((line, i) => {
            const m = line.match(/^(\s*)-\s+\[([ xX])\]\s+(.+)$/);
            if (m) {
                items.push({ line: i, indent: m[1].length, done: m[2] !== ' ', text: m[3].trim() });
            }
        });
        res.json({ items, total: items.length, done: items.filter(i => i.done).length });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/pendientes', async (req, res) => {
    try {
        const text = req.body.text;
        if (!text) return res.status(400).json({ error: 'Text required' });
        const content = await fs.readFile(path.join(WORKSPACE, 'HEARTBEAT.md'), 'utf8');
        const lines = content.split('\n');

        // Find the "## Pendientes" section and add after it
        let insertAt = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].match(/^##\s+Pendientes/i)) {
                // Find the last checkbox line in this section
                for (let j = i + 1; j < lines.length; j++) {
                    if (lines[j].match(/^\s*-\s+\[/)) {
                        insertAt = j + 1;
                    } else if (lines[j].match(/^##\s/) && j > i + 1) {
                        break; // next section
                    }
                }
                if (insertAt === -1) insertAt = i + 1;
                break;
            }
        }

        if (insertAt === -1) {
            // No Pendientes section, append at end
            lines.push('', '## Pendientes', `- [ ] ${text}`);
        } else {
            lines.splice(insertAt, 0, `- [ ] ${text}`);
        }

        await fs.writeFile(path.join(WORKSPACE, 'HEARTBEAT.md'), lines.join('\n'));
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/pendientes/:line', async (req, res) => {
    try {
        const lineNum = parseInt(req.params.line);
        const content = await fs.readFile(path.join(WORKSPACE, 'HEARTBEAT.md'), 'utf8');
        const lines = content.split('\n');
        if (lineNum < 0 || lineNum >= lines.length) return res.status(400).json({ error: 'Invalid line' });

        const line = lines[lineNum];
        const m = line.match(/^(\s*-\s+\[)([ xX])(\]\s+.+)$/);
        if (!m) return res.status(400).json({ error: 'Not a checkbox line' });

        const newState = req.body.done ? 'x' : ' ';
        lines[lineNum] = `${m[1]}${newState}${m[3]}`;
        await fs.writeFile(path.join(WORKSPACE, 'HEARTBEAT.md'), lines.join('\n'));
        res.json({ ok: true, line: lineNum, done: req.body.done });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════
// SESSIONS
// ══════════════════════════════════════════════════════════

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
    try { res.json(await gw('sessions_send', { sessionKey: req.params.key, message: req.body.message })); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/sessions/spawn', async (req, res) => {
    try { res.json(await gw('sessions_spawn', req.body)); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/sessions/:key/status', async (req, res) => {
    try { res.json(await gw('session_status', { sessionKey: req.params.key })); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Session cleanup ──────────────────────────────────────
app.delete('/api/sessions/:key', async (req, res) => {
    try {
        const store = JSON.parse(await fs.readFile(SESSIONS_STORE, 'utf8'));
        const key = req.params.key;
        const session = store[key];
        if (!session) return res.status(404).json({ error: 'Session not found' });
        if (session.sessionId) {
            const transcript = path.join(SESSIONS_DIR, `${session.sessionId}.jsonl`);
            try { await fs.unlink(transcript); } catch (e) {}
        }
        delete store[key];
        await fs.writeFile(SESSIONS_STORE, JSON.stringify(store, null, 2));
        try {
            const agentsData = await readData('agents.json');
            agentsData.agents = (agentsData.agents || []).filter(a => a.sessionKey !== key);
            await writeData('agents.json', agentsData);
        } catch (e) {}
        res.json({ ok: true, deleted: key });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/sessions/cleanup', async (req, res) => {
    try {
        const maxAgeHours = req.body.maxAgeHours || 24;
        const cutoff = Date.now() - (maxAgeHours * 3600000);
        const store = JSON.parse(await fs.readFile(SESSIONS_STORE, 'utf8'));
        const deleted = [];
        for (const [key, session] of Object.entries(store)) {
            if (!key.includes('subagent')) continue;
            if ((session.updatedAt || 0) > cutoff) continue;
            if (session.sessionId) {
                try { await fs.unlink(path.join(SESSIONS_DIR, `${session.sessionId}.jsonl`)); } catch (e) {}
            }
            delete store[key];
            deleted.push({ key, label: session.label });
        }
        if (deleted.length > 0) await fs.writeFile(SESSIONS_STORE, JSON.stringify(store, null, 2));
        res.json({ ok: true, deleted, count: deleted.length });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════
// CRON
// ══════════════════════════════════════════════════════════

app.get('/api/cron', async (req, res) => {
    try { res.json(await gw('cron', { action: 'list', includeDisabled: true })); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/cron/:id', async (req, res) => {
    try {
        res.json(await gw('cron', { action: 'update', jobId: req.params.id, patch: req.body }));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/cron/:id', async (req, res) => {
    try {
        res.json(await gw('cron', { action: 'remove', jobId: req.params.id }));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/cron/:id/run', async (req, res) => {
    try {
        res.json(await gw('cron', { action: 'run', jobId: req.params.id }));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════
// TASKS & AGENTS
// ══════════════════════════════════════════════════════════

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
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
        };
        data.tasks.push(task); data.nextId++;
        await writeData('tasks.json', data);
        res.json(task);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/agents', async (req, res) => {
    try { res.json(await readData('agents.json')); }
    catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/agents', async (req, res) => {
    try { await writeData('agents.json', req.body); res.json({ ok: true }); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════
// FILE API (workspace files)
// ══════════════════════════════════════════════════════════

const ALLOWED_FILES = {
    memory: 'MEMORY.md', heartbeat: 'HEARTBEAT.md', soul: 'SOUL.md', user: 'USER.md',
    identity: 'IDENTITY.md', tools: 'TOOLS.md', agents: 'AGENTS.md',
};

app.get('/api/files/:name', async (req, res) => {
    const file = ALLOWED_FILES[req.params.name];
    if (!file) return res.status(404).json({ error: 'Unknown file' });
    try {
        const content = await fs.readFile(path.join(WORKSPACE, file), 'utf8');
        res.json({ name: req.params.name, file, content });
    } catch (e) {
        if (e.code === 'ENOENT') return res.json({ name: req.params.name, file, content: '' });
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/files/:name', async (req, res) => {
    const file = ALLOWED_FILES[req.params.name];
    if (!file) return res.status(404).json({ error: 'Unknown file' });
    try {
        await fs.writeFile(path.join(WORKSPACE, file), req.body.content);
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Memory files (read-only)
app.get('/api/memory/recent', async (req, res) => {
    try {
        const memDir = path.join(WORKSPACE, 'memory');
        const files = await fs.readdir(memDir);
        const mdFiles = files.filter(f => /^\d{4}-\d{2}-\d{2}\.md$/.test(f)).sort().reverse().slice(0, 10);
        const entries = [];
        for (const f of mdFiles) {
            const content = await fs.readFile(path.join(memDir, f), 'utf8');
            entries.push({ date: f.replace('.md', ''), content });
        }
        res.json({ entries });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Read a specific memory day file
app.get('/api/memory/:date', async (req, res) => {
    const date = req.params.date;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: 'Invalid date format' });
    try {
        const content = await fs.readFile(path.join(WORKSPACE, 'memory', `${date}.md`), 'utf8');
        res.json({ date, content });
    } catch (e) {
        if (e.code === 'ENOENT') return res.json({ date, content: '' });
        res.status(500).json({ error: e.message });
    }
});

// Write a specific memory day file
app.put('/api/memory/:date', async (req, res) => {
    const date = req.params.date;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: 'Invalid date format' });
    try {
        await fs.writeFile(path.join(WORKSPACE, 'memory', `${date}.md`), req.body.content || '');
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// SPA fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mission Control running on http://0.0.0.0:${PORT}`);
});
