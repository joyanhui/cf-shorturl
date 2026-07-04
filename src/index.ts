import React from 'react';
import { Env } from './types';
import { renderHtml } from './render';
import { Homepage } from './frontend/Homepage';
import { ErrorPage } from './frontend/ErrorPage';
import { adminHandler } from './admin/index';
import { getLink } from './lib/kv-fs';
import type { ShortLink } from './lib/types';
import { adminHTML } from './frontend/admin.gen';
import { detectLocale, type Locale } from './frontend/i18n';

function getLocale(request: Request): Locale {
  const cookie = request.headers.get('Cookie');
  const localeCookie = cookie?.split(';').find(c => c.trim().startsWith('locale='))?.split('=')[1]?.trim();
  return detectLocale(request.headers.get('Accept-Language'), localeCookie);
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }

    try {
      const adminPath = resolveAdminPath(env);

      // Favicon (proxy from GitHub)
      if (path === '/favicon.ico') {
        const fav = await fetch('https://github.githubassets.com/favicons/favicon-dark.svg');
        return new Response(fav.body, {
          headers: { 'Content-Type': fav.headers.get('Content-Type') || 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' },
        });
      }

      // Redirect /{adminPath}/login → /{adminPath}
      if (path === adminPath + '/login') {
        return new Response(null, {
          status: 302,
          headers: { Location: adminPath },
        });
      }

      // Admin routes (API + SPA)
      if (path === adminPath || path.startsWith(adminPath + '/')) {
        return adminHandler(request, env, ctx, adminPath);
      }

      // Root → default homepage
      if (path === '/') {
        return handleHomepage(ctx, getLocale(request));
      }

      // Short link access
      if (path.length > 1) {
        const slug = path.slice(1);
        return handleSlug(slug, request, env, ctx);
      }

      return handleError(404, 'Not Found', getLocale(request));
    } catch (e) {
      console.error('Unhandled error:', e);
      return handleError(500, 'Internal Server Error', getLocale(request));
    }
  },
};

let _cachedAdminPath: string | null = null;

function resolveAdminPath(env: Env): string {
  if (_cachedAdminPath) return _cachedAdminPath;
  let raw = env.ADMIN_PATH?.trim();
  if (!raw) raw = '/admin';
  if (!raw.startsWith('/')) raw = '/' + raw;
  if (raw.endsWith('/') && raw.length > 1) raw = raw.slice(0, -1);
  if (raw === '/') throw new Error('ADMIN_PATH cannot be "/". This would expose the admin panel at the root path.');
  _cachedAdminPath = raw;
  return raw;
}

const CACHE_TTL_SEC = 60;

async function handleHomepage(ctx: ExecutionContext, locale: Locale): Promise<Response> {
  const cache = caches.default;
  const cacheKey = new Request('https://cache/shorturl/homepage');
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const body = renderHtml(React.createElement(Homepage, { locale }));
  const response = new Response(body, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
  ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

async function handleSlug(slug: string, request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const cache = caches.default;
  const cacheKey = new Request(`https://cache/shorturl/link/${slug}`);

  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const link = await getLink(env, slug);
  if (!link) {
    const locale = detectLocale(request.headers.get('Accept-Language'),
      request.headers.get('Cookie')?.split(';').find(c => c.trim().startsWith('locale='))?.split('=')[1]?.trim());
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
      response = new Response(null, {
        status: 301,
        headers: { 'Location': link.url, 'Cache-Control': 'public, max-age=31536000, immutable' },
      });
      break;

    case 'redirect_302':
      response = new Response(null, {
        status: 302,
        headers: { 'Location': link.url, 'Cache-Control': 'public, max-age=60' },
      });
      break;

    case 'iframe':
      response = new Response(generateIframePage(link), {
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=60' },
      });
      break;

    case 'text': {
      const contentType = link.content_type || 'text/plain; charset=utf-8';
      response = new Response(link.content || '', {
        headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=60' },
      });
      break;
    }

    case 'html': {
      const contentType = link.content_type || 'text/html; charset=utf-8';
      response = new Response(link.content || '', {
        headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=60' },
      });
      break;
    }

    default:
      response = new Response(null, {
        status: 302,
        headers: { 'Location': link.url, 'Cache-Control': 'public, max-age=60' },
      });
  }

  ctx.waitUntil(cache.put(cacheKey, response.clone()));

  return response;
}

function checkBasicAuth(link: ShortLink, request: Request): Response | null {
  const username = link.basic_auth_username;
  const password = link.basic_auth_password;
  if (!username || !password) return null;

  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return unauthResponse();
  }

  const encoded = authHeader.slice(6);
  let decoded: string;
  try {
    decoded = atob(encoded);
  } catch {
    return unauthResponse();
  }

  const colonIndex = decoded.indexOf(':');
  if (colonIndex === -1) return unauthResponse();

  const user = decoded.slice(0, colonIndex);
  const pass = decoded.slice(colonIndex + 1);

  if (user !== username || pass !== password) return unauthResponse();
  return null;
}

function unauthResponse(): Response {
  return new Response('Unauthorized', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Short URL"' },
  });
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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function handleError(status: number, title: string, locale: Locale = 'zh'): Response {
  return new Response(
    renderHtml(React.createElement(ErrorPage, { status, message: title, locale })),
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}
