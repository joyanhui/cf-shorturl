import React from 'react';
import { Env } from './types';
import { renderHtml } from './render';
import { ErrorPage } from './frontend/ErrorPage';
import { adminHandler } from './admin/index';
import { getLink } from './lib/kv-fs';
import type { ShortLink } from './lib/types';
import { adminHTML } from './frontend/admin.gen';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }

    try {
      // API routes
      if (path.startsWith('/api/')) {
        return adminHandler(request, env, ctx);
      }

      // Root → SPA (dashboard or login)
      if (path === '/' || path === '/login') {
        return new Response(adminHTML, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }

      // Short link access
      if (path.length > 1) {
        const slug = path.slice(1);
        return handleSlug(slug, request, env, ctx);
      }

      return handleError(404, 'Not Found');
    } catch (e) {
      console.error('Unhandled error:', e);
      return handleError(500, 'Internal Server Error');
    }
  },
};

const CACHE_TTL_SEC = 60;

async function handleSlug(slug: string, request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const cache = caches.default;
  const cacheKey = new Request(`https://cache/shorturl/link/${slug}`);

  // Edge cache hit?
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  // Fetch from kv-filesystem
  const link = await getLink(env, slug);
  if (!link) {
    return new Response(
      renderHtml(React.createElement(ErrorPage, { status: 404, message: '链接不存在或已失效' })),
      { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  // Check BasicAuth
  const authCheck = checkBasicAuth(link, request);
  if (authCheck) return authCheck;

  // Build response based on mode
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

  // Write to edge cache (fire-and-forget)
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

function handleError(status: number, title: string): Response {
  return new Response(
    renderHtml(React.createElement(ErrorPage, { status, message: title })),
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}
