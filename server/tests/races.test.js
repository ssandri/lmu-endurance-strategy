const { test, describe, before } = require('node:test');
const assert = require('node:assert');

const BASE_URL = 'http://localhost:3001';
let cookie;

describe('Races API', () => {
  before(async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `races-${Date.now()}@test.com`, password: 'password123' }),
    });
    cookie = res.headers.get('set-cookie');
  });

  test('GET /api/races returns empty array initially', async () => {
    const res = await fetch(`${BASE_URL}/api/races`, { headers: { Cookie: cookie } });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert(Array.isArray(data));
    assert.strictEqual(data.length, 0);
  });

  test('GET /api/races returns 401 without auth', async () => {
    const res = await fetch(`${BASE_URL}/api/races`);
    assert.strictEqual(res.status, 401);
  });

  test('DELETE /api/races/:id returns 404 for non-existent race', async () => {
    const res = await fetch(`${BASE_URL}/api/races/999`, {
      method: 'DELETE',
      headers: { Cookie: cookie },
    });
    assert.strictEqual(res.status, 404);
  });
});
