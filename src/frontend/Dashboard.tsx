import { useState, useEffect, useCallback } from 'react';
import { type Locale, type MessageKey, t } from './i18n';
import { Button } from '@/frontend/components/ui/button';
import { Input } from '@/frontend/components/ui/input';
import { Textarea } from '@/frontend/components/ui/textarea';
import { Badge } from '@/frontend/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/frontend/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/frontend/components/ui/dialog';
import { Search, Plus, Settings, Key, LogOut, Edit3, Trash2, Dice6, ExternalLink, Eye, EyeOff, Pin, PinOff } from 'lucide-react';

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
  sort_order?: number;
  remark?: string;
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
  const [formRemark, setFormRemark] = useState('');

  const [turnstileSiteKey, setTurnstileSiteKey] = useState('');
  const [turnstileSecretKey, setTurnstileSecretKey] = useState('');

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

  const handleTogglePin = useCallback(async (slug: string) => {
    const res = await fetch(adminPath + '/api/links/' + encodeURIComponent(slug) + '/toggle-pin', { method: 'POST' });
    if (!res.ok) return;
    loadLinks();
  }, [adminPath, loadLinks]);

  const openCreate = useCallback(() => {
    setEditing(false);
    setFormSlug(''); setFormUrl(''); setFormMode('redirect_302');
    setFormTitle(''); setFormJs(''); setFormContent(''); setFormContentType('');
    setFormAuthUser(''); setFormAuthPass(''); setFormRemark('');
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
    setFormRemark(link.remark || '');
    setShowLinkModal(true);
  }, []);

  const handleLinkSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const body: Record<string, string | undefined> = {
      url: formUrl, mode: formMode,
      title: formTitle || undefined, inject_js: formJs || undefined,
      content: formContent || undefined, content_type: formContentType || undefined,
      basic_auth_username: formAuthUser || undefined, basic_auth_password: formAuthPass || undefined,
      remark: formRemark || undefined,
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
  }, [formSlug, formUrl, formMode, formTitle, formJs, formContent, formContentType, formAuthUser, formAuthPass, formRemark, editing, editSlug, loadLinks]);

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
      <div className="sticky top-0 z-50 bg-background border-b border-border px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
          <h1 className="text-base sm:text-lg font-bold truncate">CF ShortURL</h1>
          <span className="text-xs sm:text-sm text-muted-foreground hidden sm:inline">{L('nav.dashboard')}</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={() => setShowPwd(true)} title={L('dashboard.pwdBtn')}>
            <Key className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">{L('dashboard.pwdBtn')}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={openSettings} title={L('dashboard.settingsBtn')}>
            <Settings className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">{L('dashboard.settingsBtn')}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowLogout(true)} title={L('dashboard.logoutBtn')}>
            <LogOut className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">{L('dashboard.logoutBtn')}</span>
          </Button>
          <Button size="sm" onClick={openCreate} title={L('dashboard.newBtn')}>
            <Plus className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">{L('dashboard.newBtn')}</span>
          </Button>
          <button onClick={onToggleLang} className="text-xs text-muted-foreground hover:text-foreground underline decoration-dotted cursor-pointer border-0 bg-transparent whitespace-nowrap px-1">
            {locale === 'zh' ? 'EN' : '中文'}
          </button>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-3 sm:px-6 py-3 sm:py-5">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
          <Input placeholder={L('links.search')} value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="flex-1 w-full" />
          <select className={selectClass + ' w-full sm:w-auto'} value={modeFilter} onChange={e => { setModeFilter(e.target.value); setPage(0); }}>
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
                  <TableHead className="hidden md:table-cell">{L('links.thUrl')}</TableHead>
                  <TableHead className="hidden sm:table-cell">{L('links.thRemark')}</TableHead>
                  <TableHead className="hidden sm:table-cell">{L('links.thMode')}</TableHead>
                  <TableHead className="hidden lg:table-cell">{L('links.thAuth')}</TableHead>
                  <TableHead className="hidden lg:table-cell">{L('links.thCreated')}</TableHead>
                  <TableHead>{L('links.thActions')}</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">{L('links.loading')}</TableCell></TableRow>
              ) : links.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">{L('links.empty')}</TableCell></TableRow>
              ) : links.map(link => (
                <TableRow key={link.slug}>
                  <TableCell className="max-w-[120px] sm:max-w-none">
                    <a href={'/' + link.slug} target="_blank" className="text-primary hover:underline font-mono text-xs sm:text-sm flex items-center gap-1 truncate">
                      /{link.slug} <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    </a>
                  </TableCell>
                  <TableCell className="hidden md:table-cell max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap" title={link.url}>{link.url}</TableCell>
                  <TableCell className="hidden sm:table-cell max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap" title={link.remark || ''}>{link.remark || <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="hidden sm:table-cell"><Badge variant="outline" className="text-xs">{modeLabel(link.mode)}</Badge></TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {link.basic_auth_username && link.basic_auth_password
                      ? <Badge variant="default" className="text-xs">🔒</Badge>
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground text-xs sm:text-sm">{new Date(link.created_at).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US')}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Button variant={link.sort_order ? 'default' : 'outline'} size="icon" className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3" onClick={() => handleTogglePin(link.slug)} title={link.sort_order ? L('links.unpin') : L('links.pin')}>
                      {link.sort_order ? <PinOff className="h-3.5 w-3.5 sm:h-3 sm:w-3" /> : <Pin className="h-3.5 w-3.5 sm:h-3 sm:w-3" />}
                      <span className="hidden sm:inline sm:ml-1">{link.sort_order ? L('links.unpin') : L('links.pin')}</span>
                    </Button>{' '}
                    <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3" onClick={() => openEdit(link.slug)} title={L('links.edit')}>
                      <Edit3 className="h-3.5 w-3.5 sm:h-3 sm:w-3 sm:mr-1" /><span className="hidden sm:inline">{L('links.edit')}</span>
                    </Button>{' '}
                    <Button variant="destructive" size="icon" className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3" onClick={() => setShowDelete(link.slug)} title={L('links.delete')}>
                      <Trash2 className="h-3.5 w-3.5 sm:h-3 sm:w-3 sm:mr-1" /><span className="hidden sm:inline">{L('links.delete')}</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-2">
            <span className="text-xs sm:text-sm text-muted-foreground">{L('links.total', { n: total })} · {L('links.page', { p: page + 1, t: totalPages })}</span>
            <div className="flex gap-2 w-full sm:w-auto justify-center">
              <Button variant="outline" size="sm" disabled={page <= 0} onClick={() => setPage(p => p - 1)} className="flex-1 sm:flex-none">{L('links.prev')}</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="flex-1 sm:flex-none">{L('links.next')}</Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={showLinkModal} onOpenChange={(o: boolean) => { if (!o) setShowLinkModal(false); }}>
        <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[85dvh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">{editing ? L('modal.edit') : L('modal.create')}</DialogTitle>
          </DialogHeader>
          <form id="linkForm" onSubmit={handleLinkSubmit}>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{L('modal.linkSlug')}</label>
                <div className="flex gap-2">
                  <Input placeholder={L('modal.slugAuto')} value={formSlug} onChange={e => setFormSlug(e.target.value)} className="flex-1 min-w-0" />
                  <Button type="button" variant="outline" size="icon" onClick={genSlug} title={L('links.random')}><Dice6 className="h-4 w-4" /></Button>
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
                <div className="space-y-3 sm:space-y-4 border-l-2 border-border pl-3 sm:pl-4">
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
                <div className="space-y-3 sm:space-y-4 border-l-2 border-border pl-3 sm:pl-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">{L('modal.content')}</label>
                    <Textarea rows={5} placeholder="HTML / JS / CSS / JSON / Plain Text" value={formContent} onChange={e => setFormContent(e.target.value)} className="font-mono text-xs min-h-[80px]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Content-Type</label>
                    <Input placeholder={formMode === 'html' ? 'text/html' : 'text/plain'} value={formContentType} onChange={e => setFormContentType(e.target.value)} />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">{L('modal.remark')}</label>
                <Input placeholder={L('modal.remarkPlaceholder')} value={formRemark} onChange={e => setFormRemark(e.target.value)} />
              </div>
              <details className="border border-border rounded-lg p-2 sm:p-3">
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
            <DialogFooter className="mt-4 sm:mt-6 flex-col sm:flex-row gap-2">
              <Button variant="outline" type="button" onClick={() => setShowLinkModal(false)} className="w-full sm:w-auto order-2 sm:order-1">{L('modal.cancel')}</Button>
              <Button type="submit" className="w-full sm:w-auto order-1 sm:order-2">{editing ? L('modal.save') : L('modal.createBtn')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showDelete} onOpenChange={(o: boolean) => { if (!o) setShowDelete(null); }}>
        <DialogContent className="max-w-[90vw] sm:max-w-[400px] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">{L('modal.deleteTitle')}</DialogTitle>
            <DialogDescription className="text-sm">{L('modal.deleteDesc', { slug: showDelete || '' })}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowDelete(null)} className="w-full sm:w-auto">{L('modal.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete} className="w-full sm:w-auto">{L('modal.deleteBtn')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSettings} onOpenChange={(o: boolean) => { if (!o) setShowSettings(false); }}>
        <DialogContent className="max-w-[95vw] sm:max-w-[500px] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">{L('settings.title')}</DialogTitle>
          </DialogHeader>
          <form id="settingsForm" onSubmit={handleSaveSettings}>
            <div className="space-y-3 sm:space-y-4">
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
              <div className="border-t border-border pt-3 sm:pt-4">
                <h4 className="text-sm font-semibold mb-2">{L('settings.envTitle')}</h4>
                <div className="text-xs text-muted-foreground space-y-1.5">
                  <p><code className="px-1 py-0.5 rounded bg-muted">ADMIN_PATH</code><br />{L('settings.envAdminPath')}</p>
                  <p><code className="px-1 py-0.5 rounded bg-muted">JWT_ADMIN_SECRET</code><br />{L('settings.envJwtAdmin')}</p>
                  <p><code className="px-1 py-0.5 rounded bg-muted">KV_FS_API_KEY</code><br />{L('settings.envKvFsApiKey')}</p>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-4 sm:mt-6 flex-col sm:flex-row gap-2">
              <Button variant="outline" type="button" onClick={() => setShowSettings(false)} className="w-full sm:w-auto">{L('settings.cancelBtn')}</Button>
              <Button type="submit" className="w-full sm:w-auto">{L('settings.saveBtn')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showPwd} onOpenChange={(o: boolean) => { if (!o) setShowPwd(false); }}>
        <DialogContent className="max-w-[90vw] sm:max-w-[480px] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">{L('pwd.title')}</DialogTitle>
            <DialogDescription>
              <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4 text-sm">
                <p>{L('pwd.envIntro')}</p>
                <ol className="list-decimal list-inside space-y-1.5 sm:space-y-2">
                  <li>{L('pwd.step1')}</li>
                  <li>{L('pwd.step2')}</li>
                  <li>{L('pwd.step3')}</li>
                  <li>{L('pwd.step4')}</li>
                </ol>
                <p className="text-xs text-muted-foreground border-t border-border pt-2 sm:pt-3">{L('pwd.note')}</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPwd(false)} className="w-full sm:w-auto">{L('modal.cancel')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLogout} onOpenChange={(o: boolean) => { if (!o) setShowLogout(false); }}>
        <DialogContent className="max-w-[90vw] sm:max-w-[350px] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">{L('logout')}</DialogTitle>
            <DialogDescription className="text-sm">{L('logout.confirm')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowLogout(false)} className="w-full sm:w-auto">{L('modal.cancel')}</Button>
            <Button variant="destructive" onClick={onLogout} className="w-full sm:w-auto">{L('logout.confirmBtn')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}