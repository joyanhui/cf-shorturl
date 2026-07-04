import type { Env } from '../types';
import { getSettings, updateSettings } from '../lib/kv-fs';

export async function handleGetSettings(_request: Request, env: Env): Promise<Response> {
  const settings = await getSettings(env);
  return Response.json(settings || {});
}

export async function handleUpdateSettings(request: Request, env: Env): Promise<Response> {
  const input = await request.json() as any;
  const settings = await updateSettings(env, input);
  return Response.json(settings);
}
