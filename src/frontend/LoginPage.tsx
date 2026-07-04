import { useRef, useState, useCallback } from 'react';
import { type Locale, t, detectLocale, persistLocale, toggleLang } from './i18n';

interface LoginPageProps {
  adminPath: string;
  locale: Locale;
  onLogin: () => void;
  turnstileSiteKey?: string;
  onToggleLang: () => void;
  defaultPath?: boolean;
}

export function LoginPage({ adminPath, locale, onLogin, turnstileSiteKey, onToggleLang, defaultPath }: LoginPageProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const password = (new FormData(e.currentTarget).get('password') as string) || '';
    try {
      const body: Record<string, string> = { password };
      if (turnstileSiteKey && typeof (window as any).turnstile !== 'undefined') {
        body.cfTurnstileResponse = (window as any).turnstile.getResponse();
      }
      const res = await fetch(adminPath + '/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        onLogin();
      } else {
        const data = await res.json();
        setError(data.error || t(locale, 'login.error.invalid'));
        if (turnstileSiteKey && typeof (window as any).turnstile !== 'undefined') {
          (window as any).turnstile.reset();
        }
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [adminPath, locale, onLogin, turnstileSiteKey]);

  return (
    <div className="login-wrapper">
      <div className="login-card">
        {defaultPath && (
          <div style={{ marginBottom: '16px', padding: '12px', fontSize: '13px', color: '#9a6700', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '6px' }}>
            <strong>⚠ {t(locale, 'login.defaultPathWarning.title')}</strong><br />
            {t(locale, 'login.defaultPathWarning.body')}
          </div>
        )}
        <h1>🔗 CF ShortURL</h1>
        <p className="login-desc">{t(locale, 'login.title')}</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="password">{t(locale, 'login.password')}</label>
            <input
              ref={inputRef}
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              autoFocus
              className="input"
              placeholder={t(locale, 'login.placeholder')}
            />
          </div>
          {turnstileSiteKey && (
            <div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-theme="light"></div>
          )}
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? '...' : t(locale, 'login.signIn')}
          </button>
          <div className="text-center mt-3">
            <button
              type="button"
              onClick={onToggleLang}
              className="text-xs text-gray-400 hover:text-gray-600 underline decoration-dotted cursor-pointer border-0 bg-transparent"
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
  );
}
