import type { Env } from '../types';
import { getAdminConfig, setAdminConfig } from './kv-fs';
import { createJWT, verifyJWT } from '../jwt';

const SESSION_TTL = 86400;

let adminInitialized = false;

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function initAdmin(env: Env): Promise<void> {
  if (adminInitialized) return;
  const existing = await getAdminConfig(env);
  if (!existing) {
    const hash = await hashPassword('admin');
    await setAdminConfig(env, hash);
  }
  adminInitialized = true;
}

export async function verifyAdmin(env: Env, password: string): Promise<boolean> {
  const storedHash = await getAdminConfig(env);
  if (!storedHash) return false;
  const inputHash = await hashPassword(password);
  return inputHash === storedHash;
}

export async function changePassword(env: Env, oldPassword: string, newPassword: string): Promise<{ ok: boolean; error?: string }> {
  const storedHash = await getAdminConfig(env);
  if (!storedHash) return { ok: false, error: '原密码错误' };
  const oldHash = await hashPassword(oldPassword);
  if (oldHash !== storedHash) return { ok: false, error: '原密码错误' };
  const newHash = await hashPassword(newPassword);
  await setAdminConfig(env, newHash);
  return { ok: true };
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
