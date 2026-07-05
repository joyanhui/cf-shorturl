import { z } from 'zod';

export const LinkMode = z.enum(['redirect_302', 'redirect_301', 'iframe', 'text', 'html']);
export type LinkModeT = z.infer<typeof LinkMode>;

export const ShortLink = z.object({
  slug: z.string(),
  url: z.string(),
  mode: LinkMode,
  title: z.string().optional(),
  inject_js: z.string().optional(),
  content: z.string().optional(),
  content_type: z.string().optional(),
  basic_auth_username: z.string().optional(),
  basic_auth_password: z.string().optional(),
  sort_order: z.number().optional(),
  remark: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type ShortLinkT = z.infer<typeof ShortLink>;

export const CreateLinkBody = z.object({
  slug: z.string().regex(/^[a-zA-Z0-9\-_.~]+$/).max(255).optional(),
  url: z.string().refine((u) => u.startsWith('http://') || u.startsWith('https://'), {
    message: 'URL 必须以 http:// 或 https:// 开头',
  }),
  mode: LinkMode,
  title: z.string().max(500).optional(),
  inject_js: z.string().optional(),
  content: z.string().optional(),
  content_type: z.string().optional(),
  basic_auth_username: z.string().optional(),
  basic_auth_password: z.string().optional(),
  remark: z.string().optional(),
});
export type CreateLinkBodyT = z.infer<typeof CreateLinkBody>;

export const UpdateLinkBody = z.object({
  slug: z.string().min(1),
  url: z.string().refine((u) => u.startsWith('http://') || u.startsWith('https://'), {
    message: 'URL 必须以 http:// 或 https:// 开头',
  }).optional(),
  mode: LinkMode.optional(),
  title: z.string().max(500).optional(),
  inject_js: z.string().optional(),
  content: z.string().optional(),
  content_type: z.string().optional(),
  basic_auth_username: z.string().optional(),
  basic_auth_password: z.string().optional(),
  remark: z.string().optional(),
});
export type UpdateLinkBodyT = z.infer<typeof UpdateLinkBody>;

export const ListLinksQuery = z.object({
  search: z.string().optional(),
  slug: z.string().optional(),
  mode: LinkMode.optional(),
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListLinksQueryT = z.infer<typeof ListLinksQuery>;

export const LoginBody = z.object({
  password: z.string().min(1, '请输入密码'),
  cfTurnstileResponse: z.string().optional(),
});
export type LoginBodyT = z.infer<typeof LoginBody>;

export const ChangePasswordBody = z.object({
  oldPassword: z.string().min(1, '请输入原密码'),
  newPassword: z.string().min(6, '新密码至少 6 位'),
});
export type ChangePasswordBodyT = z.infer<typeof ChangePasswordBody>;

export const SiteSettings = z.object({
  turnstile_site_key: z.string().optional(),
  turnstile_secret_key: z.string().optional(),
});
export type SiteSettingsT = z.infer<typeof SiteSettings>;

export const ErrorResponse = z.object({
  error: z.string(),
});

export const MessageResponse = z.object({
  message: z.string(),
});
