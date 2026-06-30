import type { ShortLink, CreateLinkInput, UpdateLinkInput } from './types';

const LINK_PREFIX = 'link:';

function generateSlug(length = 6): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let slug = '';
  for (let i = 0; i < length; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
}

export async function listLinks(kv: KVNamespace, search?: string): Promise<ShortLink[]> {
  const list = await kv.list({ prefix: LINK_PREFIX });
  const links: ShortLink[] = [];

  for (const key of list.keys) {
    const value = await kv.get(key.name);
    if (value) {
      links.push(JSON.parse(value));
    }
  }

  if (search) {
    const q = search.toLowerCase();
    return links.filter(
      (l) => l.slug.toLowerCase().includes(q) || l.url.toLowerCase().includes(q)
    );
  }

  return links.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getLink(kv: KVNamespace, slug: string): Promise<ShortLink | null> {
  const value = await kv.get(`${LINK_PREFIX}${slug}`);
  return value ? JSON.parse(value) : null;
}

export async function createLink(kv: KVNamespace, input: CreateLinkInput): Promise<ShortLink> {
  const slug = input.slug || generateSlug();

  const existing = await kv.get(`${LINK_PREFIX}${slug}`);
  if (existing) {
    throw new Error(`Slug "${slug}" 已存在`);
  }

  const now = new Date().toISOString();
  const link: ShortLink = {
    slug,
    url: input.url,
    mode: input.mode,
    title: input.title,
    inject_js: input.inject_js,
    content: input.content,
    content_type: input.content_type,
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

  if (input.url !== undefined) link.url = input.url;
  if (input.mode !== undefined) link.mode = input.mode;
  if (input.title !== undefined) link.title = input.title;
  if (input.inject_js !== undefined) link.inject_js = input.inject_js;
  if (input.content !== undefined) link.content = input.content;
  if (input.content_type !== undefined) link.content_type = input.content_type;

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
