import type { APIContext } from 'astro';
import { changePassword, getSessionToken, validateSession, requireSessionResponse } from '../../lib/auth';

export async function POST(context: APIContext) {
  const kv = context.locals.runtime.env.KV;
  const token = getSessionToken(context.request);
  if (!token || !(await validateSession(kv, token))) {
    return requireSessionResponse();
  }

  const { oldPassword, newPassword } = await context.request.json();
  if (!oldPassword || !newPassword) {
    return new Response(JSON.stringify({ error: '请填写原密码和新密码' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  if (newPassword.length < 6) {
    return new Response(JSON.stringify({ error: '新密码至少 6 位' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const result = await changePassword(kv, oldPassword, newPassword);
  if (!result.ok) {
    return new Response(JSON.stringify({ error: result.error }), {
      status: 403, headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
