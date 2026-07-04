import type { Env } from '../types';
import { checkAuth } from './auth';
import { requireSessionResponse } from '../lib/auth';
import { handleLogin, handleLogout } from './api_login';
import { handleListLinks, handleCreateLink, handleUpdateLink, handleDeleteLink } from './api_links';
import { handleChangePassword } from './api_change_password';
import { handleGetSettings, handleUpdateSettings } from './api_settings';
import { adminHTML } from '../frontend/admin.gen';

export async function adminHandler(request: Request, env: Env, ctx: ExecutionContext, adminPath: string): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  const apiPrefix = adminPath + '/api';

  if (path === apiPrefix + '/login') {
    if (method === 'POST') return handleLogin(request, env, adminPath);
    if (method === 'DELETE') return handleLogout(adminPath);
    return new Response('Method Not Allowed', { status: 405 });
  }

  // Public endpoints (no auth required)
  if (path === apiPrefix + '/check' && method === 'GET') {
    const authed = await checkAuth(request, env);
    return Response.json({ authed });
  }
  if (path === apiPrefix + '/settings' && method === 'GET') {
    return handleGetSettings(request, env);
  }

  const authed = await checkAuth(request, env);
  if (!authed) return requireSessionResponse();

  if (path === apiPrefix + '/change-password') {
    if (method === 'POST') return handleChangePassword(request, env);
    return new Response('Method Not Allowed', { status: 405 });
  }

  if (path === apiPrefix + '/settings' && method === 'PUT') {
    return handleUpdateSettings(request, env);
  }

  if (path === apiPrefix + '/links') {
    if (method === 'GET') return handleListLinks(request, env, ctx);
    if (method === 'POST') return handleCreateLink(request, env, ctx);
    if (method === 'PUT') return handleUpdateLink(request, env, ctx);
    if (method === 'DELETE') return handleDeleteLink(request, env, ctx);
    return new Response('Method Not Allowed', { status: 405 });
  }

  // Serve SPA HTML for all other admin paths
  return new Response(adminHTML, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
