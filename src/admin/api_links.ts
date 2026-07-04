import type { Env } from '../types';
import { listLinks, getLink, createLink, updateLink, deleteLink } from '../lib/kv-fs';
import type { ListLinksOptions } from '../lib/kv-fs';

function cacheKey(slug: string): Request {
  return new Request(`https://cache/shorturl/link/${slug}`);
}

export async function handleListLinks(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  const search = url.searchParams.get('search');
  const slug = url.searchParams.get('slug');
  const mode = url.searchParams.get('mode');
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);

  if (slug) {
    const link = await getLink(env, slug);
    if (!link) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }
    return Response.json(link);
  }

  const opts: ListLinksOptions = {};
  if (search) opts.search = search;
  if (mode) opts.mode = mode;
  opts.offset = offset;
  opts.limit = limit;

  const result = await listLinks(env, opts);
  return Response.json(result);
}

export async function handleCreateLink(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const input = await request.json() as any;
  try {
    const link = await createLink(env, input);
    return new Response(JSON.stringify(link), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '创建失败';
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function handleUpdateLink(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const input = await request.json() as any;
  try {
    const link = await updateLink(env, input);
    if (!link) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }
    ctx.waitUntil(caches.default.delete(cacheKey(input.slug)));
    return Response.json(link);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '更新失败';
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function handleDeleteLink(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');
  if (!slug) {
    return Response.json({ error: 'slug 参数必填' }, { status: 400 });
  }
  const deleted = await deleteLink(env, slug);
  if (!deleted) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }
  ctx.waitUntil(caches.default.delete(cacheKey(slug)));
  return Response.json({ success: true });
}
