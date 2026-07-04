import { useState, useEffect } from 'react';
import { LoginPage } from './LoginPage';
import { Dashboard } from './Dashboard';

export function App() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState('');

  useEffect(() => {
    fetch('/api/links?limit=1')
      .then(r => setAuthed(r.ok))
      .catch(() => setAuthed(false));
  }, []);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(s => setTurnstileSiteKey(s.turnstile_site_key || ''))
      .catch(() => {});
  }, []);

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
    return <LoginPage onLogin={() => setAuthed(true)} turnstileSiteKey={turnstileSiteKey} />;
  }

  return <Dashboard onLogout={handleLogout} />;
}
