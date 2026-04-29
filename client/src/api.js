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
  if (!res.ok) throw new Error(data.error || 'Request failed');
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
