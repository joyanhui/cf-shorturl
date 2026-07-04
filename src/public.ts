import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import React from 'react';
import { Env } from './types';
import { renderHtml } from './render';
import { Homepage } from './frontend/Homepage';
import { ErrorPage } from './frontend/ErrorPage';
import { detectLocale, type Locale } from './frontend/i18n';
import { getLink } from './lib/kv-fs';
import type { ShortLink } from './lib/types';

function getLocale(request: Request): Locale {
  const url = new URL(request.url);
  const q = url.searchParams.get('lang');
  if (q === 'zh' || q === 'en') return q;
  const cookie = request.headers.get('Cookie');
  const localeCookie = cookie?.split(';').find(c => c.trim().startsWith('locale='))?.split('=')[1]?.trim();
  return detectLocale(request.headers.get('Accept-Language'), localeCookie);
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function generateIframePage(link: ShortLink): string {
  const title = link.title || 'Short URL';
  const injectJs = link.inject_js || '';
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; }
    iframe { width: 100%; height: 100%; border: none; }
  </style>
</head>
<body>
  <iframe src="${escapeHtml(link.url)}" allowfullscreen></iframe>
  ${injectJs ? `<script>${injectJs}</script>` : ''}
</body>
</html>`;
}

function unauthResponse(): Response {
  return new Response('Unauthorized', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Short URL"' },
  });
}

function checkBasicAuth(link: ShortLink, request: Request): Response | null {
  const username = link.basic_auth_username;
  const password = link.basic_auth_password;
  if (!username || !password) return null;

  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Basic ')) return unauthResponse();

  const encoded = authHeader.slice(6);
  let decoded: string;
  try { decoded = atob(encoded); } catch { return unauthResponse(); }

  const colonIndex = decoded.indexOf(':');
  if (colonIndex === -1) return unauthResponse();

  const user = decoded.slice(0, colonIndex);
  const pass = decoded.slice(colonIndex + 1);
  if (user !== username || pass !== password) return unauthResponse();
  return null;
}

const publicApp = new OpenAPIHono<{ Bindings: Env }>();

const openapiRoute = createRoute({
  method: 'get',
  path: '/openapi.json',
  responses: {
    200: { content: { 'application/json': { schema: z.any() } }, description: 'OpenAPI JSON' },
  },
});

publicApp.openapi(openapiRoute, (c) => {
  return c.json(publicApp.getOpenAPIDocument({
    openapi: '3.1.0',
    info: { title: 'CF ShortURL API', version: '2.0.0' },
  }));
});

const homepageRoute = createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: { content: { 'text/html': { schema: z.string() } }, description: 'Homepage' },
  },
});

publicApp.openapi(homepageRoute, async (c) => {
  const locale = getLocale(c.req.raw);
  const cache = caches.default;
  const cacheKey = new Request('https://cache/shorturl/homepage?lang=' + locale);
  const cached = await cache.match(cacheKey);
  if (cached) return cached;
  const body = renderHtml(React.createElement(Homepage, { locale }));
  const response = new Response(body, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
  c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
});

const slugRoute = createRoute({
  method: 'get',
  path: '/{slug}',
  request: { params: z.object({ slug: z.string() }) },
  responses: {
    200: { content: { 'text/html': { schema: z.string() } }, description: 'Short link response' },
    301: { description: 'Redirect' },
    302: { description: 'Redirect' },
    404: { content: { 'text/html': { schema: z.string() } }, description: 'Not found' },
  },
});

publicApp.openapi(slugRoute, async (c) => {
  const slug = c.req.param('slug');
  const env = c.env;
  const request = c.req.raw;
  const ctx = c.executionCtx;
  const cache = caches.default;
  const cacheKey = new Request(`https://cache/shorturl/link/${slug}`);

  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const link = await getLink(env, slug);
  if (!link) {
    const locale = getLocale(request);
    return new Response(
      renderHtml(React.createElement(ErrorPage, { status: 404, locale })),
      { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  const authCheck = checkBasicAuth(link, request);
  if (authCheck) return authCheck;

  let response: Response;
  switch (link.mode) {
    case 'redirect_301':
      response = new Response(null, { status: 301, headers: { 'Location': link.url, 'Cache-Control': 'public, max-age=31536000, immutable' } });
      break;
    case 'redirect_302':
      response = new Response(null, { status: 302, headers: { 'Location': link.url, 'Cache-Control': 'public, max-age=60' } });
      break;
    case 'iframe':
      response = new Response(generateIframePage(link), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=60' } });
      break;
    case 'text':
      response = new Response(link.content || '', { headers: { 'Content-Type': link.content_type || 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=60' } });
      break;
    case 'html':
      response = new Response(link.content || '', { headers: { 'Content-Type': link.content_type || 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=60' } });
      break;
    default:
      response = new Response(null, { status: 302, headers: { 'Location': link.url, 'Cache-Control': 'public, max-age=60' } });
  }

  ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
});

export { publicApp, getLocale };
