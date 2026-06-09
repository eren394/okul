
import React, { useState } from 'react';
import { DecisionState } from '../types';
import { analyzeDecision } from '../services/geminiService';

interface Props {
  state: DecisionState;
  isOpen: boolean;
  onToggle: () => void;
}

const AIAssistant: React.FC<Props> = ({ state, isOpen, onToggle }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    const result = await analyzeDecision(state);
    setAnalysis(result);
    setLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="group inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-2xl shadow-indigo-500/20 transition hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
      >
        <i className="fa-solid fa-comment"></i>
        <span>Stratejik Karar Danışmanı</span>
      </button>

      <div className={`w-[340px] max-w-full transform overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/95 shadow-2xl shadow-slate-950/40 transition-all duration-300 ${isOpen ? 'opacity-100 scale-100' : 'pointer-events-none opacity-0 scale-95'}`}>
        <section aria-labelledby="ai-assistant-heading" className="p-5">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 flex items-center justify-center text-indigo-200 border border-white/10">
                <i className="fa-solid fa-wand-magic-sparkles text-lg"></i>
              </div>
              <div>
                <h2 id="ai-assistant-heading" className="text-base font-bold text-white">Stratejik Karar Danışmanı</h2>
                <p className="text-xs text-slate-300">Gemini 3.0 tarafından desteklenen akıllı analiz</p>
              </div>
            </div>
            <button
              onClick={onToggle}
              aria-label="Sohbet penceresini kapat"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div role="status" aria-live="polite" className="rounded-3xl border border-white/10 bg-slate-900/80 p-4 min-h-[180px] max-h-[340px] overflow-y-auto text-sm text-slate-200">
            {!analysis && !loading && (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
                <i className="fa-solid fa-comments text-3xl" aria-hidden="true"></i>
                <p>Mevcut verileri ve ağırlıkları analiz etmek için butona tıklayın.</p>
              </div>
            )}

            {loading && (
              <div className="space-y-3 animate-pulse" aria-hidden="true">
                <div className="h-4 rounded bg-white/10"></div>
                <div className="h-4 rounded bg-white/10"></div>
                <div className="h-4 rounded bg-white/10 w-5/6"></div>
              </div>
            )}

            {analysis && (
              <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap text-slate-100">
                {analysis}
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-indigo-900 transition hover:bg-slate-100 disabled:opacity-60"
            >
              {loading ? (
                <i className="fa-solid fa-circle-notch animate-spin"></i>
              ) : (
                <i className="fa-solid fa-brain"></i>
              )}
              {loading ? 'Analiz Ediliyor...' : 'Yapay Zekaya Sor'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AIAssistant;
