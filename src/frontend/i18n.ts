export type Locale = 'zh' | 'en';

const messages: Record<string, Record<Locale, string>> = {
  'site.title': { zh: 'CF ShortURL', en: 'CF ShortURL' },
  'login.title': { zh: '短链接管理系统', en: 'Short Link Manager' },
  'login.password': { zh: '管理员密码', en: 'Admin Password' },
  'login.placeholder': { zh: '请输入密码', en: 'Enter password' },
  'login.signIn': { zh: '登录', en: 'Sign In' },
  'login.error.invalid': { zh: '密码错误', en: 'Invalid password' },
  'logout': { zh: '退出登录', en: 'Logout' },
  'nav.dashboard': { zh: '短链接', en: 'Links' },
  'links.search': { zh: '搜索 slug 或目标 URL...', en: 'Search slug or URL...' },
  'links.allModes': { zh: '全部模式', en: 'All modes' },
  'links.new': { zh: '+ 新建', en: '+ New' },
  'links.thSlug': { zh: '短链接', en: 'Short Link' },
  'links.thUrl': { zh: '目标 URL', en: 'Target URL' },
  'links.thMode': { zh: '模式', en: 'Mode' },
  'links.thAuth': { zh: '认证', en: 'Auth' },
  'links.thCreated': { zh: '创建', en: 'Created' },
  'links.thActions': { zh: '操作', en: 'Actions' },
  'links.empty': { zh: '暂无短链接', en: 'No links yet' },
  'links.edit': { zh: '编辑', en: 'Edit' },
  'links.delete': { zh: '删除', en: 'Delete' },
  'links.total': { zh: '共 {n} 条', en: 'Total: {n}' },
  'links.page': { zh: '第 {p}/{t} 页', en: 'Page {p}/{t}' },
  'links.prev': { zh: '← 上一页', en: '← Prev' },
  'links.next': { zh: '下一页 →', en: 'Next →' },
  'modal.create': { zh: '新建短链接', en: 'New Short Link' },
  'modal.edit': { zh: '编辑短链接', en: 'Edit Short Link' },
  'modal.save': { zh: '保存', en: 'Save' },
  'modal.createBtn': { zh: '创建', en: 'Create' },
  'modal.cancel': { zh: '取消', en: 'Cancel' },
  'modal.deleteConfirm': { zh: '确定要删除 /{slug} 吗？', en: 'Delete /{slug}?' },
  'modal.deleteHint': { zh: '此操作不可恢复。', en: 'This cannot be undone.' },
  'modal.deleteBtn': { zh: '删除', en: 'Delete' },
  'pwd.title': { zh: '修改密码', en: 'Change Password' },
  'pwd.old': { zh: '原密码', en: 'Old Password' },
  'pwd.new': { zh: '新密码', en: 'New Password' },
  'pwd.confirm': { zh: '确认新密码', en: 'Confirm New Password' },
  'pwd.mismatch': { zh: '两次密码不一致', en: 'Passwords do not match' },
  'settings.title': { zh: '系统设置', en: 'Settings' },
  'settings.siteKey': { zh: 'Turnstile Site Key', en: 'Turnstile Site Key' },
  'settings.secretKey': { zh: 'Turnstile Secret Key', en: 'Turnstile Secret Key' },
  'settings.hint': { zh: '配置后登录页将显示 Cloudflare Turnstile 验证码', en: 'Enables Cloudflare Turnstile on login page' },
  'settings.saved': { zh: '设置已保存', en: 'Settings saved' },
  'pwd.success': { zh: '密码已修改', en: 'Password changed' },
  'logout.confirm': { zh: '确定退出登录吗？', en: 'Logout?' },
  'logout.confirmBtn': { zh: '退出', en: 'Logout' },
};

export function t(locale: Locale, key: string, params?: Record<string, string | number>): string {
  const msg = messages[key]?.[locale] || key;
  if (!params) return msg;
  return msg.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
}

export function detectLocale(): Locale {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('locale');
    if (stored === 'zh' || stored === 'en') return stored;
  }
  if (typeof navigator !== 'undefined') {
    const nav = navigator.language || '';
    if (nav.startsWith('zh')) return 'zh';
  }
  return 'en';
}

export function persistLocale(locale: Locale): void {
  try { localStorage.setItem('locale', locale); } catch {}
  document.cookie = 'locale=' + locale + ';Path=/;SameSite=Lax';
  document.documentElement.lang = locale;
}

export function toggleLang(locale: Locale): Locale {
  return locale === 'zh' ? 'en' : 'zh';
}

export const LANG_SCRIPT = '(function(){var l;try{l=localStorage.getItem("locale")}catch{}if(l==="zh"||l==="en"){document.documentElement.lang=l;document.cookie="locale="+l+";Path=/;SameSite=Lax"}else{var n=navigator.language||"";l=n.startsWith("zh")?"zh":"en";try{localStorage.setItem("locale",l)}catch{}document.documentElement.lang=l}})()';
