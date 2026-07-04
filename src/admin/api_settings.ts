import type { Env } from '../types';
import { getSettings, updateSettings } from '../lib/kv-fs';
import { SiteSettings } from '../schemas';

export async function handleGetSettings(_request: Request, env: Env): Promise<Response> {
  const settings = await getSettings(env);
  return Response.json(settings || {});
}

export async function handleUpdateSettings(request: Request, env: Env): Promise<Response> {
  const parsed = SiteSettings.safeParse(await request.json());
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message || '参数错误';
    return Response.json({ error: msg }, { status: 400 });
  }
  const settings = await updateSettings(env, parsed.data);
  return Response.json(settings);
}
