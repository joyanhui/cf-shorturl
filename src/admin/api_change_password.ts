import type { Env } from '../types';
import { changePassword } from '../lib/auth';
import { ChangePasswordBody } from '../schemas';

export async function handleChangePassword(request: Request, env: Env): Promise<Response> {
  const parsed = ChangePasswordBody.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: parsed.error.errors[0]?.message || '参数错误' }, { status: 400 });
  }
  const { oldPassword, newPassword } = parsed.data;

  const result = await changePassword(env, oldPassword, newPassword);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 403 });
  }
  return Response.json({ ok: true });
}
