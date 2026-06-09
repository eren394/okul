import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Alternative, Criterion, DistributionType } from '../types';
import { simulateMonteCarlo, buildMonteCarloInsight } from '../utils/monteCarlo';

interface Props {
  criteria: Criterion[];
  alternatives: Alternative[];
  firstAlternativeId: string;
  secondAlternativeId: string;
  simulationCount: number;
  distributionType: DistributionType;
  onFirstAlternativeChange: (value: string) => void;
  onSecondAlternativeChange: (value: string) => void;
  onSimulationCountChange: (value: number) => void;
  onDistributionTypeChange: (value: DistributionType) => void;
}

const COUNT_OPTIONS = [100, 1000, 10000] as const;

const MonteCarloComparison: React.FC<Props> = ({
  criteria,
  alternatives,
  firstAlternativeId,
  secondAlternativeId,
  simulationCount,
  distributionType,
  onFirstAlternativeChange,
  onSecondAlternativeChange,
  onSimulationCountChange,
  onDistributionTypeChange,
}) => {
  const firstAlternative = alternatives.find((alt) => alt.id === firstAlternativeId) ?? alternatives[0];
  const secondAlternative = alternatives.find((alt) => alt.id === secondAlternativeId) ?? alternatives[1] ?? alternatives[0];

  const simulation = useMemo(
    () => simulateMonteCarlo(
      criteria,
      alternatives,
      [firstAlternative.id, secondAlternative.id],
      simulationCount,
      distributionType,
      12
    ),
    [criteria, alternatives, firstAlternative.id, secondAlternative.id, simulationCount, distributionType]
  );

  const chartData = simulation.histogram.map((bin) => ({
    bucket: bin.bucket,
    [firstAlternative.name]: bin.counts[firstAlternative.id] ?? 0,
    [secondAlternative.name]: bin.counts[secondAlternative.id] ?? 0,
  }));

  const firstSeries = simulation.items.find((item) => item.alternativeId === firstAlternative.id);
  const secondSeries = simulation.items.find((item) => item.alternativeId === secondAlternative.id);

  const insight = firstSeries && secondSeries
    ? buildMonteCarloInsight(firstSeries, secondSeries, simulation.winProbability)
    : 'Alternatif seçimleri ve simülasyon başlatıldıkça analiz otomatik olarak güncellenecek.';

  return (
    <section className="bg-app-surface p-6 rounded-[32px] border border-app-border shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-app-muted font-semibold">Monte Carlo Karşılaştırması</p>
          <h2 className="text-2xl font-bold text-app-text mt-2">Alternatif Skor Dağılımı</h2>
          <p className="mt-3 max-w-2xl text-sm text-app-muted leading-relaxed">
            İki alternatifin 1000+ simülasyon üzerinden ağırlıklı toplam skor dağılımını, kazanma olasılığını ve risk profilini aynı ekranda kıyaslayın.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[auto_auto]">
          <div className="grid gap-2">
            <label className="text-xs font-semibold uppercase text-app-muted">Simülasyon Adeti</label>
            <div className="grid grid-cols-3 gap-2">
              {COUNT_OPTIONS.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => onSimulationCountChange(count)}
                  className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition ${simulationCount === count ? 'border-indigo-400 bg-indigo-600 text-white' : 'border-app-border bg-app-surface-soft text-app-text hover:border-indigo-300'}`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-semibold uppercase text-app-muted">Dağılım Tipi</label>
            <div className="grid grid-cols-2 gap-2">
              {(['uniform', 'normal'] as DistributionType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => onDistributionTypeChange(type)}
                  className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition ${distributionType === type ? 'border-teal-500 bg-teal-600 text-white' : 'border-app-border bg-app-surface-soft text-app-text hover:border-teal-300'}`}
                >
                  {type === 'uniform' ? 'Uniform' : 'Normal'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl bg-app-surface-soft border border-app-border p-5">
              <label className="text-xs uppercase tracking-[0.3em] text-app-muted font-semibold">Alternatif 1</label>
              <select
                value={firstAlternative.id}
                onChange={(event) => onFirstAlternativeChange(event.target.value)}
                className="mt-3 w-full rounded-2xl border border-app-border bg-app-bg px-4 py-3 text-sm text-app-text outline-none focus:border-indigo-500"
              >
                {alternatives.map((alt) => (
                  <option key={alt.id} value={alt.id}>{alt.name}</option>
                ))}
              </select>
              <div className="mt-4 space-y-2">
                <div className="text-sm font-semibold text-app-text">Ortalama Skor</div>
                <div className="text-3xl font-extrabold text-indigo-600">{firstSeries ? firstSeries.average.toFixed(3) : '--'}</div>
              </div>
            </div>

            <div className="rounded-3xl bg-app-surface-soft border border-app-border p-5">
              <label className="text-xs uppercase tracking-[0.3em] text-app-muted font-semibold">Alternatif 2</label>
              <select
                value={secondAlternative.id}
                onChange={(event) => onSecondAlternativeChange(event.target.value)}
                className="mt-3 w-full rounded-2xl border border-app-border bg-app-bg px-4 py-3 text-sm text-app-text outline-none focus:border-teal-500"
              >
                {alternatives.filter((alt) => alt.id !== firstAlternative.id).map((alt) => (
                  <option key={alt.id} value={alt.id}>{alt.name}</option>
                ))}
              </select>
              <div className="mt-4 space-y-2">
                <div className="text-sm font-semibold text-app-text">Ortalama Skor</div>
                <div className="text-3xl font-extrabold text-teal-600">{secondSeries ? secondSeries.average.toFixed(3) : '--'}</div>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-app-border bg-app-bg/70 p-5 shadow-inner">
            <div className="h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="firstGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.06} />
                    </linearGradient>
                    <linearGradient id="secondGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#334155" vertical={false} />
                  <XAxis dataKey="bucket" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={12} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid rgba(148, 163, 184, 0.18)', color: '#e2e8f0' }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Legend wrapperStyle={{ color: '#cbd5e1', fontSize: 13 }} />
                  <Area type="monotone" dataKey={firstAlternative.name} stroke="#6366f1" fill="url(#firstGradient)" fillOpacity={1} strokeWidth={2} />
                  <Area type="monotone" dataKey={secondAlternative.name} stroke="#14b8a6" fill="url(#secondGradient)" fillOpacity={1} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <aside className="grid gap-4">
          {[firstSeries, secondSeries].map((series) => (
            <div key={series?.alternativeId ?? 'placeholder'} className="rounded-3xl border border-app-border bg-app-surface-soft p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-app-text">{series?.name ?? 'Bekleniyor'}</span>
                <span className="text-xs uppercase tracking-widest text-app-muted">{series ? 'Dağılım Özeti' : 'Seçim Yok'}</span>
              </div>
              {series ? (
                <div className="space-y-3 text-sm text-app-muted">
                  <div className="flex justify-between"><span>Ortalama</span><span className="font-semibold text-app-text">{series.average.toFixed(3)}</span></div>
                  <div className="flex justify-between"><span>Std. Sapma</span><span className="font-semibold text-app-text">{series.stddev.toFixed(3)}</span></div>
                  <div className="flex justify-between"><span>En İyi Durum</span><span className="font-semibold text-app-text">{series.best.toFixed(3)}</span></div>
                  <div className="flex justify-between"><span>En Kötü Durum</span><span className="font-semibold text-app-text">{series.worst.toFixed(3)}</span></div>
                  <div className="flex justify-between"><span>Kazanma Olasılığı</span><span className="font-semibold text-app-text">{simulation.winProbability[series.alternativeId]?.toFixed(1)}%</span></div>
                </div>
              ) : (
                <p className="text-sm text-app-muted">Her iki alternatifi de seçin ve simülasyonu inceleyin.</p>
              )}
            </div>
          ))}

          <div className="rounded-3xl border border-app-border bg-app-surface p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-app-muted font-semibold mb-3">Analiz Özeti</p>
            <p className="text-sm leading-6 text-app-text">{insight}</p>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default MonteCarloComparison;
