import type { APIContext } from 'astro';
import { getLink, incrementVisits } from '../lib/kv';
import type { ShortLink } from '../lib/types';

export async function GET(context: APIContext) {
  const kv = context.locals.runtime.env.KV;
  const slug = context.params.slug;

  if (!slug) {
    return new Response('Not found', { status: 404 });
  }

  const link = await getLink(kv, slug);
  if (!link) {
    return notFoundPage();
  }

  context.locals.runtime.ctx.waitUntil(incrementVisits(kv, slug));

  switch (link.mode) {
    case 'redirect_301':
      return new Response(null, {
        status: 301,
        headers: { 'Location': link.url },
      });

    case 'redirect_302':
      return new Response(null, {
        status: 302,
        headers: { 'Location': link.url },
      });

    case 'iframe':
      return new Response(generateIframePage(link), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });

    case 'text': {
      const contentType = link.content_type || 'text/plain; charset=utf-8';
      return new Response(link.content || '', {
        headers: { 'Content-Type': contentType },
      });
    }

    case 'html': {
      const contentType = link.content_type || 'text/html; charset=utf-8';
      return new Response(link.content || '', {
        headers: { 'Content-Type': contentType },
      });
    }

    default:
      return new Response(null, {
        status: 302,
        headers: { 'Location': link.url },
      });
  }
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

function notFoundPage(): Response {
  return new Response(
    `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>链接不存在</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
    .card { text-align: center; padding: 40px; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h1 { color: #666; font-size: 24px; }
    p { color: #999; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>链接不存在或已失效</h1>
    <p>请检查短链接是否正确</p>
  </div>
</body>
</html>`,
    {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    }
  );
}
