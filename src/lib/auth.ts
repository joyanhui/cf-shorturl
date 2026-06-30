const ADMIN_KEY = 'config:admin';
const SESSION_PREFIX = 'session:';
const SESSION_TTL = 86400;

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function initAdmin(kv: KVNamespace): Promise<void> {
  const existing = await kv.get(ADMIN_KEY);
  if (!existing) {
    const hash = await hashPassword('admin888');
    await kv.put(ADMIN_KEY, JSON.stringify({ username: 'admin', passwordHash: hash }));
  }
}

export async function verifyAdmin(kv: KVNamespace, password: string): Promise<boolean> {
  const data = await kv.get(ADMIN_KEY);
  if (!data) return false;
  const { passwordHash } = JSON.parse(data);
  const inputHash = await hashPassword(password);
  return inputHash === passwordHash;
}

export async function changePassword(kv: KVNamespace, oldPassword: string, newPassword: string): Promise<{ ok: boolean; error?: string }> {
  const ok = await verifyAdmin(kv, oldPassword);
  if (!ok) return { ok: false, error: '原密码错误' };
  const hash = await hashPassword(newPassword);
  const data = await kv.get(ADMIN_KEY);
  const { username } = data ? JSON.parse(data) : { username: 'admin' };
  await kv.put(ADMIN_KEY, JSON.stringify({ username, passwordHash: hash }));
  return { ok: true };
}

export async function createSession(kv: KVNamespace): Promise<string> {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let token = '';
  for (let i = 0; i < 32; i++) token += chars[bytes[i] % chars.length];
  await kv.put(`${SESSION_PREFIX}${token}`, '1', { expirationTtl: SESSION_TTL });
  return token;
}

export async function validateSession(kv: KVNamespace, token: string): Promise<boolean> {
  const data = await kv.get(`${SESSION_PREFIX}${token}`);
  return data !== null;
}

export async function destroySession(kv: KVNamespace, token: string): Promise<void> {
  await kv.delete(`${SESSION_PREFIX}${token}`);
}

export function getSessionToken(request: Request): string | null {
  const cookie = request.headers.get('Cookie') || '';
  for (const part of cookie.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === 'session') return rest.join('=');
  }
  return null;
}

export function requireSessionResponse(): Response {
  return new Response(JSON.stringify({ error: '未登录' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function setSessionCookie(token: string): string {
  return `session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL}`;
}

export function clearSessionCookie(): string {
  return 'session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
}
