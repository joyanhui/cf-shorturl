import { useState, useEffect, useCallback } from 'react';
import { type Locale, t } from './i18n';

interface ShortLink {
  slug: string;
  url: string;
  mode: string;
  title?: string;
  inject_js?: string;
  content?: string;
  content_type?: string;
  basic_auth_username?: string;
  basic_auth_password?: string;
  created_at: string;
  updated_at: string;
}

interface ListResult {
  links: ShortLink[];
  total: number;
  offset: number;
  limit: number;
}

const PAGE_SIZE = 20;

const MODE_LABELS: Record<string, string> = {
  redirect_302: '302 跳转', redirect_301: '301 跳转',
  iframe: 'Iframe 嵌入', text: '纯文本', html: 'HTML',
};

const MODE_FIELDS: Record<string, string> = { iframe: 'iframe', html: 'content', text: 'content' };

export function Dashboard({ adminPath, locale, onLogout, onToggleLang }: { adminPath: string; locale: Locale; onLogout: () => void; onToggleLang: () => void }) {
  const L = (key: string, p?: Record<string, string | number>) => t(locale, key, p);

  const [links, setLinks] = useState<ShortLink[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal states
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editSlug, setEditSlug] = useState('');
  const [showDelete, setShowDelete] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  // Form fields
  const [formSlug, setFormSlug] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formMode, setFormMode] = useState('redirect_302');
  const [formTitle, setFormTitle] = useState('');
  const [formJs, setFormJs] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formContentType, setFormContentType] = useState('');
  const [formAuthUser, setFormAuthUser] = useState('');
  const [formAuthPass, setFormAuthPass] = useState('');

  // Settings form
  const [turnstileSiteKey, setTurnstileSiteKey] = useState('');
  const [turnstileSecretKey, setTurnstileSecretKey] = useState('');

  // Password form
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  const loadLinks = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('offset', String(page * PAGE_SIZE));
    params.set('limit', String(PAGE_SIZE));
    if (search) params.set('search', search);
    if (modeFilter) params.set('mode', modeFilter);
    try {
      const res = await fetch(adminPath + '/api/links?' + params.toString());
      if (!res.ok) return;
      const data: ListResult = await res.json();
      setLinks(data.links);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [page, search, modeFilter]);

  useEffect(() => { loadLinks(); }, [loadLinks]);

  const openCreate = useCallback(() => {
    setEditing(false);
    setFormSlug(''); setFormUrl(''); setFormMode('redirect_302');
    setFormTitle(''); setFormJs(''); setFormContent(''); setFormContentType('');
    setFormAuthUser(''); setFormAuthPass('');
    setShowLinkModal(true);
  }, []);

  const openEdit = useCallback(async (slug: string) => {
    const res = await fetch(adminPath + '/api/links?slug=' + encodeURIComponent(slug));
    if (!res.ok) return;
    const link: ShortLink = await res.json();
    setEditing(true); setEditSlug(slug);
    setFormSlug(link.slug); setFormUrl(link.url); setFormMode(link.mode);
    setFormTitle(link.title || ''); setFormJs(link.inject_js || '');
    setFormContent(link.content || ''); setFormContentType(link.content_type || '');
    setFormAuthUser(link.basic_auth_username || ''); setFormAuthPass(link.basic_auth_password || '');
    setShowLinkModal(true);
  }, []);

  const handleLinkSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const data: Record<string, any> = {
      url: formUrl, mode: formMode,
      title: formTitle || undefined, inject_js: formJs || undefined,
      content: formContent || undefined, content_type: formContentType || undefined,
      basic_auth_username: formAuthUser || undefined, basic_auth_password: formAuthPass || undefined,
    };
    if (!editing) {
      data.slug = formSlug || undefined;
    } else {
      data.slug = editSlug;
    }
    try {
      const res = await fetch(adminPath + '/api/links', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        alert('错误: ' + (err.error || '操作失败'));
        return;
      }
      setShowLinkModal(false);
      loadLinks();
    } catch (err: any) {
      alert('网络错误: ' + err.message);
    }
  }, [formSlug, formUrl, formMode, formTitle, formJs, formContent, formContentType, formAuthUser, formAuthPass, editing, editSlug, loadLinks]);

  const handleDelete = useCallback(async () => {
    if (!showDelete) return;
    try {
      const res = await fetch(adminPath + '/api/links?slug=' + encodeURIComponent(showDelete), { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        alert('删除失败: ' + (err.error || '未知错误'));
        return;
      }
      setShowDelete(null);
      loadLinks();
    } catch (err: any) {
      alert('网络错误: ' + err.message);
    }
  }, [showDelete, loadLinks]);

  const handleChangePassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) { alert(L('pwd.mismatch')); return; }
    const res = await fetch(adminPath + '/api/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPassword: oldPwd, newPassword: newPwd }),
    });
    const data = await res.json();
    if (res.ok) { alert(L('pwd.success')); setShowPwd(false); setOldPwd(''); setNewPwd(''); setConfirmPwd(''); }
    else { alert(data.error || '修改失败'); }
  }, [oldPwd, newPwd, confirmPwd, locale]);

  const handleSaveSettings = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(adminPath + '/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        turnstile_site_key: turnstileSiteKey || undefined,
        turnstile_secret_key: turnstileSecretKey || undefined,
      }),
    });
    if (res.ok) { alert(L('settings.saved')); setShowSettings(false); }
    else { alert('保存失败'); }
  }, [turnstileSiteKey, turnstileSecretKey, locale]);

  const openSettings = useCallback(async () => {
    const res = await fetch(adminPath + '/api/settings');
    const s = await res.json();
    setTurnstileSiteKey(s.turnstile_site_key || '');
    setTurnstileSecretKey(s.turnstile_secret_key || '');
    setShowSettings(true);
  }, []);

  const genSlug = useCallback(() => {
    const c = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let s = '';
    for (let i = 0; i < 6; i++) s += c[Math.floor(Math.random() * c.length)];
    setFormSlug(s);
  }, []);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const showContentFields = MODE_FIELDS[formMode] === 'content';
  const showIframeFields = MODE_FIELDS[formMode] === 'iframe';

  return (
    <>
      <div className="header">
        <div className="header-left">
          <h1>🔗 CF ShortURL</h1>
          <span className="subtitle">短链接管理</span>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={openSettings}>设置</button>
          <button className="btn btn-outline" onClick={() => { setOldPwd(''); setNewPwd(''); setConfirmPwd(''); setShowPwd(true); }}>修改密码</button>
          <button className="btn btn-outline btn-outline-danger" onClick={() => setShowLogout(true)}>退出</button>
          <button className="btn btn-primary" onClick={openCreate}>+ 新建</button>
          <button
            type="button"
            onClick={onToggleLang}
            className="text-xs text-gray-400 hover:text-gray-600 underline decoration-dotted cursor-pointer border-0 bg-transparent"
          >
            {locale === 'zh' ? 'English' : '中文'}
          </button>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-row">
          <input type="text" className="input search-input" placeholder="搜索 slug 或目标 URL..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
          <select className="input filter-select" value={modeFilter} onChange={e => { setModeFilter(e.target.value); setPage(0); }}>
            <option value="">全部模式</option>
            <option value="redirect_302">302 跳转</option>
            <option value="redirect_301">301 跳转</option>
            <option value="iframe">Iframe 嵌入</option>
            <option value="html">HTML / JS / CSS / JSON</option>
            <option value="text">纯文本</option>
          </select>
        </div>
      </div>

      <div className="table-wrap">
        <table className="links-table">
          <thead>
            <tr>
              <th>短链接</th>
              <th>目标 URL</th>
              <th className="col-mode">模式</th>
              <th className="col-auth">认证</th>
              <th className="col-date">创建</th>
              <th className="col-actions">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="empty-row">加载中...</td></tr>
            ) : links.length === 0 ? (
              <tr><td colSpan={6} className="empty-row">暂无短链接</td></tr>
            ) : links.map(link => (
              <tr key={link.slug}>
                <td><a href={'/' + link.slug} target="_blank" className="slug-link">/{link.slug}</a></td>
                <td className="url-cell" title={link.url}>{link.url}</td>
                <td className="col-mode"><span className={'badge badge-' + link.mode}>{MODE_LABELS[link.mode] || link.mode}</span></td>
                <td className="col-auth">
                  {link.basic_auth_username && link.basic_auth_password
                    ? <span className="badge badge-auth-on">🔒</span>
                    : <span className="badge badge-auth-off">—</span>}
                </td>
                <td className="col-date">{new Date(link.created_at).toLocaleDateString('zh-CN')}</td>
                <td className="col-actions">
                  <button className="btn btn-xs btn-outline" onClick={() => openEdit(link.slug)}>编辑</button>
                  <button className="btn btn-xs btn-outline-danger" onClick={() => setShowDelete(link.slug)}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <span className="page-info">{L('links.total', { n: total })} · {L('links.page', { p: page + 1, t: totalPages })}</span>
          <div className="page-btns">
            <button className="btn btn-xs btn-outline" disabled={page <= 0} onClick={() => setPage(p => p - 1)}>{L('links.prev')}</button>
            <button className="btn btn-xs btn-outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>{L('links.next')}</button>
          </div>
        </div>
      )}

      {/* Link Create/Edit Modal */}
      {showLinkModal && (
        <div className="modal-overlay" onClick={() => setShowLinkModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? '编辑短链接' : '新建短链接'}</h2>
              <button className="modal-close" onClick={() => setShowLinkModal(false)}>✕</button>
            </div>
            <form id="linkForm" onSubmit={handleLinkSubmit}>
              <div className="form-group">
                <label>短链 Slug</label>
                <div className="input-row">
                  <input type="text" className="input" placeholder="留空自动生成" value={formSlug} onChange={e => setFormSlug(e.target.value)} />
                  <button type="button" className="btn btn-outline" onClick={genSlug}>🎲</button>
                </div>
              </div>
              <div className="form-group">
                <label>目标 URL <span className="required">*</span></label>
                <input type="url" className="input" required placeholder="https://example.com" value={formUrl} onChange={e => setFormUrl(e.target.value)} />
              </div>
              <div className="form-group">
                <label>响应模式</label>
                <select className="input" value={formMode} onChange={e => setFormMode(e.target.value)}>
                  <option value="redirect_302">302 临时跳转</option>
                  <option value="redirect_301">301 永久跳转</option>
                  <option value="iframe">Iframe 嵌入（隐藏转发）</option>
                  <option value="html">返回 HTML / JS / CSS / JSON</option>
                  <option value="text">返回纯文本</option>
                </select>
              </div>
              {showIframeFields && (
                <div className="mode-fields">
                  <div className="form-group">
                    <label>页面标题</label>
                    <input type="text" className="input" placeholder="Short URL" value={formTitle} onChange={e => setFormTitle(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>注入 JS 代码</label>
                    <textarea className="textarea" rows={4} placeholder="可选的 JavaScript 代码" value={formJs} onChange={e => setFormJs(e.target.value)}></textarea>
                  </div>
                </div>
              )}
              {showContentFields && (
                <div className="mode-fields">
                  <div className="form-group">
                    <label>返回内容</label>
                    <textarea className="textarea textarea-code" rows={8} placeholder="HTML / JS / CSS / JSON / 纯文本" value={formContent} onChange={e => setFormContent(e.target.value)}></textarea>
                  </div>
                  <div className="form-group">
                    <label>Content-Type</label>
                    <input type="text" className="input" placeholder={formMode === 'html' ? 'text/html（默认）' : 'text/plain（默认）'} value={formContentType} onChange={e => setFormContentType(e.target.value)} />
                  </div>
                </div>
              )}
              <details className="auth-section">
                <summary className="auth-summary">🔒 BasicAuth 保护（可选）</summary>
                <div className="auth-fields">
                  <div className="form-group">
                    <label>用户名</label>
                    <input type="text" className="input" value={formAuthUser} onChange={e => setFormAuthUser(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>密码</label>
                    <input type="text" className="input" value={formAuthPass} onChange={e => setFormAuthPass(e.target.value)} />
                  </div>
                </div>
              </details>
              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowLinkModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">{editing ? '保存' : '创建'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDelete && (
        <div className="modal-overlay" onClick={() => setShowDelete(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>确认删除</h2>
              <button className="modal-close" onClick={() => setShowDelete(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p>确定要删除短链接 <strong>/{showDelete}</strong> 吗？</p>
              <p className="hint">此操作不可恢复。</p>
            </div>
            <div className="form-actions" style={{ padding: '0 24px 20px' }}>
              <button className="btn btn-outline" onClick={() => setShowDelete(null)}>取消</button>
              <button className="btn btn-primary btn-danger-bg" onClick={handleDelete}>删除</button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPwd && (
        <div className="modal-overlay" onClick={() => setShowPwd(false)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>修改密码</h2>
              <button className="modal-close" onClick={() => setShowPwd(false)}>✕</button>
            </div>
            <form id="pwdForm" onSubmit={handleChangePassword}>
              <div className="form-group">
                <label>原密码</label>
                <input type="password" className="input" autoComplete="current-password" value={oldPwd} onChange={e => setOldPwd(e.target.value)} />
              </div>
              <div className="form-group">
                <label>新密码</label>
                <input type="password" className="input" autoComplete="new-password" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
              </div>
              <div className="form-group">
                <label>确认新密码</label>
                <input type="password" className="input" autoComplete="new-password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowPwd(false)}>取消</button>
                <button type="submit" className="btn btn-primary">修改</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>系统设置</h2>
              <button className="modal-close" onClick={() => setShowSettings(false)}>✕</button>
            </div>
            <form id="settingsForm" onSubmit={handleSaveSettings}>
              <div className="form-group">
                <label>Turnstile Site Key</label>
                <input type="text" className="input" placeholder="留空则不启用验证码" value={turnstileSiteKey} onChange={e => setTurnstileSiteKey(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Turnstile Secret Key</label>
                <input type="password" className="input" placeholder="留空则不启用验证码" value={turnstileSecretKey} onChange={e => setTurnstileSecretKey(e.target.value)} />
                <span className="hint">配置后登录页将显示 Cloudflare Turnstile 验证码</span>
              </div>
              <div className="form-group">
                <label style={{ fontSize: '13px', fontWeight: 600, marginTop: '8px' }}>📋 环境变量配置</label>
                <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.8' }}>
                  <p><code style={{ background: '#f3f4f6', padding: '1px 6px', borderRadius: '3px', fontSize: '12px' }}>ADMIN_PATH</code><br />后台管理路径（默认 /admin），通过 Cloudflare Dashboard 设置</p>
                  <p><code style={{ background: '#f3f4f6', padding: '1px 6px', borderRadius: '3px', fontSize: '12px' }}>JWT_ADMIN_SECRET</code><br />管理员 JWT 签名密钥，通过 Cloudflare Dashboard 以 Secret 类型设置</p>
                  <p><code style={{ background: '#f3f4f6', padding: '1px 6px', borderRadius: '3px', fontSize: '12px' }}>KV_FS_API_KEY</code><br />kv-filesystem 的 API Key，通过 Cloudflare Dashboard 以 Secret 类型设置</p>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowSettings(false)}>取消</button>
                <button type="submit" className="btn btn-primary">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Logout Modal */}
      {showLogout && (
        <div className="modal-overlay" onClick={() => setShowLogout(false)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>退出登录</h2>
              <button className="modal-close" onClick={() => setShowLogout(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p>确定退出登录吗？</p>
            </div>
            <div className="form-actions" style={{ padding: '0 24px 20px' }}>
              <button className="btn btn-outline" onClick={() => setShowLogout(false)}>取消</button>
              <button className="btn btn-primary btn-danger-bg" onClick={onLogout}>退出</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
