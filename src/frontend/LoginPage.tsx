import { useRef, useState, useCallback } from 'react';
import { type Locale, t } from './i18n';
import { Button } from '@/frontend/components/ui/button';
import { Input } from '@/frontend/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';

interface LoginPageProps {
  adminPath: string;
  locale: Locale;
  onLogin: () => void;
  turnstileSiteKey?: string;
  onToggleLang: () => void;
  defaultPath?: boolean;
}

declare const turnstile: { getResponse(): string; reset(): void };

export function LoginPage({ adminPath, locale, onLogin, turnstileSiteKey, onToggleLang, defaultPath }: LoginPageProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const password = (new FormData(e.currentTarget).get('password') as string) || '';
    try {
      const body: Record<string, string> = { password };
      if (turnstileSiteKey && typeof turnstile !== 'undefined') {
        body.cfTurnstileResponse = turnstile.getResponse();
      }
      const res = await fetch(adminPath + '/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        onLogin();
      } else {
        const data: { error?: string } = await res.json();
        setError(data.error || t(locale, 'login.error.invalid'));
        if (turnstileSiteKey && typeof turnstile !== 'undefined') {
          turnstile.reset();
        }
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [adminPath, locale, onLogin, turnstileSiteKey]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {defaultPath && (
          <div className="mb-4 p-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg">
            <strong>⚠ {t(locale, 'login.defaultPathWarning.title')}</strong><br />
            {t(locale, 'login.defaultPathWarning.body')}
          </div>
        )}
        <div className="rounded-xl border bg-card p-8 shadow-sm">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-foreground">🔗 CF ShortURL</h1>
            <p className="text-sm text-muted-foreground mt-1">{t(locale, 'login.title')}</p>
          </div>
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 p-3 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg">{error}</div>
            )}
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium mb-1.5">{t(locale, 'login.password')}</label>
              <div className="relative">
                <Input
                  ref={inputRef}
                  id="password"
                  name="password"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  autoFocus
                  placeholder={t(locale, 'login.placeholder')}
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer border-0 bg-transparent p-0">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {turnstileSiteKey && (
              <div className="cf-turnstile mb-4" data-sitekey={turnstileSiteKey} data-theme="light"></div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '...' : t(locale, 'login.signIn')}
            </Button>
            <div className="text-center mt-3">
              <button
                type="button"
                onClick={onToggleLang}
                className="text-xs text-muted-foreground hover:text-foreground underline decoration-dotted cursor-pointer border-0 bg-transparent"
              >
                {locale === 'zh' ? 'English' : '中文'}
              </button>
            </div>
          </form>
        </div>
        {turnstileSiteKey && (
          <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
        )}
      </div>
    </div>
  );
}
