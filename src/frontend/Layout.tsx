import { tailwindCSS } from './tailwind.gen';
import { LANG_SCRIPT, type Locale } from './i18n';

interface ScriptDef {
  content: string;
}

interface LayoutProps {
  title: string;
  children: React.ReactNode;
  scripts?: ScriptDef[];
  lang?: Locale;
}

export function Layout({ title, children, scripts, lang = 'zh' }: LayoutProps) {
  const href = '?lang=' + (lang === 'zh' ? 'en' : 'zh');
  const label = lang === 'zh' ? 'English' : '中文';
  return (
    <html lang={lang}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <style dangerouslySetInnerHTML={{ __html: tailwindCSS }} />
        <script dangerouslySetInnerHTML={{ __html: LANG_SCRIPT }} />
      </head>
      <body>
        {children}
        <a href={href}
           className="fixed bottom-4 right-4 z-50 text-xs text-gray-400 bg-white/80 border border-gray-200 rounded-lg px-3 py-1.5 no-underline hover:bg-white hover:text-gray-600 transition-colors">
          {label}
        </a>
        {scripts?.map((s, i) => (
          <script key={i} dangerouslySetInnerHTML={{ __html: s.content }} />
        ))}
      </body>
    </html>
  );
}
