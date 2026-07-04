import type { Env } from '../types';
import { initAdmin, verifyAdmin, signToken, setTokenCookie, clearTokenCookie } from '../lib/auth';
import { getSettings } from '../lib/kv-fs';

export async function handleLogin(request: Request, env: Env): Promise<Response> {
  await initAdmin(env);

  const { username, password, cfTurnstileResponse } = await request.json() as any;
  if (!username || !password) {
    return Response.json({ error: '请输入用户名和密码' }, { status: 400 });
  }

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

  const ok = await verifyAdmin(env, username, password);
  if (!ok) {
    return Response.json({ error: '用户名或密码错误' }, { status: 403 });
  }

  const token = await signToken(env);
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': setTokenCookie(token),
    },
  });
}

export function handleLogout(): Response {
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': clearTokenCookie(),
    },
  });
}
