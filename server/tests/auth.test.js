const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');

const BASE_URL = 'http://localhost:3001';

describe('Auth API', () => {
  let cookie;

  test('GET /api/auth/me returns 401 when not authenticated', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`);
    assert.strictEqual(res.status, 401);
  });

  test('POST /api/auth/register creates a user', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
    });
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.email, 'test@example.com');
    cookie = res.headers.get('set-cookie');
  });

  test('POST /api/auth/register rejects duplicate email', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
    });
    assert.strictEqual(res.status, 409);
  });

  test('POST /api/auth/register rejects short password', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'short@example.com', password: '123' }),
    });
    assert.strictEqual(res.status, 400);
  });

  test('POST /api/auth/login returns session cookie', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.email, 'test@example.com');
    cookie = res.headers.get('set-cookie');
  });

  test('POST /api/auth/login rejects invalid credentials', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'wrong' }),
    });
    assert.strictEqual(res.status, 401);
  });

  test('GET /api/auth/me returns user when authenticated', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: cookie },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.email, 'test@example.com');
  });
});
