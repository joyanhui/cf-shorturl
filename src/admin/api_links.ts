import type { Env } from '../types';
import { listLinks, getLink, createLink, updateLink, deleteLink, togglePinLink } from '../lib/kv-fs';
import { ListLinksQuery, CreateLinkBody, UpdateLinkBody } from '../schemas';

function cacheKey(slug: string): Request {
  return new Request(`https://cache/shorturl/link/${slug}`);
}

export async function handleListLinks(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  const params: Record<string, string> = {};
  url.searchParams.forEach((v, k) => { params[k] = v; });
  const query = ListLinksQuery.parse(params);

  if (query.slug) {
    const link = await getLink(env, query.slug);
    if (!link) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }
    return Response.json(link);
  }

  const result = await listLinks(env, query);
  return Response.json(result);
}

export async function handleCreateLink(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch (e) {
    const text = await request.text().catch(() => '');
    return Response.json({ error: 'Invalid JSON: ' + (e instanceof Error ? e.message : String(e)) + ', body: ' + text.substring(0, 200) }, { status: 400 });
  }
  const parsed = CreateLinkBody.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message || '参数错误';
    return Response.json({ error: msg }, { status: 400 });
  }
  try {
    const link = await createLink(env, parsed.data);
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
  const parsed = UpdateLinkBody.safeParse(await request.json());
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message || '参数错误';
    return Response.json({ error: msg }, { status: 400 });
  }
  try {
    const link = await updateLink(env, parsed.data);
    if (!link) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }
    ctx.waitUntil(caches.default.delete(cacheKey(parsed.data.slug)));
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

export async function handleTogglePinLink(slug: string, request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const link = await togglePinLink(env, slug);
  if (!link) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }
  ctx.waitUntil(caches.default.delete(cacheKey(slug)));
  return Response.json(link);
}
