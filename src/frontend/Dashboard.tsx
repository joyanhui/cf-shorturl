import { useState, useEffect, useCallback } from 'react';
import { type Locale, type MessageKey, t } from './i18n';
import { Button } from '@/frontend/components/ui/button';
import { Input } from '@/frontend/components/ui/input';
import { Textarea } from '@/frontend/components/ui/textarea';
import { Badge } from '@/frontend/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/frontend/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/frontend/components/ui/dialog';
import { Search, Plus, Settings, Key, LogOut, Edit3, Trash2, Dice6, ExternalLink, Eye, EyeOff } from 'lucide-react';

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

const MODE_FIELDS: Record<string, string> = { iframe: 'iframe', html: 'content', text: 'content' };

export function Dashboard({ adminPath, locale, onLogout, onToggleLang }: { adminPath: string; locale: Locale; onLogout: () => void; onToggleLang: () => void }) {
  const L = (key: MessageKey, p?: Record<string, string | number>) => t(locale, key, p);

  const MODE_KEYS: Record<string, MessageKey> = {
    redirect_302: 'links.mode.302', redirect_301: 'links.mode.301',
    iframe: 'links.mode.iframe', html: 'links.mode.html', text: 'links.mode.text',
  };

  function modeLabel(mode: string): string {
    const k = MODE_KEYS[mode];
    return k ? L(k) : mode;
  }

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
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [showFormAuthPass, setShowFormAuthPass] = useState(false);
  const [showSettingsSecret, setShowSettingsSecret] = useState(false);

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
        alert(L('error.operationFailed') + ': ' + (err.error || L('error.unknown')));
        return;
      }
      setShowLinkModal(false);
      loadLinks();
    } catch (err: unknown) {
      alert(L('error.network') + ': ' + (err instanceof Error ? err.message : L('error.unknown')));
    }
  }, [formSlug, formUrl, formMode, formTitle, formJs, formContent, formContentType, formAuthUser, formAuthPass, editing, editSlug, loadLinks]);

  const handleDelete = useCallback(async () => {
    if (!showDelete) return;
    try {
      const res = await fetch(adminPath + '/api/links?slug=' + encodeURIComponent(showDelete), { method: 'DELETE' });
      if (!res.ok) {
        const err: { error?: string } = await res.json();
        alert(L('error.deleteFailed') + ': ' + (err.error || L('error.unknown')));
        return;
      }
      setShowDelete(null);
      loadLinks();
    } catch (err: unknown) {
      alert(L('error.network') + ': ' + (err instanceof Error ? err.message : L('error.unknown')));
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
    else { alert(data.error || L('error.passwordChangeFailed')); }
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
    else { const data: { error?: string } = await res.json(); alert(data.error || L('error.saveFailed')); }
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
          <span className="text-sm text-muted-foreground hidden sm:inline">{L('nav.dashboard')}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={openSettings}><Settings className="h-4 w-4 mr-1" />{L('dashboard.settingsBtn')}</Button>
          <Button variant="outline" size="sm" onClick={() => { setOldPwd(''); setNewPwd(''); setConfirmPwd(''); setShowPwd(true); }}><Key className="h-4 w-4 mr-1" />{L('dashboard.pwdBtn')}</Button>
          <Button variant="outline" size="sm" onClick={() => setShowLogout(true)}><LogOut className="h-4 w-4 mr-1" />{L('dashboard.logoutBtn')}</Button>
          <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" />{L('dashboard.newBtn')}</Button>
          <button onClick={onToggleLang} className="text-xs text-muted-foreground hover:text-foreground underline decoration-dotted cursor-pointer border-0 bg-transparent">
            {locale === 'zh' ? 'English' : '中文'}
          </button>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-5">
        <div className="flex gap-3 mb-4">
          <Input placeholder={L('links.search')} value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="flex-1" />
          <select className={selectClass} value={modeFilter} onChange={e => { setModeFilter(e.target.value); setPage(0); }}>
            <option value="">{L('links.allModes')}</option>
            <option value="redirect_302">{L('links.mode.302')}</option>
            <option value="redirect_301">{L('links.mode.301')}</option>
            <option value="iframe">{L('links.mode.iframe')}</option>
            <option value="html">{L('links.mode.html')}</option>
            <option value="text">{L('links.mode.text')}</option>
          </select>
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{L('links.thSlug')}</TableHead>
                <TableHead>{L('links.thUrl')}</TableHead>
                <TableHead>{L('links.thMode')}</TableHead>
                <TableHead>{L('links.thAuth')}</TableHead>
                <TableHead>{L('links.thCreated')}</TableHead>
                <TableHead>{L('links.thActions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">{L('links.loading')}</TableCell></TableRow>
              ) : links.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">{L('links.empty')}</TableCell></TableRow>
              ) : links.map(link => (
                <TableRow key={link.slug}>
                  <TableCell>
                    <a href={'/' + link.slug} target="_blank" className="text-primary hover:underline font-mono text-sm flex items-center gap-1">
                      /{link.slug} <ExternalLink className="h-3 w-3" />
                    </a>
                  </TableCell>
                  <TableCell className="max-w-[300px] overflow-hidden text-ellipsis whitespace-nowrap" title={link.url}>{link.url}</TableCell>
                  <TableCell><Badge variant="outline">{modeLabel(link.mode)}</Badge></TableCell>
                  <TableCell>
                    {link.basic_auth_username && link.basic_auth_password
                      ? <Badge variant="default">🔒</Badge>
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{new Date(link.created_at).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US')}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => openEdit(link.slug)}><Edit3 className="h-3 w-3 mr-1" />{L('links.edit')}</Button>{' '}
                    <Button variant="destructive" size="sm" onClick={() => setShowDelete(link.slug)}><Trash2 className="h-3 w-3 mr-1" />{L('links.delete')}</Button>
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
            <DialogTitle>{editing ? L('modal.edit') : L('modal.create')}</DialogTitle>
          </DialogHeader>
          <form id="linkForm" onSubmit={handleLinkSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{L('modal.linkSlug')}</label>
                <div className="flex gap-2">
                  <Input placeholder={L('modal.slugAuto')} value={formSlug} onChange={e => setFormSlug(e.target.value)} />
                  <Button type="button" variant="outline" onClick={genSlug}><Dice6 className="h-4 w-4" /></Button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{L('modal.targetUrl')} <span className="text-destructive">*</span></label>
                <Input type="url" required placeholder="https://example.com" value={formUrl} onChange={e => setFormUrl(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{L('modal.responseMode')}</label>
                <select className={selectClass + ' w-full'} value={formMode} onChange={e => setFormMode(e.target.value)}>
                  <option value="redirect_302">{L('links.mode.302_long')}</option>
                  <option value="redirect_301">{L('links.mode.301_long')}</option>
                  <option value="iframe">{L('links.mode.iframe_long')}</option>
                  <option value="html">{L('links.mode.html_long')}</option>
                  <option value="text">{L('links.mode.text_long')}</option>
                </select>
              </div>
              {showIframeFields && (
                <div className="space-y-4 border-l-2 border-border pl-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">{L('modal.pageTitle')}</label>
                    <Input placeholder="Short URL" value={formTitle} onChange={e => setFormTitle(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{L('modal.injectJs')}</label>
                    <Textarea rows={4} placeholder="JavaScript" value={formJs} onChange={e => setFormJs(e.target.value)} />
                  </div>
                </div>
              )}
              {showContentFields && (
                <div className="space-y-4 border-l-2 border-border pl-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">{L('modal.content')}</label>
                    <Textarea rows={8} placeholder="HTML / JS / CSS / JSON / Plain Text" value={formContent} onChange={e => setFormContent(e.target.value)} className="font-mono text-xs" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Content-Type</label>
                    <Input placeholder={formMode === 'html' ? 'text/html' : 'text/plain'} value={formContentType} onChange={e => setFormContentType(e.target.value)} />
                  </div>
                </div>
              )}
              <details className="border border-border rounded-lg p-3">
                <summary className="text-sm font-medium cursor-pointer text-muted-foreground hover:text-foreground">{L('modal.basicAuth')}</summary>
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">{L('modal.username')}</label>
                    <Input value={formAuthUser} onChange={e => setFormAuthUser(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{L('modal.password')}</label>
                    <div className="relative">
                      <Input type={showFormAuthPass ? 'text' : 'password'} value={formAuthPass} onChange={e => setFormAuthPass(e.target.value)} className="pr-10" />
                      <button type="button" onClick={() => setShowFormAuthPass(!showFormAuthPass)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer border-0 bg-transparent p-0">
                        {showFormAuthPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </details>
            </div>
            <DialogFooter className="mt-6">
              <Button variant="outline" type="button" onClick={() => setShowLinkModal(false)}>{L('modal.cancel')}</Button>
              <Button type="submit">{editing ? L('modal.save') : L('modal.createBtn')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showDelete} onOpenChange={(o: boolean) => { if (!o) setShowDelete(null); }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{L('modal.deleteTitle')}</DialogTitle>
            <DialogDescription>{L('modal.deleteDesc', { slug: showDelete || '' })}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(null)}>{L('modal.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete}>{L('modal.deleteBtn')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPwd} onOpenChange={(o: boolean) => { if (!o) setShowPwd(false); }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{L('pwd.title')}</DialogTitle>
          </DialogHeader>
          <form id="pwdForm" onSubmit={handleChangePassword}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{L('pwd.old')}</label>
                <div className="relative">
                  <Input type={showOldPwd ? 'text' : 'password'} autoComplete="current-password" value={oldPwd} onChange={e => setOldPwd(e.target.value)} className="pr-10" />
                  <button type="button" onClick={() => setShowOldPwd(!showOldPwd)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer border-0 bg-transparent p-0">
                    {showOldPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{L('pwd.new')}</label>
                <div className="relative">
                  <Input type={showNewPwd ? 'text' : 'password'} autoComplete="new-password" value={newPwd} onChange={e => setNewPwd(e.target.value)} className="pr-10" />
                  <button type="button" onClick={() => setShowNewPwd(!showNewPwd)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer border-0 bg-transparent p-0">
                    {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{L('pwd.confirm')}</label>
                <div className="relative">
                  <Input type={showConfirmPwd ? 'text' : 'password'} autoComplete="new-password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} className="pr-10" />
                  <button type="button" onClick={() => setShowConfirmPwd(!showConfirmPwd)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer border-0 bg-transparent p-0">
                    {showConfirmPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button variant="outline" type="button" onClick={() => setShowPwd(false)}>{L('modal.cancel')}</Button>
              <Button type="submit">{L('pwd.submitBtn')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showSettings} onOpenChange={(o: boolean) => { if (!o) setShowSettings(false); }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{L('settings.title')}</DialogTitle>
          </DialogHeader>
          <form id="settingsForm" onSubmit={handleSaveSettings}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{L('settings.siteKey')}</label>
                <Input placeholder={L('settings.turnstilePlaceholder')} value={turnstileSiteKey} onChange={e => setTurnstileSiteKey(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{L('settings.secretKey')}</label>
                <div className="relative">
                  <Input type={showSettingsSecret ? 'text' : 'password'} placeholder={L('settings.turnstilePlaceholder')} value={turnstileSecretKey} onChange={e => setTurnstileSecretKey(e.target.value)} className="pr-10" />
                  <button type="button" onClick={() => setShowSettingsSecret(!showSettingsSecret)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer border-0 bg-transparent p-0">
                    {showSettingsSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{L('settings.hint')}</p>
              </div>
              <div className="border-t border-border pt-4">
                <h4 className="text-sm font-semibold mb-2">{L('settings.envTitle')}</h4>
                <div className="text-xs text-muted-foreground space-y-1.5">
                  <p><code className="px-1 py-0.5 rounded bg-muted">ADMIN_PATH</code><br />{L('settings.envAdminPath')}</p>
                  <p><code className="px-1 py-0.5 rounded bg-muted">JWT_ADMIN_SECRET</code><br />{L('settings.envJwtAdmin')}</p>
                  <p><code className="px-1 py-0.5 rounded bg-muted">KV_FS_API_KEY</code><br />{L('settings.envKvFsApiKey')}</p>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button variant="outline" type="button" onClick={() => setShowSettings(false)}>{L('settings.cancelBtn')}</Button>
              <Button type="submit">{L('settings.saveBtn')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showLogout} onOpenChange={(o: boolean) => { if (!o) setShowLogout(false); }}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <DialogTitle>{L('logout')}</DialogTitle>
            <DialogDescription>{L('logout.confirm')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogout(false)}>{L('modal.cancel')}</Button>
            <Button variant="destructive" onClick={onLogout}>{L('logout.confirmBtn')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}