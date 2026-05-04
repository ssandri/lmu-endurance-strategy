const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (res.status === 401 && !path.includes('/auth/')) {
    window.location.href = '/login';
    return;
  }
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed');
    err.allInfeasible = data.allInfeasible || false;
    throw err;
  }
  return data;
}

export const auth = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (email, password) => request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
};

export const races = {
  list: () => request('/races'),
  get: (id) => request(`/races/${id}`),
  create: (data) => request('/races', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/races/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => request(`/races/${id}`, { method: 'DELETE' }),
};

export const strategies = {
  list: (raceId) => request(`/strategies/${raceId}`),
  calculate: (raceId, data) => request(`/strategies/${raceId}/calculate`, { method: 'POST', body: JSON.stringify(data) }),
  activate: (raceId, strategyId) => request(`/strategies/${raceId}/activate/${strategyId}`, { method: 'POST' }),
};

export const drivers = {
  list: (raceId) => request(`/drivers/${raceId}`),
  reorder: (raceId, order) => request(`/drivers/${raceId}/order`, { method: 'PUT', body: JSON.stringify({ order }) }),
};

export const stints = {
  list: (raceId) => request(`/stints/${raceId}`),
  confirm: (raceId, stintId, data) => request(`/stints/${raceId}/confirm/${stintId}`, { method: 'POST', body: JSON.stringify(data) }),
};
