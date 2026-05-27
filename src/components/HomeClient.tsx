'use client';

import { useState, useRef } from 'react';
import AnalysisResult from './AnalysisResult';

type Lang = 'hu' | 'en';

const texts = {
  hu: {
    navTitle: 'Analyst AI',
    navSubtitle: 'Weboldal Elemző',
    heroTitle: 'AI-Alapú Weboldal Elemzés',
    heroSubtitle: 'Add meg a weboldalad URL-jét és leírását — az AI elvégzi a teljes szakmai elemzést másodpercek alatt.',
    badge: 'SEO · Üzleti · Tartalom · Verseny',
    urlLabel: 'Weboldal URL',
    urlPlaceholder: 'https://pelda.hu',
    descLabel: 'Weboldal leírása',
    descPlaceholder: 'Írd le mit csinál a weboldal, milyen szolgáltatásokat nyújt, kik a célügyfelek...',
    submit: 'Elemzés Indítása',
    submitting: 'Elemzés folyamatban...',
    resultTitle: 'Elemzési Eredmény',
    newAnalysis: 'Új Elemzés',
    errorTitle: 'Hiba',
    footerText: '© 2025 Analyst AI. Minden jog fenntartva.',
    tip1: 'Tipp: Adj meg minél részletesebb leírást a pontosabb eredményért.',
    features: ['SEO elemzés', 'Üzleti SWOT', 'Tartalom értékelés', 'Verseny tanácsok'],
  },
  en: {
    navTitle: 'Analyst AI',
    navSubtitle: 'Website Analyzer',
    heroTitle: 'AI-Powered Website Analysis',
    heroSubtitle: 'Enter your website URL and description — our AI performs a complete professional analysis in seconds.',
    badge: 'SEO · Business · Content · Competition',
    urlLabel: 'Website URL',
    urlPlaceholder: 'https://example.com',
    descLabel: 'Website description',
    descPlaceholder: 'Describe what the website does, what services it offers, who the target customers are...',
    submit: 'Start Analysis',
    submitting: 'Analyzing...',
    resultTitle: 'Analysis Result',
    newAnalysis: 'New Analysis',
    errorTitle: 'Error',
    footerText: '© 2025 Analyst AI. All rights reserved.',
    tip1: 'Tip: Provide a detailed description for more accurate results.',
    features: ['SEO analysis', 'Business SWOT', 'Content rating', 'Competitor insights'],
  },
};

export default function HomeClient() {
  const [lang, setLang] = useState<Lang>('hu');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | Record<string, unknown>>(null);
  const [error, setError] = useState('');
  const resultRef = useRef<HTMLDivElement>(null);

  const t = texts[lang];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ismeretlen hiba');
      setResult(data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ismeretlen hiba');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setError('');
    setUrl('');
    setDescription('');
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>
      {/* Navbar */}
      <nav className="glass sticky top-0 z-50 px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold shadow-lg"
            style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}>
            AI
          </div>
          <div>
            <div className="text-white font-bold text-base leading-tight">{t.navTitle}</div>
            <div className="text-purple-300 text-xs leading-tight">{t.navSubtitle}</div>
          </div>
        </div>

        {/* Language switcher */}
        <div className="flex items-center gap-1 bg-white/10 rounded-xl p-1">
          {(['hu', 'en'] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                lang === l
                  ? 'bg-white text-purple-900 shadow-sm'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              {l === 'hu' ? '🇭🇺 HU' : '🇬🇧 EN'}
            </button>
          ))}
        </div>
      </nav>

      {/* Hero */}
      <section className="px-4 sm:px-8 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 text-purple-200 text-xs font-semibold px-4 py-2 rounded-full mb-6 border border-white/20">
          ✨ {t.badge}
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-4 leading-tight max-w-2xl mx-auto">
          {t.heroTitle}
        </h1>
        <p className="text-purple-200 text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-8">
          {t.heroSubtitle}
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {t.features.map((f, i) => (
            <span key={i} className="bg-white/10 text-white text-sm px-4 py-1.5 rounded-full border border-white/20 backdrop-blur">
              {f}
            </span>
          ))}
        </div>
      </section>

      {/* Main content */}
      <main className="flex-1 px-4 sm:px-8 pb-16 max-w-3xl mx-auto w-full">
        {!result ? (
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 animate-fade-in-up">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* URL input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🌐 {t.urlLabel}
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={t.urlPlaceholder}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📝 {t.descLabel}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t.descPlaceholder}
                  required
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none text-sm"
                />
              </div>

              <p className="text-xs text-gray-400">{t.tip1}</p>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-red-700 text-sm font-semibold">{t.errorTitle}</p>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl font-bold text-white text-base transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                style={{ background: loading ? '#9ca3af' : 'linear-gradient(135deg, #a855f7, #6366f1)' }}
              >
                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t.submitting}
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    {t.submit}
                  </>
                )}
              </button>
            </form>

            {/* Loading steps */}
            {loading && (
              <div className="mt-6 space-y-2 animate-fade-in">
                {[
                  lang === 'hu' ? '🌐 Weboldal betöltése...' : '🌐 Loading website...',
                  lang === 'hu' ? '🔍 Tartalom elemzése...' : '🔍 Analyzing content...',
                  lang === 'hu' ? '🤖 AI feldolgozás...' : '🤖 AI processing...',
                  lang === 'hu' ? '📊 Jelentés készítése...' : '📊 Generating report...',
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="w-4 h-4 border border-purple-400 border-t-transparent rounded-full animate-spin" style={{ animationDelay: `${i * 0.2}s` }} />
                    {step}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div ref={resultRef}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white text-2xl font-bold">{t.resultTitle}</h2>
              <button
                onClick={reset}
                className="bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-4 py-2 rounded-xl border border-white/20 transition-all"
              >
                ← {t.newAnalysis}
              </button>
            </div>
            <AnalysisResult data={result as unknown as Parameters<typeof AnalysisResult>[0]['data']} lang={lang} url={url} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-purple-300 text-sm border-t border-white/10">
        {t.footerText}
      </footer>
    </div>
  );
}
