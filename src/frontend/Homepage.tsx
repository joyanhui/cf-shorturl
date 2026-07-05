import { Layout } from './Layout';
import { t, type Locale } from './i18n';

interface HomepageProps {
  locale: Locale;
}

export function Homepage({ locale }: HomepageProps) {
  return (
    <Layout title="CF ShortURL" lang={locale} footerText={t(locale, 'homepage.footer')}>
      <div className="h-full bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold mb-6">
            {t(locale, 'homepage.badge')}
          </div>
          <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
            {t(locale, 'homepage.title')}
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8 leading-relaxed">
            {t(locale, 'homepage.subtitle')}
          </p>
          <div className="flex gap-3 justify-center flex-wrap mb-16">
            <a href="https://github.com/joyanhui/cf-shorturl" target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-white text-gray-700 rounded-lg text-sm font-semibold border border-gray-200 hover:border-gray-300 hover:bg-gray-50 no-underline transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              GitHub
            </a>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: '↗', title: t(locale, 'homepage.feature1.title'), desc: t(locale, 'homepage.feature1.desc') },
              { icon: '🔄', title: t(locale, 'homepage.feature2.title'), desc: t(locale, 'homepage.feature2.desc') },
              { icon: '📄', title: t(locale, 'homepage.feature3.title'), desc: t(locale, 'homepage.feature3.desc') },
              { icon: '🔒', title: t(locale, 'homepage.feature4.title'), desc: t(locale, 'homepage.feature4.desc') },
              { icon: '⚡', title: t(locale, 'homepage.feature5.title'), desc: t(locale, 'homepage.feature5.desc') },
              { icon: '📊', title: t(locale, 'homepage.feature6.title'), desc: t(locale, 'homepage.feature6.desc') },
            ].map((f, i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-shadow">
                <div className="text-xl mb-2">{f.icon}</div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
