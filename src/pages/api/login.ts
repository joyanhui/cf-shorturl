import type { APIContext } from 'astro';
import { initAdmin, verifyAdmin, createSession, destroySession, getSessionToken, setSessionCookie, clearSessionCookie } from '../../lib/auth';
import { getSettings, checkLoginRateLimit, incrementLoginAttempts, resetLoginAttempts } from '../../lib/kv';

export async function POST(context: APIContext) {
  const kv = context.locals.runtime.env.KV;
  await initAdmin(kv);

  const ip = context.request.headers.get('CF-Connecting-IP') || 'unknown';

  const { blocked } = await checkLoginRateLimit(kv, ip);
  if (blocked) {
    return new Response(JSON.stringify({ error: '登录尝试过于频繁，请 5 分钟后再试' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { password, cfTurnstileResponse } = await context.request.json();
  if (!password) {
    return new Response(JSON.stringify({ error: '请输入密码' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const settings = await getSettings(kv);
  if (settings?.turnstile_secret_key) {
    const token = cfTurnstileResponse;
    if (!token) {
      return new Response(JSON.stringify({ error: '请完成验证码' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }
    const formData = new FormData();
    formData.append('secret', settings.turnstile_secret_key);
    formData.append('response', token);
    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });
    const outcome = await verifyRes.json();
    if (!outcome.success) {
      return new Response(JSON.stringify({ error: '验证码验证失败' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  const ok = await verifyAdmin(kv, password);
  if (!ok) {
    await incrementLoginAttempts(kv, ip);
    return new Response(JSON.stringify({ error: '密码错误' }), {
      status: 403, headers: { 'Content-Type': 'application/json' },
    });
  }

  await resetLoginAttempts(kv, ip);

  const token = await createSession(kv);
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': setSessionCookie(token),
    },
  });
}

export async function DELETE(context: APIContext) {
  const kv = context.locals.runtime.env.KV;
  const token = getSessionToken(context.request);
  if (token) await destroySession(kv, token);
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': clearSessionCookie(),
    },
  });
}
