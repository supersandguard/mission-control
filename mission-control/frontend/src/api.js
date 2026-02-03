async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('mc_token')
  const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {}
  const r = await fetch(`/api${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders, ...options.headers },
    ...options,
  })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

export const sessionsApi = {
  list: (params = {}) => apiCall(`/sessions?${new URLSearchParams(params)}`),
  getHistory: (key, params = {}) =>
    apiCall(`/sessions/${encodeURIComponent(key)}/history?${new URLSearchParams(params)}`),
  sendMessage: (key, message) =>
    apiCall(`/sessions/${encodeURIComponent(key)}/send`, {
      method: 'POST', body: JSON.stringify({ message }),
    }),
  spawn: (body) =>
    apiCall('/sessions/spawn', { method: 'POST', body: JSON.stringify(body) }),
  delete: (key) =>
    apiCall(`/sessions/${encodeURIComponent(key)}`, { method: 'DELETE' }),
  cleanup: (maxAgeHours = 24) =>
    apiCall('/sessions/cleanup', { method: 'POST', body: JSON.stringify({ maxAgeHours }) }),
}

export const agentsApi = {
  list: () => apiCall('/agents'),
  update: (data) => apiCall('/agents', { method: 'PUT', body: JSON.stringify(data) }),
}

export const tasksApi = {
  list: () => apiCall('/tasks'),
  create: (task) => apiCall('/tasks', { method: 'POST', body: JSON.stringify(task) }),
  update: (data) => apiCall('/tasks', { method: 'PUT', body: JSON.stringify(data) }),
}

export const cronApi = {
  list: () => apiCall('/cron'),
  toggle: (id, enabled) => apiCall(`/cron/${id}`, { method: 'PATCH', body: JSON.stringify({ enabled }) }),
  run: (id) => apiCall(`/cron/${id}/run`, { method: 'POST' }),
}

export const gatewayApi = {
  getConfig: () => apiCall('/gateway/config'),
  patchConfig: (patch) => apiCall('/gateway/config', { method: 'PATCH', body: JSON.stringify(patch) }),
}
