import React, { useMemo, useState } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  ZAxis,
  LabelList,
  Brush,
} from 'recharts';
import { Alternative, Criterion } from '../types';
import { computeParetoFront } from '../utils/analysis';

interface Props {
  criteria: Criterion[];
  alternatives: Alternative[];
}

const ParetoVisualization: React.FC<Props> = ({ criteria, alternatives }) => {
  const [xCriterionId, setXCriterionId] = useState<string>(criteria[0]?.id ?? '');
  const [yCriterionId, setYCriterionId] = useState<string>(criteria[1]?.id ?? criteria[0]?.id ?? '');
  const [selectedAlternative, setSelectedAlternative] = useState<string | null>(null);

  const paretoData = useMemo(
    () => computeParetoFront(criteria, alternatives, xCriterionId, yCriterionId),
    [criteria, alternatives, xCriterionId, yCriterionId]
  );

  const selectedPoint = paretoData.find((point) => point.alternativeId === selectedAlternative) ?? paretoData[0];

  return (
    <section className="bg-app-surface p-6 rounded-[32px] border border-app-border shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-start">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-app-muted font-semibold">Pareto Frontier</p>
          <h2 className="text-2xl font-bold text-app-text mt-2">Çok Kriterli Optimizasyon</h2>
          <p className="mt-3 text-sm text-app-muted leading-relaxed max-w-2xl">
            Alternatifleri hızlıca karşılaştırın. Pareto optimal çözümler açık renkle vurgulanır; baskın çözümler farklı renkte gösterilir.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs uppercase tracking-[0.3em] text-app-muted font-semibold">X Eksen</label>
            <select
              value={xCriterionId}
              onChange={(event) => setXCriterionId(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-app-border bg-app-bg px-4 py-3 text-sm text-app-text outline-none focus:border-indigo-500"
            >
              {criteria.map((criterion) => (
                <option key={criterion.id} value={criterion.id}>{criterion.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.3em] text-app-muted font-semibold">Y Eksen</label>
            <select
              value={yCriterionId}
              onChange={(event) => setYCriterionId(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-app-border bg-app-bg px-4 py-3 text-sm text-app-text outline-none focus:border-teal-500"
            >
              {criteria.map((criterion) => (
                <option key={criterion.id} value={criterion.id}>{criterion.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-[32px] border border-app-border bg-app-bg/80 p-5">
          <div className="h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 16, right: 24, bottom: 16, left: 12 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#334155" />
                <XAxis dataKey="x" name={paretoData[0]?.xLabel ?? 'X'} tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="y" name={paretoData[0]?.yLabel ?? 'Y'} tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <ZAxis dataKey="x" range={[100, 200]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: '#0f172a', border: '1px solid rgba(148, 163, 184, 0.2)', color: '#e2e8f0' }} formatter={(value: number) => value.toFixed(2)} />
                <Legend wrapperStyle={{ color: '#cbd5e1', fontSize: 13 }} />
                <ReferenceLine x={0} stroke="#475569" strokeDasharray="4 4" />
                <ReferenceLine y={0} stroke="#475569" strokeDasharray="4 4" />
                <Scatter
                  name="Dominated"
                  data={paretoData.filter((point) => !point.isParetoOptimal)}
                  fill="#64748b"
                  onClick={(entry) => setSelectedAlternative(entry.alternativeId)}
                />
                <Scatter
                  name="Pareto Optimal"
                  data={paretoData.filter((point) => point.isParetoOptimal)}
                  fill="#14b8a6"
                  onClick={(entry) => setSelectedAlternative(entry.alternativeId)}
                >
                  <LabelList dataKey="name" position="top" fill="#f8fafc" fontSize={10} />
                </Scatter>
                <Brush dataKey="x" height={30} stroke="#0ea5e9" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-app-border bg-app-surface-soft p-5">
            <h3 className="text-sm font-bold text-app-text mb-3 uppercase tracking-[0.25em]">Seçili Alternatif</h3>
            {selectedPoint ? (
              <div className="space-y-3 text-sm text-app-muted">
                <p className="font-semibold text-app-text">{selectedPoint.name}</p>
                <p>{selectedPoint.details}</p>
                <p className="text-xs text-slate-400">Pareto optimal: {selectedPoint.isParetoOptimal ? 'Evet' : 'Hayır'}</p>
              </div>
            ) : (
              <p className="text-sm text-app-muted">Grafikten bir nokta seçin, ilgili alternatif detayları burada görünecek.</p>
            )}
          </div>

          <div className="rounded-3xl border border-app-border bg-app-surface p-5">
            <h3 className="text-sm font-bold text-app-text mb-3 uppercase tracking-[0.25em]">Kullanım Notları</h3>
            <ul className="space-y-2 text-sm text-app-muted list-inside list-disc">
              <li>Uygun eksen seçimi ile alternatiflerin çakışma noktalarını keşfedin.</li>
              <li>Pareto optimal çözümler yeşil renkli olarak vurgulanır.</li>
              <li>Grafiğe tıklayarak detay panelinde alternatif verilerini izleyin.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ParetoVisualization;
