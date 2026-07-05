import type { Env } from '../types';
import { createJWT, verifyJWT } from '../jwt';

const SESSION_TTL = 86400;

export function getAdminPassword(env: Env): string | null {
  return env.ADMIN_PASSWORD?.trim() || null;
}

export function verifyPassword(env: Env, password: string): 'ok' | 'wrong' | 'unset' {
  const pwd = getAdminPassword(env);
  if (!pwd) return 'unset';
  return password === pwd ? 'ok' : 'wrong';
}

// JWT token management (stateless)
export async function signToken(env: Env, ttlSec = SESSION_TTL): Promise<string> {
  return createJWT(env.JWT_ADMIN_SECRET, {}, ttlSec);
}

export async function verifyToken(env: Env, token: string): Promise<boolean> {
  const payload = await verifyJWT(token, env.JWT_ADMIN_SECRET);
  return payload !== null;
}

let _cachedAdminPath: string | null = null;

export function resolveAdminPath(env: Env): string {
  if (_cachedAdminPath) return _cachedAdminPath;
  let raw = env.ADMIN_PATH?.trim();
  if (!raw) raw = '/admin';
  if (!raw.startsWith('/')) raw = '/' + raw;
  if (raw.endsWith('/') && raw.length > 1) raw = raw.slice(0, -1);
  if (raw === '/') throw new Error('ADMIN_PATH cannot be "/". This would expose the admin panel at the root path.');
  _cachedAdminPath = raw;
  return raw;
}

// Cookie helpers
export function getTokenCookie(request: Request): string | null {
  const cookie = request.headers.get('Cookie') || '';
  if (cookie.includes('admin_token=')) {
    for (const part of cookie.split(';')) {
      const [key, ...rest] = part.trim().split('=');
      if (key === 'admin_token') return rest.join('=');
    }
  }
  return null;
}

export function setTokenCookie(token: string, path = '/'): string {
  return `admin_token=${token}; Path=${path}; SameSite=Lax; Max-Age=${SESSION_TTL}`;
}

export function clearTokenCookie(path = '/'): string {
  return `admin_token=; Path=${path}; SameSite=Lax; Max-Age=0`;
}

export function requireSessionResponse(): Response {
  return new Response(JSON.stringify({ error: '未登录' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}
