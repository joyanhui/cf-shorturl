import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { type Locale } from './i18n';
import { LoginPage } from './LoginPage';
import { Dashboard } from './Dashboard';

function getAdminPath(): string {
  return (window as unknown as Record<string,string>).ADMIN_PATH ?? '/admin';
}

function persistLocaleCookie(l: Locale) {
  document.cookie = 'locale=' + l + ';Path=/;SameSite=Lax';
}

export function App() {
  const adminPath = getAdminPath();
  const [locale, setLocale] = useState<Locale>(() => {
    const s = localStorage.getItem('locale');
    if (s === 'zh' || s === 'en') return s;
    return navigator.language?.startsWith('zh') ? 'zh' : 'en';
  });
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState('');

  useEffect(() => {
    localStorage.setItem('locale', locale);
    persistLocaleCookie(locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const toggleLang = useCallback(() => {
    setLocale(prev => {
      const next = prev === 'zh' ? 'en' : 'zh';
      localStorage.setItem('locale', next);
      persistLocaleCookie(next);
      return next;
    });
  }, []);

  useEffect(() => {
    fetch(adminPath + '/api/check')
      .then(r => r.json() as Promise<{ authed: boolean }>)
      .then(d => { setAuthed(d.authed); if (d.authed) fetchSettings(); })
      .catch(() => setAuthed(false));
    fetchSettings();
  }, []);

  function fetchSettings() {
    fetch(adminPath + '/api/settings')
      .then(r => r.json() as Promise<{ turnstile_site_key?: string }>)
      .then(s => setTurnstileSiteKey(s.turnstile_site_key || ''))
      .catch(() => {});
  }

  const clearAdminCookie = useCallback(() => {
    document.cookie = 'admin_token=; Path=' + adminPath + '; SameSite=Lax; Max-Age=0';
  }, [adminPath]);

  const handleLogout = async () => {
    try {
      await fetch(adminPath + '/api/login', { method: 'DELETE' });
    } catch {}
    clearAdminCookie();
    setAuthed(false);
  };

  if (authed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">加载中...</div>
      </div>
    );
  }

  return (
    <BrowserRouter basename={adminPath}>
      <Routes>
        <Route path="/login" element={
          !authed
            ? <LoginPage adminPath={adminPath} locale={locale} onLogin={() => setAuthed(true)} turnstileSiteKey={turnstileSiteKey} onToggleLang={toggleLang} defaultPath={adminPath === '/admin'} />
            : <Navigate to="/" replace />
        } />
        <Route path="/*" element={
          authed
            ? <Dashboard adminPath={adminPath} locale={locale} onLogout={handleLogout} onToggleLang={toggleLang} />
            : <Navigate to="/login" replace />
        } />
      </Routes>
    </BrowserRouter>
  );
}
