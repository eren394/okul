import React, { useMemo } from 'react';
import { Criterion, Alternative, RankingResult } from '../types';
import { buildExplanation } from '../utils/analysis';

interface Props {
  criteria: Criterion[];
  alternatives: Alternative[];
  results: RankingResult[];
}

const AIExplanationPanel: React.FC<Props> = ({ criteria, alternatives, results }) => {
  const explanation = useMemo(() => buildExplanation(criteria, alternatives, results), [criteria, alternatives, results]);

  return (
    <section className="bg-app-surface p-6 rounded-[32px] border border-app-border shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-app-muted font-semibold">AI Explanation Engine</p>
          <h2 className="text-2xl font-bold text-app-text mt-2">Kararın Hikayesi</h2>
        </div>
        <div className="rounded-3xl border border-app-border bg-app-surface-soft px-4 py-3 text-sm text-app-text">
          <p className="font-semibold">Confidence</p>
          <p className="text-3xl font-extrabold text-emerald-500">{explanation.confidence}%</p>
        </div>
      </div>

      <div className="mt-6 rounded-[28px] border border-app-border bg-app-bg/70 p-6">
        <p className="text-sm leading-7 text-app-text">{explanation.summary}</p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {explanation.cards.map((card) => (
          <div key={card.title} className="rounded-3xl border border-app-border bg-app-surface-soft p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-app-muted font-semibold mb-3">{card.title}</p>
            <p className={`text-sm leading-6 ${card.accent === 'positive' ? 'text-emerald-300' : card.accent === 'warning' ? 'text-amber-200' : 'text-slate-300'}`}>
              {card.content}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-app-border bg-app-surface-soft p-5">
          <h3 className="text-sm font-semibold text-app-text mb-2">En etkili kriterler</h3>
          <ul className="space-y-3 text-sm text-app-muted">
            {explanation.topCriteria.map((item) => (
              <li key={item.name} className="rounded-2xl bg-app-bg p-3">
                <p className="font-semibold text-app-text">{item.name}</p>
                <p>%{(item.contribution * 100).toFixed(1)} etki</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-app-border bg-app-surface p-5">
          <h3 className="text-sm font-semibold text-app-text mb-2">Negatif etki öne çıkanlar</h3>
          <ul className="space-y-3 text-sm text-app-muted">
            {explanation.negativeFactors.map((factor) => (
              <li key={factor.name} className="rounded-2xl bg-app-bg p-3">
                <p className="font-semibold text-app-text">{factor.name}</p>
                <p>{factor.effect}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default AIExplanationPanel;
