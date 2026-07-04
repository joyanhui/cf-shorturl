interface ScriptDef {
  content: string;
}

interface LayoutProps {
  title: string;
  children: React.ReactNode;
  scripts?: ScriptDef[];
}

export function Layout({ title, children, scripts }: LayoutProps) {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔗</text></svg>" />
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
