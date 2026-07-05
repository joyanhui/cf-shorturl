import type { Env } from '../types';
import type { ShortLink, CreateLinkInput, UpdateLinkInput, SiteSettings } from './types';

const PREFIX = 'shorturl_';
const PKEY_LINKS_INDEX = PREFIX + 'links:index';
const PKEY_LINK = (slug: string) => PREFIX + 'link:' + slug;
const PKEY_CONFIG_SETTINGS = PREFIX + 'config:settings';

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

// --- Memory cache ---
const memCache = new Map<string, { data: unknown; expiry: number }>();

function mcGet<T>(key: string): T | null {
  const entry = memCache.get(key);
  if (entry && entry.expiry > Date.now()) return entry.data as T;
  memCache.delete(key);
  return null;
}

function mcSet(key: string, data: unknown, ttlMs: number): void {
  memCache.set(key, { data, expiry: Date.now() + ttlMs });
}

function mcDel(key: string): void {
  memCache.delete(key);
}

// --- Generic kv-filesystem fetch ---
async function fsFetch(env: Env, method: string, pkey: string, body?: ArrayBuffer | string): Promise<Response> {
  const url = `https://internal/api/v1/${encodeURIComponent(pkey)}`;
  const headers: Record<string, string> = {
    'X-API-Key': env.KV_FS_API_KEY,
  };
  if (body) {
    headers['Content-Type'] = 'application/octet-stream';
  }
  return env.KV_FILESYSTEM.fetch(url, {
    method,
    headers,
    body: body || undefined,
  });
}

async function fsGetArrayBuffer(env: Env, pkey: string): Promise<ArrayBuffer | null> {
  const res = await fsFetch(env, 'GET', pkey);
  if (!res.ok) return null;
  return res.arrayBuffer();
}

async function fsPutJSON(env: Env, pkey: string, data: unknown): Promise<void> {
  const body = new TextEncoder().encode(JSON.stringify(data)).buffer;
  const res = await fsFetch(env, 'PUT', pkey, body);
  if (!res.ok) throw new Error(`kv-fs write failed for ${pkey}: ${res.status}`);
}

async function fsDelete(env: Env, pkey: string): Promise<boolean> {
  const res = await fsFetch(env, 'DELETE', pkey);
  return res.ok;
}

async function fsGetJSON<T>(env: Env, pkey: string): Promise<T | null> {
  const buf = await fsGetArrayBuffer(env, pkey);
  if (!buf) return null;
  return JSON.parse(new TextDecoder().decode(buf)) as T;
}

// --- Links index management ---
const INDEX_CACHE_TTL = 60_000;

async function getLinksIndex(env: Env): Promise<string[]> {
  let slugs = mcGet<string[]>(PKEY_LINKS_INDEX);
  if (slugs) return slugs;
  const data = await fsGetJSON<string[]>(env, PKEY_LINKS_INDEX);
  slugs = data || [];
  mcSet(PKEY_LINKS_INDEX, slugs, INDEX_CACHE_TTL);
  return slugs;
}

async function saveLinksIndex(env: Env, slugs: string[]): Promise<void> {
  await fsPutJSON(env, PKEY_LINKS_INDEX, slugs);
  mcSet(PKEY_LINKS_INDEX, slugs, INDEX_CACHE_TTL);
}

// --- Link CRUD ---
export async function listLinks(env: Env, options?: ListLinksOptions): Promise<ListLinksResult> {
  const slugs = await getLinksIndex(env);
  const allLinks: ShortLink[] = [];
  for (const slug of slugs) {
    const link = await getLink(env, slug);
    if (link) allLinks.push(link);
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

export async function getLink(env: Env, slug: string): Promise<ShortLink | null> {
  return fsGetJSON<ShortLink>(env, PKEY_LINK(slug));
}

export async function createLink(env: Env, input: CreateLinkInput): Promise<ShortLink> {
  let slug = input.slug || '';
  if (slug) {
    const slugErr = validateSlug(slug);
    if (slugErr) throw new Error(slugErr);
    const existing = await getLink(env, slug);
    if (existing) throw new Error(`Slug "${slug}" 已存在`);
  } else {
    for (let attempt = 0; attempt < 10; attempt++) {
      slug = generateSlug();
      const existing = await getLink(env, slug);
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
  };

  await fsPutJSON(env, PKEY_LINK(slug), link);
  const slugs = await getLinksIndex(env);
  slugs.unshift(slug);
  await saveLinksIndex(env, slugs);

  return link;
}

export async function updateLink(env: Env, input: UpdateLinkInput): Promise<ShortLink | null> {
  const link = await getLink(env, input.slug);
  if (!link) return null;

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
  if (input.basic_auth_username !== undefined) link.basic_auth_username = input.basic_auth_username || undefined;
  if (input.basic_auth_password !== undefined) link.basic_auth_password = input.basic_auth_password || undefined;

  link.updated_at = new Date().toISOString();
  await fsPutJSON(env, PKEY_LINK(input.slug), link);
  return link;
}

export async function deleteLink(env: Env, slug: string): Promise<boolean> {
  const existing = await getLink(env, slug);
  if (!existing) return false;
  await fsDelete(env, PKEY_LINK(slug));
  const slugs = await getLinksIndex(env);
  const idx = slugs.indexOf(slug);
  if (idx !== -1) {
    slugs.splice(idx, 1);
    await saveLinksIndex(env, slugs);
  }
  return true;
}

// --- Site settings ---
const SETTINGS_CACHE_TTL = 300_000;

export async function getSettings(env: Env): Promise<SiteSettings | null> {
  let s = mcGet<SiteSettings>(PKEY_CONFIG_SETTINGS);
  if (s) return s;
  s = await fsGetJSON<SiteSettings>(env, PKEY_CONFIG_SETTINGS);
  if (s) mcSet(PKEY_CONFIG_SETTINGS, s, SETTINGS_CACHE_TTL);
  return s || null;
}

export async function updateSettings(env: Env, input: SiteSettings): Promise<SiteSettings> {
  const settings: SiteSettings = {
    turnstile_site_key: input.turnstile_site_key || undefined,
    turnstile_secret_key: input.turnstile_secret_key || undefined,
  };
  await fsPutJSON(env, PKEY_CONFIG_SETTINGS, settings);
  mcSet(PKEY_CONFIG_SETTINGS, settings, SETTINGS_CACHE_TTL);
  return settings;
}
