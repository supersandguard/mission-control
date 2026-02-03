const API_BASE = '/api';

async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API call failed: ${endpoint}`, error);
    throw error;
  }
}

// Sessions API
export const sessionsApi = {
  list: (params = {}) => apiCall(`/sessions?${new URLSearchParams(params)}`),
  getHistory: (sessionKey, params = {}) => 
    apiCall(`/sessions/${encodeURIComponent(sessionKey)}/history?${new URLSearchParams(params)}`),
  sendMessage: (sessionKey, message) => 
    apiCall(`/sessions/${encodeURIComponent(sessionKey)}/send`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
  spawn: (task, label, model, agentId) =>
    apiCall('/sessions/spawn', {
      method: 'POST',
      body: JSON.stringify({ task, label, model, agentId }),
    }),
  getStatus: (sessionKey) =>
    apiCall(`/sessions/${encodeURIComponent(sessionKey)}/status`),
};

// Agents API
export const agentsApi = {
  list: () => apiCall('/agents'),
  update: (agents) => apiCall('/agents', {
    method: 'PUT',
    body: JSON.stringify(agents),
  }),
};

// Tasks API
export const tasksApi = {
  list: () => apiCall('/tasks'),
  update: (tasks) => apiCall('/tasks', {
    method: 'PUT',
    body: JSON.stringify(tasks),
  }),
  create: (task) => apiCall('/tasks', {
    method: 'POST',
    body: JSON.stringify(task),
  }),
};

// Cron API
export const cronApi = {
  list: () => apiCall('/cron'),
};