export type RedirectMode = 'redirect_302' | 'redirect_301';
export type ContentMode = 'iframe' | 'text' | 'html';
export type LinkMode = RedirectMode | ContentMode;

export interface ShortLink {
  slug: string;
  url: string;
  mode: LinkMode;
  title?: string;
  inject_js?: string;
  content?: string;
  content_type?: string;
  created_at: string;
  updated_at: string;
  visit_count: number;
}

export interface CreateLinkInput {
  slug?: string;
  url: string;
  mode: LinkMode;
  title?: string;
  inject_js?: string;
  content?: string;
  content_type?: string;
}

export interface UpdateLinkInput {
  slug: string;
  url?: string;
  mode?: LinkMode;
  title?: string;
  inject_js?: string;
  content?: string;
  content_type?: string;
}
