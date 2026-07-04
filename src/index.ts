import { Hono } from 'hono';
import { Env } from './types';
import { publicApp, getLocale } from './public';
import { adminApp } from './admin/index';
import { resolveAdminPath } from './lib/auth';
import { renderHtml } from './render';
import React from 'react';
import { ErrorPage } from './frontend/ErrorPage';
import { detectLocale, type Locale } from './frontend/i18n';

function handleError(status: number, locale: Locale): Response {
  return new Response(
    renderHtml(React.createElement(ErrorPage, { status, locale })),
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

const app = new Hono<{ Bindings: Env }>();

app.get('/favicon.ico', async (c) => {
  const fav = await fetch('https://github.githubassets.com/favicons/favicon-dark.svg');
  return new Response(fav.body, {
    headers: { 'Content-Type': fav.headers.get('Content-Type') || 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' },
  });
});

app.route('/', publicApp);

app.notFound((c) => {
  const locale = getLocale(c.req.raw);
  return handleError(404, locale);
});

app.onError((_err, c) => {
  const locale = getLocale(c.req.raw);
  return handleError(500, locale);
});

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const adminPath = resolveAdminPath(env);

    if (path === adminPath || path.startsWith(adminPath + '/')) {
      const rest = path === adminPath ? '' : path.slice(adminPath.length);
      const subUrl = new URL(request.url);
      subUrl.pathname = rest || '/';
      const subReq = new Request(subUrl.toString(), request);

      if (path === adminPath + '/login') {
        return new Response(null, {
          status: 302,
          headers: { Location: adminPath },
        });
      }

      return adminApp.fetch(subReq, env, ctx);
    }

    return app.fetch(request, env, ctx);
  },
};
