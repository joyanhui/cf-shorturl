import { Hono, type Context, type Next } from 'hono';
import type { Env } from '../types';
import type { ExecutionContext } from '@cloudflare/workers-types';
import { checkAuth } from './auth';
import { requireSessionResponse, resolveAdminPath } from '../lib/auth';
import { handleLogin, handleLogout } from './api_login';
import { handleListLinks, handleCreateLink, handleUpdateLink, handleDeleteLink } from './api_links';
import { handleGetSettings, handleUpdateSettings } from './api_settings';
import { adminHTML } from '../frontend/admin.gen';

async function requireAuth(c: Context<{ Bindings: Env }>, next: Next) {
  const authed = await checkAuth(c.req.raw, c.env);
  if (!authed) return requireSessionResponse();
  await next();
}

const adminApp = new Hono<{ Bindings: Env }>();

adminApp.post('/api/login', async (c) => {
  const adminPath = resolveAdminPath(c.env);
  return handleLogin(c.req.raw, c.env, adminPath);
});
adminApp.delete('/api/login', async (c) => {
  const adminPath = resolveAdminPath(c.env);
  return handleLogout(adminPath);
});
adminApp.get('/api/check', async (c) => {
  const authed = await checkAuth(c.req.raw, c.env);
  return c.json({ authed });
});
adminApp.get('/api/settings', async (c) => handleGetSettings(c.req.raw, c.env));


adminApp.put('/api/settings', requireAuth, async (c) => handleUpdateSettings(c.req.raw, c.env));
adminApp.get('/api/links', requireAuth, async (c) => handleListLinks(c.req.raw, c.env, c.executionCtx as unknown as ExecutionContext));
adminApp.post('/api/links', requireAuth, async (c) => handleCreateLink(c.req.raw, c.env, c.executionCtx as unknown as ExecutionContext));
adminApp.put('/api/links', requireAuth, async (c) => handleUpdateLink(c.req.raw, c.env, c.executionCtx as unknown as ExecutionContext));
adminApp.delete('/api/links', requireAuth, async (c) => handleDeleteLink(c.req.raw, c.env, c.executionCtx as unknown as ExecutionContext));

adminApp.all('/*', (c) => {
  const adminPath = resolveAdminPath(c.env);
  const html = adminHTML.replace('</head>', '<script>window.ADMIN_PATH=' + JSON.stringify(adminPath) + '</script></head>');
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
});

export { adminApp };
