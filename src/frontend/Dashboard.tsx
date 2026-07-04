import { useState, useEffect, useCallback } from 'react';
import { type Locale, t } from './i18n';
import { Button } from '@/frontend/components/ui/button';
import { Input } from '@/frontend/components/ui/input';
import { Textarea } from '@/frontend/components/ui/textarea';
import { Badge } from '@/frontend/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/frontend/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/frontend/components/ui/dialog';
import { Search, Plus, Settings, Key, LogOut, Edit3, Trash2, Dice6, ExternalLink } from 'lucide-react';

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

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editSlug, setEditSlug] = useState('');
  const [showDelete, setShowDelete] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  const [formSlug, setFormSlug] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formMode, setFormMode] = useState('redirect_302');
  const [formTitle, setFormTitle] = useState('');
  const [formJs, setFormJs] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formContentType, setFormContentType] = useState('');
  const [formAuthUser, setFormAuthUser] = useState('');
  const [formAuthPass, setFormAuthPass] = useState('');

  const [turnstileSiteKey, setTurnstileSiteKey] = useState('');
  const [turnstileSecretKey, setTurnstileSecretKey] = useState('');

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
    const body: Record<string, string | undefined> = {
      url: formUrl, mode: formMode,
      title: formTitle || undefined, inject_js: formJs || undefined,
      content: formContent || undefined, content_type: formContentType || undefined,
      basic_auth_username: formAuthUser || undefined, basic_auth_password: formAuthPass || undefined,
    };
    if (!editing) {
      body.slug = formSlug || undefined;
    } else {
      body.slug = editSlug;
    }
    try {
      const res = await fetch(adminPath + '/api/links', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err: { error?: string } = await res.json();
        alert('错误: ' + (err.error || '操作失败'));
        return;
      }
      setShowLinkModal(false);
      loadLinks();
    } catch (err: unknown) {
      alert('网络错误: ' + (err instanceof Error ? err.message : '未知错误'));
    }
  }, [formSlug, formUrl, formMode, formTitle, formJs, formContent, formContentType, formAuthUser, formAuthPass, editing, editSlug, loadLinks]);

  const handleDelete = useCallback(async () => {
    if (!showDelete) return;
    try {
      const res = await fetch(adminPath + '/api/links?slug=' + encodeURIComponent(showDelete), { method: 'DELETE' });
      if (!res.ok) {
        const err: { error?: string } = await res.json();
        alert('删除失败: ' + (err.error || '未知错误'));
        return;
      }
      setShowDelete(null);
      loadLinks();
    } catch (err: unknown) {
      alert('网络错误: ' + (err instanceof Error ? err.message : '未知错误'));
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
    const data: { error?: string } = await res.json();
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
    else { const data: { error?: string } = await res.json(); alert(data.error || '保存失败'); }
  }, [turnstileSiteKey, turnstileSecretKey, locale]);

  const openSettings = useCallback(async () => {
    const res = await fetch(adminPath + '/api/settings');
    const s: { turnstile_site_key?: string; turnstile_secret_key?: string } = await res.json();
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

  const selectClass = 'h-10 px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring';

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-background border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold">CF ShortURL</h1>
          <span className="text-sm text-muted-foreground hidden sm:inline">短链接管理</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={openSettings}><Settings className="h-4 w-4 mr-1" />设置</Button>
          <Button variant="outline" size="sm" onClick={() => { setOldPwd(''); setNewPwd(''); setConfirmPwd(''); setShowPwd(true); }}><Key className="h-4 w-4 mr-1" />修改密码</Button>
          <Button variant="outline" size="sm" onClick={() => setShowLogout(true)}><LogOut className="h-4 w-4 mr-1" />退出</Button>
          <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" />新建</Button>
          <button onClick={onToggleLang} className="text-xs text-muted-foreground hover:text-foreground underline decoration-dotted cursor-pointer border-0 bg-transparent">
            {locale === 'zh' ? 'English' : '中文'}
          </button>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-5">
        <div className="flex gap-3 mb-4">
          <Input placeholder="搜索 slug 或目标 URL..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="flex-1" />
          <select className={selectClass} value={modeFilter} onChange={e => { setModeFilter(e.target.value); setPage(0); }}>
            <option value="">全部模式</option>
            <option value="redirect_302">302 跳转</option>
            <option value="redirect_301">301 跳转</option>
            <option value="iframe">Iframe 嵌入</option>
            <option value="html">HTML / JS / CSS / JSON</option>
            <option value="text">纯文本</option>
          </select>
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>短链接</TableHead>
                <TableHead>目标 URL</TableHead>
                <TableHead>模式</TableHead>
                <TableHead>认证</TableHead>
                <TableHead>创建</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">加载中...</TableCell></TableRow>
              ) : links.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">暂无短链接</TableCell></TableRow>
              ) : links.map(link => (
                <TableRow key={link.slug}>
                  <TableCell>
                    <a href={'/' + link.slug} target="_blank" className="text-primary hover:underline font-mono text-sm flex items-center gap-1">
                      /{link.slug} <ExternalLink className="h-3 w-3" />
                    </a>
                  </TableCell>
                  <TableCell className="max-w-[300px] overflow-hidden text-ellipsis whitespace-nowrap" title={link.url}>{link.url}</TableCell>
                  <TableCell><Badge variant="outline">{MODE_LABELS[link.mode] || link.mode}</Badge></TableCell>
                  <TableCell>
                    {link.basic_auth_username && link.basic_auth_password
                      ? <Badge variant="default">🔒</Badge>
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{new Date(link.created_at).toLocaleDateString('zh-CN')}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => openEdit(link.slug)}><Edit3 className="h-3 w-3 mr-1" />编辑</Button>{' '}
                    <Button variant="destructive" size="sm" onClick={() => setShowDelete(link.slug)}><Trash2 className="h-3 w-3 mr-1" />删除</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-muted-foreground">{L('links.total', { n: total })} · {L('links.page', { p: page + 1, t: totalPages })}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 0} onClick={() => setPage(p => p - 1)}>{L('links.prev')}</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>{L('links.next')}</Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={showLinkModal} onOpenChange={(o: boolean) => { if (!o) setShowLinkModal(false); }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? '编辑短链接' : '新建短链接'}</DialogTitle>
          </DialogHeader>
          <form id="linkForm" onSubmit={handleLinkSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">短链 Slug</label>
                <div className="flex gap-2">
                  <Input placeholder="留空自动生成" value={formSlug} onChange={e => setFormSlug(e.target.value)} />
                  <Button type="button" variant="outline" onClick={genSlug}><Dice6 className="h-4 w-4" /></Button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">目标 URL <span className="text-destructive">*</span></label>
                <Input type="url" required placeholder="https://example.com" value={formUrl} onChange={e => setFormUrl(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">响应模式</label>
                <select className={selectClass + ' w-full'} value={formMode} onChange={e => setFormMode(e.target.value)}>
                  <option value="redirect_302">302 临时跳转</option>
                  <option value="redirect_301">301 永久跳转</option>
                  <option value="iframe">Iframe 嵌入（隐藏转发）</option>
                  <option value="html">返回 HTML / JS / CSS / JSON</option>
                  <option value="text">返回纯文本</option>
                </select>
              </div>
              {showIframeFields && (
                <div className="space-y-4 border-l-2 border-border pl-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">页面标题</label>
                    <Input placeholder="Short URL" value={formTitle} onChange={e => setFormTitle(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">注入 JS 代码</label>
                    <Textarea rows={4} placeholder="可选的 JavaScript 代码" value={formJs} onChange={e => setFormJs(e.target.value)} />
                  </div>
                </div>
              )}
              {showContentFields && (
                <div className="space-y-4 border-l-2 border-border pl-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">返回内容</label>
                    <Textarea rows={8} placeholder="HTML / JS / CSS / JSON / 纯文本" value={formContent} onChange={e => setFormContent(e.target.value)} className="font-mono text-xs" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Content-Type</label>
                    <Input placeholder={formMode === 'html' ? 'text/html（默认）' : 'text/plain（默认）'} value={formContentType} onChange={e => setFormContentType(e.target.value)} />
                  </div>
                </div>
              )}
              <details className="border border-border rounded-lg p-3">
                <summary className="text-sm font-medium cursor-pointer text-muted-foreground hover:text-foreground">🔒 BasicAuth 保护（可选）</summary>
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">用户名</label>
                    <Input value={formAuthUser} onChange={e => setFormAuthUser(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">密码</label>
                    <Input value={formAuthPass} onChange={e => setFormAuthPass(e.target.value)} />
                  </div>
                </div>
              </details>
            </div>
            <DialogFooter className="mt-6">
              <Button variant="outline" type="button" onClick={() => setShowLinkModal(false)}>取消</Button>
              <Button type="submit">{editing ? '保存' : '创建'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showDelete} onOpenChange={(o: boolean) => { if (!o) setShowDelete(null); }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>确定要删除短链接 <strong>/{showDelete}</strong> 吗？此操作不可恢复。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(null)}>取消</Button>
            <Button variant="destructive" onClick={handleDelete}>删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPwd} onOpenChange={(o: boolean) => { if (!o) setShowPwd(false); }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>修改密码</DialogTitle>
          </DialogHeader>
          <form id="pwdForm" onSubmit={handleChangePassword}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">原密码</label>
                <Input type="password" autoComplete="current-password" value={oldPwd} onChange={e => setOldPwd(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">新密码</label>
                <Input type="password" autoComplete="new-password" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">确认新密码</label>
                <Input type="password" autoComplete="new-password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button variant="outline" type="button" onClick={() => setShowPwd(false)}>取消</Button>
              <Button type="submit">修改</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showSettings} onOpenChange={(o: boolean) => { if (!o) setShowSettings(false); }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>系统设置</DialogTitle>
          </DialogHeader>
          <form id="settingsForm" onSubmit={handleSaveSettings}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Turnstile Site Key</label>
                <Input placeholder="留空则不启用验证码" value={turnstileSiteKey} onChange={e => setTurnstileSiteKey(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Turnstile Secret Key</label>
                <Input type="password" placeholder="留空则不启用验证码" value={turnstileSecretKey} onChange={e => setTurnstileSecretKey(e.target.value)} />
                <p className="text-xs text-muted-foreground mt-1">配置后登录页将显示 Cloudflare Turnstile 验证码</p>
              </div>
              <div className="border-t border-border pt-4">
                <h4 className="text-sm font-semibold mb-2">📋 环境变量配置</h4>
                <div className="text-xs text-muted-foreground space-y-1.5">
                  <p><code className="px-1 py-0.5 rounded bg-muted">ADMIN_PATH</code><br />后台管理路径（默认 /admin），通过 Cloudflare Dashboard 设置</p>
                  <p><code className="px-1 py-0.5 rounded bg-muted">JWT_ADMIN_SECRET</code><br />管理员 JWT 签名密钥，通过 Cloudflare Dashboard 以 Secret 类型设置</p>
                  <p><code className="px-1 py-0.5 rounded bg-muted">KV_FS_API_KEY</code><br />kv-filesystem 的 API Key，通过 Cloudflare Dashboard 以 Secret 类型设置</p>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button variant="outline" type="button" onClick={() => setShowSettings(false)}>取消</Button>
              <Button type="submit">保存</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showLogout} onOpenChange={(o: boolean) => { if (!o) setShowLogout(false); }}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <DialogTitle>退出登录</DialogTitle>
            <DialogDescription>确定退出登录吗？</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogout(false)}>取消</Button>
            <Button variant="destructive" onClick={onLogout}>退出</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
