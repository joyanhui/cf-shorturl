import { useState, useEffect, useCallback } from 'react';
import { type Locale, type MessageKey, t } from './i18n';
import { Button } from '@/frontend/components/ui/button';
import { Input } from '@/frontend/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/frontend/components/ui/dialog';
import { Eye, EyeOff } from 'lucide-react';

export function SettingsPage({ adminPath, locale }: { adminPath: string; locale: Locale }) {
  const L = (key: MessageKey, p?: Record<string, string | number>) => t(locale, key, p);

  const [turnstileSiteKey, setTurnstileSiteKey] = useState('');
  const [turnstileSecretKey, setTurnstileSecretKey] = useState('');
  const [showSettingsSecret, setShowSettingsSecret] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(adminPath + '/api/settings');
      const s: { turnstile_site_key?: string; turnstile_secret_key?: string } = await res.json();
      setTurnstileSiteKey(s.turnstile_site_key || '');
      setTurnstileSecretKey(s.turnstile_secret_key || '');
    } catch {}
    setLoading(false);
  }, [adminPath]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

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
    if (res.ok) {
      alert(L('settings.saved'));
    } else {
      const data: { error?: string } = await res.json();
      alert(data.error || L('error.saveFailed'));
    }
  }, [turnstileSiteKey, turnstileSecretKey, adminPath, locale]);

  if (loading) {
    return <div className="text-center py-10 text-muted-foreground text-sm">{L('links.loading')}</div>;
  }

  return (
    <div>
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-sm font-bold">{L('settings.title')}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSaveSettings}>
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
            <div className="sticky bottom-0 bg-background border-t border-border p-3 -mx-5 -mb-5 mt-4 rounded-b-lg flex justify-end gap-2">
              <Button type="submit">{L('settings.saveBtn')}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-sm font-bold">{L('pwd.title')}</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">{L('pwd.envIntro')}</p>
          <Button variant="outline" size="sm" onClick={() => setShowPwd(true)}>{L('dashboard.pwdBtn')}</Button>
        </CardContent>
      </Card>

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
    </div>
  );
}