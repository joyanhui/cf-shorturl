export type Locale = 'zh' | 'en';

const messages = {
  'site.title': { zh: 'CF ShortURL', en: 'CF ShortURL' },
  'login.title': { zh: '短链接管理系统', en: 'Short Link Manager' },
  'login.password': { zh: '管理员密码', en: 'Admin Password' },
  'login.placeholder': { zh: '请输入密码', en: 'Enter password' },
  'login.signIn': { zh: '登录', en: 'Sign In' },
  'login.error.invalid': { zh: '密码错误', en: 'Invalid password' },
  'login.defaultPathWarning.title': { zh: '安全提醒', en: 'Security Notice' },
  'login.defaultPathWarning.body': { zh: '管理后台路径为默认值 /admin，建议通过 ADMIN_PATH 环境变量修改为自定义路径以增强安全性。', en: 'The admin panel path is set to the default /admin. For better security, change it via the ADMIN_PATH environment variable.' },
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
  'homepage.badge': { zh: 'Cloudflare Workers', en: 'Cloudflare Workers' },
  'homepage.title': { zh: 'CF ShortURL', en: 'CF ShortURL' },
  'homepage.subtitle': { zh: '一款短链接管理系统，支持多种重定向模式、BasicAuth 保护和内置管理面板。', en: 'A short URL management system with multiple redirect modes, BasicAuth protection, and a built-in admin panel.' },
  'homepage.feature1.title': { zh: '302 / 301 重定向', en: '302 / 301 Redirect' },
  'homepage.feature1.desc': { zh: '临时或永久 URL 转发，支持边缘缓存。', en: 'Temporary or permanent URL forwarding with edge caching.' },
  'homepage.feature2.title': { zh: 'Iframe 嵌入', en: 'Iframe Embed' },
  'homepage.feature2.desc': { zh: '在 iframe 中隐藏目标 URL，支持可选 JS 注入。', en: 'Hide the target URL behind an iframe with optional JS injection.' },
  'homepage.feature3.title': { zh: '文本 / HTML', en: 'Text / HTML' },
  'homepage.feature3.desc': { zh: '通过短链接直接返回纯文本或 HTML 内容。', en: 'Return raw text or HTML content directly from the short link.' },
  'homepage.feature4.title': { zh: 'BasicAuth 认证', en: 'BasicAuth' },
  'homepage.feature4.desc': { zh: '为单个链接设置用户名密码认证保护。', en: 'Protect individual links with username/password authentication.' },
  'homepage.feature5.title': { zh: '边缘缓存', en: 'Edge Cache' },
  'homepage.feature5.desc': { zh: '响应在 Cloudflare 边缘节点缓存，全球快速访问。', en: 'Responses cached at Cloudflare edge for fast global access.' },
  'homepage.feature6.title': { zh: '管理面板', en: 'Admin Panel' },
  'homepage.feature6.desc': { zh: '内置 SPA，支持创建、编辑和管理短链接。', en: 'Built-in SPA for creating, editing, and managing short links.' },
  'homepage.footer': { zh: '由 Cloudflare Workers 提供支持', en: 'Powered by Cloudflare Workers' },
  'errorpage.message': { zh: '链接不存在', en: 'Link not found' },
  'errorpage.hint': { zh: '请检查链接是否正确', en: 'Please check the URL and try again.' },
  'dashboard.settingsBtn': { zh: '设置', en: 'Settings' },
  'dashboard.pwdBtn': { zh: '修改密码', en: 'Change Password' },
  'dashboard.logoutBtn': { zh: '退出', en: 'Logout' },
  'dashboard.newBtn': { zh: '新建', en: 'New' },
  'links.loading': { zh: '加载中...', en: 'Loading...' },
  'links.mode.302': { zh: '302 跳转', en: '302 Redirect' },
  'links.mode.301': { zh: '301 跳转', en: '301 Redirect' },
  'links.mode.iframe': { zh: 'Iframe 嵌入', en: 'Iframe Embed' },
  'links.mode.html': { zh: 'HTML / JS / CSS / JSON', en: 'HTML / JS / CSS / JSON' },
  'links.mode.text': { zh: '纯文本', en: 'Plain Text' },
  'links.mode.302_long': { zh: '302 临时跳转', en: '302 Temporary Redirect' },
  'links.mode.301_long': { zh: '301 永久跳转', en: '301 Permanent Redirect' },
  'links.mode.iframe_long': { zh: 'Iframe 嵌入（隐藏转发）', en: 'Iframe Embed (stealth)' },
  'links.mode.html_long': { zh: '返回 HTML / JS / CSS / JSON', en: 'Return HTML / JS / CSS / JSON' },
  'links.mode.text_long': { zh: '返回纯文本', en: 'Return Plain Text' },
  'modal.deleteTitle': { zh: '确认删除', en: 'Confirm Delete' },
  'modal.deleteDesc': { zh: '确定要删除短链接 /{slug} 吗？此操作不可恢复。', en: 'Delete /{slug}? This cannot be undone.' },
  'modal.linkSlug': { zh: '短链 Slug', en: 'Slug' },
  'modal.slugAuto': { zh: '留空自动生成', en: 'Auto-generate if empty' },
  'modal.targetUrl': { zh: '目标 URL', en: 'Target URL' },
  'modal.responseMode': { zh: '响应模式', en: 'Response Mode' },
  'modal.pageTitle': { zh: '页面标题', en: 'Page Title' },
  'modal.injectJs': { zh: '注入 JS 代码', en: 'Inject JS' },
  'modal.content': { zh: '返回内容', en: 'Content' },
  'modal.basicAuth': { zh: 'BasicAuth 保护（可选）', en: 'BasicAuth Protection (optional)' },
  'modal.username': { zh: '用户名', en: 'Username' },
  'modal.password': { zh: '密码', en: 'Password' },
  'pwd.submitBtn': { zh: '修改', en: 'Change' },
  'settings.envTitle': { zh: '环境变量配置', en: 'Environment Variables' },
  'settings.envAdminPath': { zh: '后台管理路径（默认 /admin），通过 Cloudflare Dashboard 设置', en: 'Admin panel path (default /admin). Set via Cloudflare Dashboard.' },
  'settings.envJwtAdmin': { zh: '管理员 JWT 签名密钥，通过 Cloudflare Dashboard 以 Secret 类型设置', en: 'Admin JWT signing secret. Set as Secret in Cloudflare Dashboard.' },
  'settings.envKvFsApiKey': { zh: 'KV_FS_API_KEY，通过 Cloudflare Dashboard 以 Secret 类型设置', en: 'KV_FS_API_KEY. Set as Secret in Cloudflare Dashboard.' },
  'settings.turnstilePlaceholder': { zh: '留空则不启用验证码', en: 'Leave empty to disable' },
  'settings.cancelBtn': { zh: '取消', en: 'Cancel' },
  'settings.saveBtn': { zh: '保存', en: 'Save' },
  'error.unknown': { zh: '未知错误', en: 'Unknown error' },
  'error.operationFailed': { zh: '操作失败', en: 'Operation failed' },
  'error.network': { zh: '网络错误', en: 'Network error' },
  'error.deleteFailed': { zh: '删除失败', en: 'Delete failed' },
  'error.passwordChangeFailed': { zh: '修改失败', en: 'Password change failed' },
  'error.saveFailed': { zh: '保存失败', en: 'Save failed' },
} as const;

export type MessageKey = keyof typeof messages;

export function t(locale: Locale, key: MessageKey, params?: Record<string, string | number>): string {
  const msg = messages[key]?.[locale] || key;
  if (!params) return msg;
  return msg.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
}

export function detectLocale(acceptLanguage?: string | null, cookie?: string | null): Locale {
  if (cookie === 'zh' || cookie === 'en') return cookie;
  if (acceptLanguage?.startsWith('zh')) return 'zh';
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
