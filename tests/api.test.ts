import { describe, it, expect, beforeAll } from 'bun:test';

const BASE = process.env.TEST_BASE_URL || 'http://localhost:8787';
const ADMIN_PATH = process.env.TEST_ADMIN_PATH || '/admin';
const PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'admin';

let tokenCookie = '';

beforeAll(async () => {
  const res = await fetch(BASE + ADMIN_PATH + '/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: PASSWORD }),
  });
  expect(res.status).toBe(200);
  const setCookie = res.headers.get('Set-Cookie') || '';
  const match = setCookie.match(/admin_token=([^;]+)/);
  if (match) tokenCookie = 'admin_token=' + match[1];
});

describe('login API', () => {
  it('should reject wrong password', async () => {
    const res = await fetch(BASE + ADMIN_PATH + '/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'wrong-password' }),
    });
    expect(res.status).toBe(401);
  });

  it('should check auth status', async () => {
    const res = await fetch(BASE + ADMIN_PATH + '/api/check', {
      headers: { Cookie: tokenCookie },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('authed');
  });
});

describe('public API', () => {
  it('should serve the homepage', async () => {
    const res = await fetch(BASE + '/');
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('CF ShortURL');
  });

  it('should return 404 for unknown slug', async () => {
    const res = await fetch(BASE + '/nonexistent-slug-' + Date.now());
    expect(res.status).toBe(404);
  });
});
