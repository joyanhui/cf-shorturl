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
  footerText?: string;
}

export function Layout({ title, children, scripts, lang = 'zh', footerText }: LayoutProps) {
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
      <body className="min-h-screen flex flex-col">
        <main className="flex-1">{children}</main>
        <div className="border-t border-gray-100 py-6 text-center text-xs text-gray-400 space-y-2">
          {footerText && <p>{footerText}</p>}
          <a href={href} className="text-gray-400 hover:text-gray-600 no-underline">{label}</a>
        </div>
        {scripts?.map((s, i) => (
          <script key={i} dangerouslySetInnerHTML={{ __html: s.content }} />
        ))}
      </body>
    </html>
  );
}
