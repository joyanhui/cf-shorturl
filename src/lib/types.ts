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
  basic_auth_username?: string;
  basic_auth_password?: string;
  sort_order?: number;
  remark?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateLinkInput {
  slug?: string;
  url: string;
  mode: LinkMode;
  title?: string;
  inject_js?: string;
  content?: string;
  content_type?: string;
  basic_auth_username?: string;
  basic_auth_password?: string;
  remark?: string;
}

export interface UpdateLinkInput {
  slug: string;
  url?: string;
  mode?: LinkMode;
  title?: string;
  inject_js?: string;
  content?: string;
  content_type?: string;
  basic_auth_username?: string;
  basic_auth_password?: string;
  remark?: string;
}

export interface SiteSettings {
  turnstile_site_key?: string;
  turnstile_secret_key?: string;
}
