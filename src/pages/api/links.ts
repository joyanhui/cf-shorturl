import type { APIContext } from 'astro';
import { listLinks, createLink, updateLink, deleteLink, getLink } from '../../lib/kv';

export async function GET(context: APIContext) {
  const kv = context.locals.runtime.env.KV;
  const search = context.url.searchParams.get('search');
  const slug = context.url.searchParams.get('slug');

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

  const links = await listLinks(kv, search || undefined);
  return new Response(JSON.stringify(links), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(context: APIContext) {
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
  const kv = context.locals.runtime.env.KV;
  const input = await context.request.json();

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
}

export async function DELETE(context: APIContext) {
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
