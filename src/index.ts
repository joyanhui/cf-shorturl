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
        return handleHomepage(ctx);
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

async function handleHomepage(ctx: ExecutionContext): Promise<Response> {
  const cache = caches.default;
  const cacheKey = new Request('https://cache/shorturl/homepage');
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CF ShortURL</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:linear-gradient(135deg,#f9fafb 0,#fff 100%);min-height:100vh;color:#333}
    .wrap{max-width:720px;margin:0 auto;padding:60px 24px;text-align:center}
    h1{font-size:2.8em;font-weight:800;margin-bottom:8px;letter-spacing:-.02em}
    .sub{font-size:1.05em;color:#666;margin-bottom:40px;line-height:1.6}
    .badge{display:inline-block;padding:4px 14px;background:#eff6ff;color:#2563eb;border-radius:20px;font-size:12px;font-weight:600;margin-bottom:20px}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;text-align:left;margin-bottom:48px}
    .card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:18px;transition:box-shadow .15s}
    .card:hover{box-shadow:0 4px 12px rgba(0,0,0,.06)}
    .card h3{font-size:14px;font-weight:700;margin-bottom:4px}
    .card p{font-size:13px;color:#666;line-height:1.5}
    .card .icon{font-size:20px;margin-bottom:6px}
    .links{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
    .btn{display:inline-flex;align-items:center;gap:6px;padding:10px 22px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;transition:all .12s}
    .btn-primary{background:#1f2937;color:#fff}
    .btn-primary:hover{background:#111827}
    .btn-outline{background:#fff;color:#374151;border:1px solid #d1d5db}
    .btn-outline:hover{background:#f9fafb;border-color:#9ca3af}
    .footer{border-top:1px solid #e5e7eb;padding:24px 0;margin-top:16px;font-size:12px;color:#9ca3af;text-align:center}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="badge">Cloudflare Workers</div>
    <h1>CF ShortURL</h1>
    <p class="sub">A short URL management system with multiple redirect modes, BasicAuth protection, and a built-in admin panel.</p>
    <div class="grid">
      <div class="card">
        <div class="icon">↗</div>
        <h3>302 / 301 Redirect</h3>
        <p>Temporary or permanent URL forwarding with edge caching.</p>
      </div>
      <div class="card">
        <div class="icon">🔄</div>
        <h3>Iframe Embed</h3>
        <p>Hide the target URL behind an iframe with optional JS injection.</p>
      </div>
      <div class="card">
        <div class="icon">📄</div>
        <h3>Text / HTML</h3>
        <p>Return raw text or HTML content directly from the short link.</p>
      </div>
      <div class="card">
        <div class="icon">🔒</div>
        <h3>BasicAuth</h3>
        <p>Protect individual links with username/password authentication.</p>
      </div>
      <div class="card">
        <div class="icon">⚡</div>
        <h3>Edge Cache</h3>
        <p>Responses cached at Cloudflare edge for fast global access.</p>
      </div>
      <div class="card">
        <div class="icon">📊</div>
        <h3>Admin Panel</h3>
        <p>Built-in SPA for creating, editing, and managing short links.</p>
      </div>
    </div>
    <div class="links">
      <a href="/admin" class="btn btn-primary">🔗 Admin Panel</a>
      <a href="https://github.com/joyanhui/cf-shorturl" target="_blank" rel="noopener" class="btn btn-outline">GitHub</a>
    </div>
  </div>
  <div class="footer">Powered by Cloudflare Workers</div>
</body>
</html>`;
  const response = new Response(html, {
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
    return new Response(
      renderHtml(React.createElement(ErrorPage, { status: 404, message: '链接不存在或已失效' })),
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

function handleError(status: number, title: string): Response {
  return new Response(
    renderHtml(React.createElement(ErrorPage, { status, message: title })),
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}
