import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { Alternative, Criterion } from '../types';
import { analyzeSensitivity } from '../utils/analysis';
import CriteriaControl from './CriteriaControl';

interface Props {
  criteria: Criterion[];
  alternatives: Alternative[];
  onCriteriaChange: (updated: Criterion[]) => void;
}

const SensitivityAnalysis: React.FC<Props> = ({ criteria, alternatives, onCriteriaChange }) => {
  const analysis = useMemo(() => analyzeSensitivity(criteria, alternatives), [criteria, alternatives]);
  const previousLeader = useRef<string>(analysis.currentWinner);
  const [leaderChanged, setLeaderChanged] = useState(false);

  useEffect(() => {
    if (previousLeader.current !== analysis.currentWinner) {
      setLeaderChanged(true);
      const timeout = window.setTimeout(() => setLeaderChanged(false), 2600);
      previousLeader.current = analysis.currentWinner;
      return () => window.clearTimeout(timeout);
    }
    previousLeader.current = analysis.currentWinner;
  }, [analysis.currentWinner]);

  const chartData = analysis.impacts.map((impact) => ({
    name: impact.name,
    impactScore: impact.impactScore,
    threshold: impact.thresholdToChangeLeader ? impact.thresholdToChangeLeader * 100 : 0,
  }));

  return (
    <section className="bg-app-surface p-6 rounded-[32px] border border-app-border shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-app-muted font-semibold">Sensitivity Analysis</p>
          <h2 className="text-2xl font-bold text-app-text mt-2">Kriter Ağırlık Etkisi</h2>
          <p className="mt-3 max-w-2xl text-sm text-app-muted leading-relaxed">
            Ağırlıkları gerçek zamanlı değiştirin; hangi kriterin sıralamayı ne kadar sürüklediğini ve kritik eşiği görselleştirin.
          </p>
        </div>

        <div className="rounded-3xl border border-app-border bg-app-surface-soft p-4 shadow-sm text-sm text-app-text">
          <p className="font-semibold text-app-text">Mevcut Lider</p>
          <p className="mt-2 text-3xl font-extrabold text-indigo-500">{analysis.currentWinner}</p>
          {leaderChanged && (
            <p className="mt-3 rounded-2xl bg-emerald-500/10 px-4 py-3 text-emerald-200 ring-1 ring-emerald-400/20">
              Lider değişti: yeni aday tanımlandı.
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-[32px] border border-app-border bg-app-bg/80 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-app-text uppercase tracking-[0.25em]">Tornado Chart</h3>
              <p className="text-xs text-app-muted mt-1">Her kriterin karar üzerindeki aralığı.</p>
            </div>
            <span className="rounded-2xl bg-app-surface-soft px-3 py-2 text-xs font-semibold text-app-text">Impact Score</span>
          </div>
          <div className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 16, right: 12, left: 8, bottom: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={180} tick={{ fill: '#cbd5e1', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value: number) => [`${value.toFixed(1)} pts`, 'Impact']} cursor={{ fill: '#0f172a' }} />
                <Bar dataKey="impactScore" radius={[12, 12, 12, 12]} fill="#0ea5e9" barSize={20}>
                  <LabelList dataKey="threshold" position="right" formatter={(value: number) => value ? `${value.toFixed(0)}% eşiği` : ''} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-app-border bg-app-surface-soft p-5">
            <h3 className="text-sm font-bold text-app-text mb-3 uppercase tracking-[0.25em]">Kritik Eşikler</h3>
            <div className="space-y-3 text-sm text-app-muted">
              {analysis.impacts.slice(0, 3).map((impact) => (
                <div key={impact.criterionId} className="rounded-3xl bg-app-bg p-4">
                  <p className="font-semibold text-app-text">{impact.name}</p>
                  <p>{impact.note}</p>
                  {impact.thresholdToChangeLeader !== null && (
                    <p className="mt-2 text-xs text-slate-400">Lider değişimi {impact.thresholdToChangeLeader * 100}% civarında başlıyor.</p>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-app-muted">{analysis.warning}</p>
          </div>

          <div className="rounded-3xl border border-app-border bg-app-surface p-5">
            <h3 className="text-sm font-bold text-app-text mb-3 uppercase tracking-[0.25em]">Ağırlık Editörü</h3>
            <p className="text-sm text-app-muted mb-4">Tüm kriterlerin ağırlıklarını yeniden dengeleyin ve etkileri anında gözlemleyin.</p>
            <CriteriaControl criteria={criteria} onChange={onCriteriaChange} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default SensitivityAnalysis;
