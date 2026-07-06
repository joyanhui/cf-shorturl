import { Outlet, NavLink } from 'react-router-dom';
import { type Locale, type MessageKey, t } from './i18n';
import { Button } from '@/frontend/components/ui/button';
import { LogOut } from 'lucide-react';

interface Props {
  adminPath: string;
  locale: Locale;
  onToggleLang: () => void;
  onLogout: () => void;
}

function activeLinkCls(isActive: boolean): string {
  return 'px-3 sm:px-5 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors no-underline ' +
    (isActive ? 'text-foreground border-primary' : 'text-muted-foreground hover:text-foreground border-transparent');
}

export function Dashboard({ adminPath, locale, onToggleLang, onLogout }: Props) {
  const L = (key: MessageKey) => t(locale, key);

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-background border-b border-border px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-1">
        <h1 className="text-base sm:text-lg font-bold truncate">CF ShortURL</h1>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={onLogout} title={L('logout')}>
            <LogOut className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">{L('logout')}</span>
          </Button>
          <button onClick={onToggleLang} className="text-xs text-muted-foreground hover:text-foreground underline decoration-dotted cursor-pointer border-0 bg-transparent whitespace-nowrap px-1">
            {locale === 'zh' ? 'EN' : '中文'}
          </button>
        </div>
      </div>
      <div className="max-w-[1200px] mx-auto px-3 sm:px-6 py-3 sm:py-5">
        <nav className="flex mb-4 sm:mb-5 border-b border-border">
          <NavLink to="" end className={({ isActive }) => activeLinkCls(isActive)}>
            {L('nav.links')}
          </NavLink>
          <NavLink to="settings" className={({ isActive }) => activeLinkCls(isActive)}>
            {L('nav.settings')}
          </NavLink>
        </nav>
        <Outlet />
      </div>
    </div>
  );
}