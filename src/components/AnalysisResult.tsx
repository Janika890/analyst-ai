'use client';

interface Section {
  score: number;
  positives_hu: string[];
  positives_en: string[];
  issues_hu: string[];
  issues_en: string[];
  suggestions_hu: string[];
  suggestions_en: string[];
}

interface AnalysisData {
  overall_score: number;
  site_title: string;
  summary_hu: string;
  summary_en: string;
  seo: Section;
  technical: Section & { response_time: number };
  content: Section & { word_count: number; internal_links: number; external_links: number; images: number };
}

interface Props {
  data: AnalysisData;
  lang: 'hu' | 'en';
  url: string;
}

function ScoreCircle({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
  const sizes = { sm: 64, md: 80, lg: 120 };
  const px = sizes[size];
  const r = px / 2 - 8;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: px, height: px }}>
      <svg width={px} height={px} className="-rotate-90">
        <circle cx={px / 2} cy={px / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="6" />
        <circle cx={px / 2} cy={px / 2} r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease-out' }} />
      </svg>
      <span className="absolute font-bold" style={{ color, fontSize: size === 'lg' ? 28 : size === 'md' ? 18 : 14 }}>
        {score}
      </span>
    </div>
  );
}

function ScoreBadge({ score, lang }: { score: number; lang: 'hu' | 'en' }) {
  if (score >= 75) return <span className="text-green-600 font-semibold text-xs bg-green-50 px-2 py-0.5 rounded-full">{lang === 'hu' ? 'Kiváló' : 'Excellent'}</span>;
  if (score >= 50) return <span className="text-yellow-600 font-semibold text-xs bg-yellow-50 px-2 py-0.5 rounded-full">{lang === 'hu' ? 'Fejleszthető' : 'Improvable'}</span>;
  return <span className="text-red-600 font-semibold text-xs bg-red-50 px-2 py-0.5 rounded-full">{lang === 'hu' ? 'Gyenge' : 'Weak'}</span>;
}

function List({ items, icon }: { items: string[]; icon: string }) {
  if (!items.length) return null;
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
          <span className="mt-0.5 shrink-0 text-base">{icon}</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SectionCard({ title, emoji, score, lang, section }: {
  title: string; emoji: string; score: number; lang: 'hu' | 'en';
  section: Section;
}) {
  const pos = lang === 'hu' ? section.positives_hu : section.positives_en;
  const iss = lang === 'hu' ? section.issues_hu : section.issues_en;
  const sug = lang === 'hu' ? section.suggestions_hu : section.suggestions_en;
  const t = (hu: string, en: string) => lang === 'hu' ? hu : en;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 card-hover">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{emoji}</span>
            <h3 className="text-base font-bold text-gray-900">{title}</h3>
          </div>
          <ScoreBadge score={score} lang={lang} />
        </div>
        <ScoreCircle score={score} size="sm" />
      </div>

      <div className="space-y-4">
        {pos.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">
              {t('Pozitívumok', 'Positives')}
            </p>
            <List items={pos} icon="✅" />
          </div>
        )}
        {iss.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2">
              {t('Problémák', 'Issues')}
            </p>
            <List items={iss} icon="⚠️" />
          </div>
        )}
        {sug.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-2">
              {t('Javaslatok', 'Suggestions')}
            </p>
            <List items={sug} icon="💡" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function AnalysisResult({ data, lang, url }: Props) {
  const t = (hu: string, en: string) => lang === 'hu' ? hu : en;

  const stats = [
    { label: t('Szavak', 'Words'), value: data.content.word_count },
    { label: t('Belső link', 'Internal links'), value: data.content.internal_links },
    { label: t('Külső link', 'External links'), value: data.content.external_links },
    { label: t('Képek', 'Images'), value: data.content.images },
    { label: t('Válaszidő', 'Response time'), value: `${data.technical.response_time}ms` },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Overall */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <ScoreCircle score={data.overall_score} size="lg" />
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-bold text-gray-900 mb-0.5">
              {data.site_title}
            </h2>
            <p className="text-gray-400 text-xs mb-3 break-all">{url}</p>
            <p className="text-gray-700 text-sm leading-relaxed">
              {lang === 'hu' ? data.summary_hu : data.summary_en}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-6 grid grid-cols-3 sm:grid-cols-5 gap-3">
          {stats.map((s, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionCard title="SEO" emoji="🔍" score={data.seo.score} lang={lang} section={data.seo} />
        <SectionCard
          title={t('Technikai', 'Technical')}
          emoji="⚙️"
          score={data.technical.score}
          lang={lang}
          section={data.technical}
        />
      </div>

      <SectionCard
        title={t('Tartalom & Elérhetőség', 'Content & Accessibility')}
        emoji="📝"
        score={data.content.score}
        lang={lang}
        section={data.content}
      />
    </div>
  );
}
