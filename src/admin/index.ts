import type { Env } from '../types';
import { checkAuth } from './auth';
import { requireSessionResponse } from '../lib/auth';
import { handleLogin, handleLogout } from './api_login';
import { handleListLinks, handleCreateLink, handleUpdateLink, handleDeleteLink } from './api_links';
import { handleChangePassword } from './api_change_password';
import { handleGetSettings, handleUpdateSettings } from './api_settings';

export async function adminHandler(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  if (path === '/api/login') {
    if (method === 'POST') return handleLogin(request, env);
    if (method === 'DELETE') return handleLogout();
    return new Response('Method Not Allowed', { status: 405 });
  }

  // Public endpoints (no auth required)
  if (path === '/api/check' && method === 'GET') {
    const authed = await checkAuth(request, env);
    return Response.json({ authed });
  }
  if (path === '/api/settings' && method === 'GET') {
    return handleGetSettings(request, env);
  }

  const authed = await checkAuth(request, env);
  if (!authed) return requireSessionResponse();

  if (path === '/api/change-password') {
    if (method === 'POST') return handleChangePassword(request, env);
    return new Response('Method Not Allowed', { status: 405 });
  }

  if (path === '/api/settings' && method === 'PUT') {
    return handleUpdateSettings(request, env);
  }

  if (path === '/api/links') {
    if (method === 'GET') return handleListLinks(request, env, ctx);
    if (method === 'POST') return handleCreateLink(request, env, ctx);
    if (method === 'PUT') return handleUpdateLink(request, env, ctx);
    if (method === 'DELETE') return handleDeleteLink(request, env, ctx);
    return new Response('Method Not Allowed', { status: 405 });
  }

  return new Response('Not Found', { status: 404 });
}
