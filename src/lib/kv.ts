import type { ShortLink, CreateLinkInput, UpdateLinkInput, SiteSettings } from './types';

const LINK_PREFIX = 'link:';
const VALID_MODES = new Set(['redirect_302', 'redirect_301', 'iframe', 'text', 'html']);

function generateSlug(length = 6): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let slug = '';
  for (let i = 0; i < length; i++) slug += chars[bytes[i] % chars.length];
  return slug;
}

function safeUrlScheme(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function validateSlug(slug: string): string | null {
  if (slug.length > 255) return 'Slug 最长 255 个字符';
  if (!/^[a-zA-Z0-9\-_.~]+$/.test(slug)) return 'Slug 只能包含字母、数字、- _ . ~';
  return null;
}

export interface ListLinksOptions {
  search?: string;
  mode?: string;
  offset?: number;
  limit?: number;
}

export interface ListLinksResult {
  links: ShortLink[];
  total: number;
  offset: number;
  limit: number;
}

export async function listLinks(kv: KVNamespace, options?: ListLinksOptions): Promise<ListLinksResult> {
  const list = await kv.list({ prefix: LINK_PREFIX });
  const allLinks: ShortLink[] = [];

  for (const key of list.keys) {
    const value = await kv.get(key.name);
    if (value) {
      allLinks.push(JSON.parse(value));
    }
  }

  allLinks.sort((a, b) => b.created_at.localeCompare(a.created_at));

  let filtered = allLinks;
  if (options?.search) {
    const q = options.search.toLowerCase();
    filtered = filtered.filter(
      (l) => l.slug.toLowerCase().includes(q) || l.url.toLowerCase().includes(q)
    );
  }
  if (options?.mode) {
    filtered = filtered.filter((l) => l.mode === options.mode);
  }

  const total = filtered.length;
  const offset = Math.max(0, options?.offset ?? 0);
  const limit = Math.min(100, Math.max(1, options?.limit ?? 20));
  const links = filtered.slice(offset, offset + limit);

  return { links, total, offset, limit };
}

export async function getLink(kv: KVNamespace, slug: string): Promise<ShortLink | null> {
  const value = await kv.get(`${LINK_PREFIX}${slug}`);
  return value ? JSON.parse(value) : null;
}

export async function createLink(kv: KVNamespace, input: CreateLinkInput): Promise<ShortLink> {
  let slug = input.slug || '';

  if (slug) {
    const slugErr = validateSlug(slug);
    if (slugErr) throw new Error(slugErr);
    const existing = await kv.get(`${LINK_PREFIX}${slug}`);
    if (existing) throw new Error(`Slug "${slug}" 已存在`);
  } else {
    for (let attempt = 0; attempt < 10; attempt++) {
      slug = generateSlug();
      const existing = await kv.get(`${LINK_PREFIX}${slug}`);
      if (!existing) break;
      if (attempt === 9) throw new Error('无法生成唯一的 Slug，请重试');
    }
  }

  if (!safeUrlScheme(input.url)) throw new Error('URL 必须以 http:// 或 https:// 开头');

  if (input.mode && !VALID_MODES.has(input.mode)) throw new Error(`无效的响应模式: ${input.mode}`);

  const now = new Date().toISOString();
  const link: ShortLink = {
    slug,
    url: input.url,
    mode: input.mode,
    title: input.title,
    inject_js: input.inject_js,
    content: input.content,
    content_type: input.content_type,
    basic_auth_username: input.basic_auth_username || undefined,
    basic_auth_password: input.basic_auth_password || undefined,
    created_at: now,
    updated_at: now,
    visit_count: 0,
  };

  await kv.put(`${LINK_PREFIX}${slug}`, JSON.stringify(link));
  return link;
}

export async function updateLink(kv: KVNamespace, input: UpdateLinkInput): Promise<ShortLink | null> {
  const existing = await kv.get(`${LINK_PREFIX}${input.slug}`);
  if (!existing) return null;

  const link: ShortLink = JSON.parse(existing);

  if (input.url !== undefined) {
    if (!safeUrlScheme(input.url)) throw new Error('URL 必须以 http:// 或 https:// 开头');
    link.url = input.url;
  }
  if (input.mode !== undefined) {
    if (!VALID_MODES.has(input.mode)) throw new Error(`无效的响应模式: ${input.mode}`);
    link.mode = input.mode;
  }
  if (input.title !== undefined) link.title = input.title;
  if (input.inject_js !== undefined) link.inject_js = input.inject_js;
  if (input.content !== undefined) link.content = input.content;
  if (input.content_type !== undefined) link.content_type = input.content_type;
  if (input.basic_auth_username !== undefined) {
    link.basic_auth_username = input.basic_auth_username || undefined;
  }
  if (input.basic_auth_password !== undefined) {
    link.basic_auth_password = input.basic_auth_password || undefined;
  }

  link.updated_at = new Date().toISOString();

  await kv.put(`${LINK_PREFIX}${input.slug}`, JSON.stringify(link));
  return link;
}

export async function deleteLink(kv: KVNamespace, slug: string): Promise<boolean> {
  const existing = await kv.get(`${LINK_PREFIX}${slug}`);
  if (!existing) return false;

  await kv.delete(`${LINK_PREFIX}${slug}`);
  return true;
}

export async function incrementVisits(kv: KVNamespace, slug: string): Promise<void> {
  const existing = await kv.get(`${LINK_PREFIX}${slug}`);
  if (existing) {
    const link: ShortLink = JSON.parse(existing);
    link.visit_count++;
    await kv.put(`${LINK_PREFIX}${slug}`, JSON.stringify(link));
  }
}

// Site settings
export async function getSettings(kv: KVNamespace): Promise<SiteSettings | null> {
  const data = await kv.get('config:settings');
  return data ? JSON.parse(data) : null;
}

export async function updateSettings(kv: KVNamespace, input: SiteSettings): Promise<SiteSettings> {
  const settings: SiteSettings = {
    turnstile_site_key: input.turnstile_site_key || undefined,
    turnstile_secret_key: input.turnstile_secret_key || undefined,
  };
  await kv.put('config:settings', JSON.stringify(settings));
  return settings;
}

// Login rate limiting
const RATE_LIMIT_WINDOW = 300;
const RATE_LIMIT_MAX = 5;

export async function checkLoginRateLimit(kv: KVNamespace, ip: string): Promise<{ blocked: boolean }> {
  const data = await kv.get(`ratelimit:login:${ip}`);
  if (!data) return { blocked: false };
  const { count } = JSON.parse(data);
  return { blocked: count >= RATE_LIMIT_MAX };
}

export async function incrementLoginAttempts(kv: KVNamespace, ip: string): Promise<void> {
  const key = `ratelimit:login:${ip}`;
  const data = await kv.get(key);
  const count = data ? JSON.parse(data).count + 1 : 1;
  await kv.put(key, JSON.stringify({ count }), { expirationTtl: RATE_LIMIT_WINDOW });
}

export async function resetLoginAttempts(kv: KVNamespace, ip: string): Promise<void> {
  await kv.delete(`ratelimit:login:${ip}`);
}
