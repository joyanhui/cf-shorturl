import { Layout } from './Layout';
import { t, type Locale } from './i18n';

interface ErrorPageProps {
  status?: number;
  message?: string;
  locale?: Locale;
}

export function ErrorPage({ status = 404, message, locale = 'zh' }: ErrorPageProps) {
  const msg = message || t(locale, 'errorpage.message');
  return (
    <Layout title={String(status)} lang={locale} footerText={t(locale, 'homepage.footer')}>
      <div className="bg-gray-50 pt-32 pb-20 text-center">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">{status}</h1>
        <p className="text-gray-500 text-lg mb-2">{msg}</p>
        <p className="text-gray-400 text-sm">{t(locale, 'errorpage.hint')}</p>
      </div>
    </Layout>
  );
}
