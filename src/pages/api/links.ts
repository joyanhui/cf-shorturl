import type { APIContext } from 'astro';
import { listLinks, createLink, updateLink, deleteLink, getLink } from '../../lib/kv';
import type { ListLinksOptions } from '../../lib/kv';
import { getSessionToken, validateSession, requireSessionResponse } from '../../lib/auth';

async function checkSession(context: APIContext): Promise<boolean> {
  const kv = context.locals.runtime.env.KV;
  const token = getSessionToken(context.request);
  return token ? await validateSession(kv, token) : false;
}

export async function GET(context: APIContext) {
  if (!(await checkSession(context))) return requireSessionResponse();
  const kv = context.locals.runtime.env.KV;
  const search = context.url.searchParams.get('search');
  const slug = context.url.searchParams.get('slug');
  const mode = context.url.searchParams.get('mode');
  const offset = parseInt(context.url.searchParams.get('offset') || '0', 10);
  const limit = parseInt(context.url.searchParams.get('limit') || '20', 10);

  if (slug) {
    const link = await getLink(kv, slug);
    if (!link) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify(link), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const opts: ListLinksOptions = {};
  if (search) opts.search = search;
  if (mode) opts.mode = mode;
  opts.offset = offset;
  opts.limit = limit;

  const result = await listLinks(kv, opts);
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(context: APIContext) {
  if (!(await checkSession(context))) return requireSessionResponse();
  const kv = context.locals.runtime.env.KV;
  const input = await context.request.json();

  try {
    const link = await createLink(kv, input);
    return new Response(JSON.stringify(link), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '创建失败';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function PUT(context: APIContext) {
  if (!(await checkSession(context))) return requireSessionResponse();
  const kv = context.locals.runtime.env.KV;
  const input = await context.request.json();

  try {
    const link = await updateLink(kv, input);
    if (!link) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify(link), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '更新失败';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function DELETE(context: APIContext) {
  if (!(await checkSession(context))) return requireSessionResponse();
  const kv = context.locals.runtime.env.KV;
  const slug = context.url.searchParams.get('slug');

  if (!slug) {
    return new Response(JSON.stringify({ error: 'slug 参数必填' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const deleted = await deleteLink(kv, slug);
  if (!deleted) {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
