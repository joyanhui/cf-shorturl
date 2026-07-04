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
  const langToggleScript = `var b=document.createElement('button');b.textContent='${lang === 'zh' ? 'English' : '中文'}';b.onclick=function(){var n=document.documentElement.lang;var l=n==='zh'?'en':'zh';localStorage.setItem('locale',l);document.cookie='locale='+l+';Path=/;SameSite=Lax';location.reload()};b.style.cssText='position:fixed;bottom:1rem;right:1rem;z-index:50;font-size:0.75rem;color:#9ca3af;background:rgba(255,255,255,0.8);border:1px solid #e5e7eb;border-radius:0.5rem;padding:0.375rem 0.75rem;cursor:pointer';document.body.appendChild(b)`;
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
        <script dangerouslySetInnerHTML={{ __html: langToggleScript }} />
        {scripts?.map((s, i) => (
          <script key={i} dangerouslySetInnerHTML={{ __html: s.content }} />
        ))}
      </body>
    </html>
  );
}
