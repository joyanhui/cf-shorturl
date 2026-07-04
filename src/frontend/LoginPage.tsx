import { useRef, useState, useCallback } from 'react';
import { type Locale, t, detectLocale } from './i18n';

interface LoginPageProps {
  onLogin: () => void;
  turnstileSiteKey?: string;
}

export function LoginPage({ onLogin, turnstileSiteKey }: LoginPageProps) {
  const [locale] = useState<Locale>(detectLocale);
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const form = new FormData(e.currentTarget);
    const username = (form.get('username') as string) || '';
    const password = (form.get('password') as string) || '';
    try {
      const body: Record<string, string> = { username, password };
      if (turnstileSiteKey && typeof (window as any).turnstile !== 'undefined') {
        body.cfTurnstileResponse = (window as any).turnstile.getResponse();
      }
      const res = await fetch('/api/login', {
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
  }, [locale, onLogin, turnstileSiteKey]);

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h1>🔗 CF ShortURL</h1>
        <p className="login-desc">{t(locale, 'login.title')}</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">{t(locale, 'login.username')}</label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              autoFocus
              className="input"
              placeholder={t(locale, 'login.usernamePlaceholder')}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">{t(locale, 'login.password')}</label>
            <input
              ref={inputRef}
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
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
        </form>
      </div>
      {turnstileSiteKey && (
        <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
      )}
    </div>
  );
}
