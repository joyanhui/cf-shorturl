import type { Env } from '../types';
import { getTokenCookie, verifyToken } from '../lib/auth';

export async function checkAuth(request: Request, env: Env): Promise<boolean> {
  const token = getTokenCookie(request);
  if (!token) return false;
  return verifyToken(env, token);
}
