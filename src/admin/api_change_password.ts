import type { Env } from '../types';
import { changePassword } from '../lib/auth';

export async function handleChangePassword(request: Request, env: Env): Promise<Response> {
  const { oldPassword, newPassword } = await request.json() as any;
  if (!oldPassword || !newPassword) {
    return Response.json({ error: '请填写原密码和新密码' }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return Response.json({ error: '新密码至少 6 位' }, { status: 400 });
  }

  const result = await changePassword(env, oldPassword, newPassword);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 403 });
  }
  return Response.json({ ok: true });
}
