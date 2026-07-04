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
  return (
    <html lang={lang}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
        <style dangerouslySetInnerHTML={{ __html: tailwindCSS }} />
        <script dangerouslySetInnerHTML={{ __html: LANG_SCRIPT }} />
      </head>
      <body>
        {children}
        {scripts?.map((s, i) => (
          <script key={i} dangerouslySetInnerHTML={{ __html: s.content }} />
        ))}
      </body>
    </html>
  );
}
