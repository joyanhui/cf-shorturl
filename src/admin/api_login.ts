import type { Env } from '../types';
import { initAdmin, verifyAdmin, signToken, setTokenCookie, clearTokenCookie } from '../lib/auth';
import { getSettings } from '../lib/kv-fs';
import { LoginBody } from '../schemas';

export async function handleLogin(request: Request, env: Env, adminPath: string): Promise<Response> {
  try {
    await initAdmin(env);
  } catch (e) {
    console.error('initAdmin failed:', e);
    return Response.json({ error: '存储服务不可用，请检查 KV_FS_API_KEY 配置' }, { status: 503 });
  }

  const parsed = LoginBody.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: parsed.error.errors[0]?.message || '参数错误' }, { status: 400 });
  }
  const { password, cfTurnstileResponse } = parsed.data;

  const settings = await getSettings(env);
  if (settings?.turnstile_secret_key) {
    if (!cfTurnstileResponse) {
      return Response.json({ error: '请完成验证码' }, { status: 400 });
    }
    const formData = new FormData();
    formData.append('secret', settings.turnstile_secret_key);
    formData.append('response', cfTurnstileResponse);
    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });
    const outcome: any = await verifyRes.json();
    if (!outcome.success) {
      return Response.json({ error: '验证码验证失败' }, { status: 400 });
    }
  }

  const ok = await verifyAdmin(env, password);
  if (!ok) {
    return Response.json({ error: '密码错误' }, { status: 403 });
  }

  const token = await signToken(env);
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': setTokenCookie(token, adminPath),
    },
  });
}

export function handleLogout(adminPath: string): Response {
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': clearTokenCookie(adminPath),
    },
  });
}
