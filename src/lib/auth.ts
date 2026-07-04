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
    const hash = await hashPassword('admin888');
    await setAdminConfig(env, { username: 'admin', passwordHash: hash });
  }
  adminInitialized = true;
}

export async function verifyAdmin(env: Env, username: string, password: string): Promise<boolean> {
  const data = await getAdminConfig(env);
  if (!data) return false;
  if (username !== data.username) return false;
  const inputHash = await hashPassword(password);
  return inputHash === data.passwordHash;
}

export async function changePassword(env: Env, username: string, oldPassword: string, newPassword: string): Promise<{ ok: boolean; error?: string }> {
  const data = await getAdminConfig(env);
  if (!data) return { ok: false, error: '用户名或密码错误' };
  if (username !== data.username) return { ok: false, error: '用户名或密码错误' };
  const oldHash = await hashPassword(oldPassword);
  if (oldHash !== data.passwordHash) return { ok: false, error: '用户名或密码错误' };
  const newHash = await hashPassword(newPassword);
  await setAdminConfig(env, { ...data, passwordHash: newHash });
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

export function setTokenCookie(token: string): string {
  return `admin_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL}`;
}

export function clearTokenCookie(): string {
  return 'admin_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
}

export function requireSessionResponse(): Response {
  return new Response(JSON.stringify({ error: '未登录' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}
