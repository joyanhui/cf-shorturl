import { describe, it, expect, beforeAll, afterAll } from 'bun:test';

const BASE = process.env.TEST_BASE_URL || 'http://localhost:8787';
const ADMIN_PATH = process.env.TEST_ADMIN_PATH || '/admin';
const PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'admin';

let tokenCookie = '';
let wrangler: import('bun').Subprocess | null = null;

async function waitForServer(url: string, timeoutMs = 60000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {}
    await new Promise(r => setTimeout(r, 1000));
  }
  return false;
}

beforeAll(async () => {
  try {
    const res = await fetch(BASE + '/');
    if (res.ok) return;
  } catch {}

  wrangler = Bun.spawn([
    'npx', 'wrangler', 'dev',
    '--var', 'ADMIN_PASSWORD:admin',
    '--var', 'JWT_ADMIN_SECRET:test-jwt-secret',
    '--var', 'KV_FS_API_KEY:test-key',
  ], {
    stdio: ['ignore', 'inherit', 'inherit'],
    env: { ...process.env },
  });

  const ready = await waitForServer(BASE + '/');
  if (!ready) {
    wrangler.kill();
    wrangler = null;
    throw new Error('wrangler dev did not start within 60s');
  }

  const res = await fetch(BASE + ADMIN_PATH + '/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: PASSWORD }),
  });
  if (!res.ok) {
    throw new Error('Login failed: ' + res.status + ' ' + (await res.text()).substring(0, 200));
  }
  const setCookie = res.headers.get('Set-Cookie') || '';
  const match = setCookie.match(/admin_token=([^;]+)/);
  if (match) tokenCookie = 'admin_token=' + match[1];
});

afterAll(() => {
  if (wrangler) {
    wrangler.kill();
    wrangler = null;
  }
});

describe('login API', () => {
  it('should reject wrong password', async () => {
    const res = await fetch(BASE + ADMIN_PATH + '/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'wrong-password' }),
    });
    expect(res.status).toBe(403);
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