import { useState, useEffect, useCallback } from 'react';
import { type Locale, detectLocale, persistLocale } from './i18n';
import { LoginPage } from './LoginPage';
import { Dashboard } from './Dashboard';

export function App() {
  const [locale, setLocale] = useState<Locale>(detectLocale);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState('');

  const toggleLang = useCallback(() => {
    setLocale(prev => {
      const next = prev === 'zh' ? 'en' : 'zh';
      persistLocale(next);
      return next;
    });
  }, []);

  useEffect(() => {
    fetch('/api/check')
      .then(r => r.json())
      .then(d => { setAuthed(d.authed); if (d.authed) fetchSettings(); })
      .catch(() => setAuthed(false));
    fetchSettings();
  }, []);

  function fetchSettings() {
    fetch('/api/settings')
      .then(r => r.json())
      .then(s => setTurnstileSiteKey(s.turnstile_site_key || ''))
      .catch(() => {});
  }

  const handleLogout = async () => {
    await fetch('/api/login', { method: 'DELETE' });
    setAuthed(false);
  };

  if (authed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">加载中...</div>
      </div>
    );
  }

  if (!authed) {
    return <LoginPage locale={locale} onLogin={() => setAuthed(true)} turnstileSiteKey={turnstileSiteKey} onToggleLang={toggleLang} />;
  }

  return <Dashboard locale={locale} onLogout={handleLogout} onToggleLang={toggleLang} />;
}
