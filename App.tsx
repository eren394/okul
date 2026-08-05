
import React, { useState, useEffect, useMemo } from 'react';
import { Criterion, Alternative, RankingResult, DecisionState, DistributionType, UserProfile } from './types';
import { INITIAL_CRITERIA, INITIAL_ALTERNATIVES } from './constants';
import { calculateRankings, buildSimplexObjective } from './utils/mcdm';
import CriteriaControl from './components/CriteriaControl';
import AlternativeManager from './components/AlternativeManager';
import RankingTable from './components/RankingTable';
import Visualizations from './components/Visualizations';
import MonteCarloComparison from './components/MonteCarloComparison';
import SensitivityAnalysis from './components/SensitivityAnalysis';
import ParetoVisualization from './components/ParetoVisualization';
import AIExplanationPanel from './components/AIExplanationPanel';
import TeamDecisionMode from './components/TeamDecisionMode';
import AIAssistant from './components/AIAssistant';
import UncertaintySettings from './components/UncertaintySettings';

const App: React.FC = () => {
  const [criteria, setCriteria] = useState<Criterion[]>(INITIAL_CRITERIA);
  const [alternatives, setAlternatives] = useState<Alternative[]>(INITIAL_ALTERNATIVES);
  const [firstAlternativeId, setFirstAlternativeId] = useState<string>(INITIAL_ALTERNATIVES[0]?.id ?? '');
  const [secondAlternativeId, setSecondAlternativeId] = useState<string>(INITIAL_ALTERNATIVES[1]?.id ?? INITIAL_ALTERNATIVES[0]?.id ?? '');
  const [simulationCount, setSimulationCount] = useState<number>(1000);
  const [distributionType, setDistributionType] = useState<DistributionType>('uniform');
  const [teamProfiles, setTeamProfiles] = useState<UserProfile[]>([
    {
      id: 'finance',
      name: 'Finans Uzmanı',
      role: 'Finans',
      weights: { c1: 0.35, c2: 0.15, c3: 0.10, c4: 0.25, c5: 0.10, c6: 0.05 },
    },
    {
      id: 'ops',
      name: 'Operasyon Müdürü',
      role: 'Operasyon',
      weights: { c1: 0.20, c2: 0.20, c3: 0.10, c4: 0.25, c5: 0.15, c6: 0.10 },
    },
    {
      id: 'sustain',
      name: 'Sürdürülebilirlik Uzmanı',
      role: 'Sürdürülebilirlik',
      weights: { c1: 0.10, c2: 0.15, c3: 0.35, c4: 0.10, c5: 0.20, c6: 0.10 },
    },
  ]);
  const [activeProfileId, setActiveProfileId] = useState<string>('finance');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [enableUncertainty, setEnableUncertainty] = useState(false);
  const [uncertaintyRanges, setUncertaintyRanges] = useState<Record<string, { min: number; max: number }>>(
    Object.fromEntries(INITIAL_CRITERIA.map(c => [c.id, { min: -0.1, max: 0.1 }]))
  );

  const activeCriteria = useMemo(
    () => criteria.filter((criterion) => criterion.active !== false),
    [criteria]
  );

  const handleProfileUpdate = (profileId: string, updatedWeights: Record<string, number>) => {
    setTeamProfiles((current) => current.map((profile) =>
      profile.id === profileId ? { ...profile, weights: updatedWeights } : profile
    ));
  };
  
  React.useEffect(() => {
    document.documentElement.dataset.theme = isDarkMode ? 'dark' : 'light';
  }, [isDarkMode]);

  // Memoized results to prevent unnecessary calculations
  const results = useMemo(() => calculateRankings(activeCriteria, alternatives), [activeCriteria, alternatives]);

  const simplexObjective = useMemo(
    () => buildSimplexObjective(activeCriteria),
    [activeCriteria]
  );

  const decisionState: DecisionState = {
    criteria,
    alternatives,
    results
  };

  return (
    <div className="flex h-screen flex-col bg-app-bg text-app-text">
      {/* Header */}
      <header className="bg-app-surface/95 backdrop-blur-sm border-b border-app-border px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <i className="fa-solid fa-diagram-project text-xl"></i>
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-app-text leading-tight">DecisionMatrix Pro</h1>
            <p className="text-[10px] text-app-muted uppercase tracking-widest font-semibold">Çok Amaçlı Karar Destek Sistemi</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex gap-4 items-center">
            <div className="text-right">
              <p className="text-xs font-bold text-app-text">{alternatives.length} Alternatif</p>
              <p className="text-[10px] text-app-muted">Analiz Ediliyor</p>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="text-right">
              <p className="text-xs font-bold text-app-text">{criteria.length} Kriter</p>
              <p className="text-[10px] text-app-muted">Yapılandırıldı</p>
            </div>
          </div>
          <button
            type="button"
            aria-expanded={showSettings}
            aria-controls="settings-panel"
            onClick={() => setShowSettings((prev) => !prev)}
            className="bg-app-surface-soft hover:bg-app-surface rounded-full p-2 text-app-text transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg"
          >
            <i className="fa-solid fa-gear"></i>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main role="main" className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Criteria Controls */}
        <aside aria-label="Kriter ayarları" className="w-80 border-r border-app-border p-6 overflow-y-auto bg-app-surface-soft shrink-0 hidden lg:block">
          <CriteriaControl 
            criteria={criteria} 
            onChange={setCriteria} 
          />
          {enableUncertainty && (
            <div className="mt-8">
              <UncertaintySettings
                criteria={criteria}
                uncertaintyRanges={uncertaintyRanges}
                onRangeChange={(id, min, max) =>
                  setUncertaintyRanges((prev) => ({
                    ...prev,
                    [id]: { min, max },
                  }))
                }
              />
            </div>
          )}
        </aside>

        {/* Center - Dashboard & Analysis */}
        <section className="flex-1 overflow-y-auto p-6 space-y-8 bg-app-bg">
          
          {/* Top Banner / Hero */}
          <div className="lg:hidden mb-6">
            <CriteriaControl 
              criteria={criteria} 
              onChange={setCriteria} 
            />
          </div>

          <div className="grid grid-cols-1 gap-8">
            <AlternativeManager
              criteria={activeCriteria}
              alternatives={alternatives}
              onChange={setAlternatives}
            />

            <section className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
              <div className="rounded-[32px] border border-app-border bg-app-surface p-6 shadow-sm">
                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-[0.3em]">Simplex Amaç Fonksiyonu</p>
                <h2 className="mt-3 text-xl font-bold text-app-text">Optimizasyon Modeli</h2>
                <p className="mt-4 text-sm leading-7 text-app-text">Bu karar modeli, aktif kriterlerin ağırlıklı toplamını lineer olarak optimize eden bir Simplex amaç fonksiyonuna dayanır.</p>
                <div className="mt-5 rounded-3xl bg-app-bg/70 p-4 border border-app-border">
                  <p className="text-sm text-app-text">{simplexObjective}</p>
                </div>
              </div>

              <div className="rounded-[32px] border border-app-border bg-app-surface p-6 shadow-sm">
                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-[0.3em]">Model Durumu</p>
                <div className="mt-4 grid gap-4">
                  <div className="rounded-3xl bg-app-surface-soft p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-app-muted">Aktif Kriter</p>
                    <p className="mt-2 text-3xl font-bold text-indigo-600">{activeCriteria.length}</p>
                  </div>
                  <div className="rounded-3xl bg-app-surface-soft p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-app-muted">Alternatif</p>
                    <p className="mt-2 text-3xl font-bold text-teal-600">{alternatives.length}</p>
                  </div>
                </div>
              </div>
            </section>

            <MonteCarloComparison
              criteria={activeCriteria}
              alternatives={alternatives}
              firstAlternativeId={firstAlternativeId}
              secondAlternativeId={secondAlternativeId}
              simulationCount={simulationCount}
              distributionType={distributionType}
              onFirstAlternativeChange={setFirstAlternativeId}
              onSecondAlternativeChange={setSecondAlternativeId}
              onSimulationCountChange={setSimulationCount}
              onDistributionTypeChange={setDistributionType}
            />

            <AIExplanationPanel
              criteria={activeCriteria}
              alternatives={alternatives}
              results={results}
            />

            <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.2fr_0.8fr]">
              <SensitivityAnalysis
                criteria={criteria}
                alternatives={alternatives}
                onCriteriaChange={setCriteria}
              />
              <ParetoVisualization criteria={criteria} alternatives={alternatives} />
            </div>

            <TeamDecisionMode
              criteria={criteria}
              alternatives={alternatives}
              profiles={teamProfiles}
              activeProfileId={activeProfileId}
              onProfileChange={setActiveProfileId}
              onProfileUpdate={handleProfileUpdate}
            />

            <Visualizations state={{ ...decisionState, criteria: activeCriteria }} />

            <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.8fr_1fr]">
              <div className="space-y-6">
                 <RankingTable results={results} />
              </div>

              <div className="space-y-6">
                 <div className="bg-app-surface h-full p-6 rounded-3xl border border-app-border shadow-sm flex flex-col justify-between">
                    <h3 className="text-sm font-bold text-app-text mb-4 uppercase tracking-wide">Karar Matrisi Özeti</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="p-4 bg-app-surface-soft rounded-2xl border border-app-border">
                            <p className="text-[11px] text-indigo-600 font-semibold mb-2">En İyi Performans</p>
                            <p className="text-sm font-extrabold text-indigo-900 truncate">{results[0]?.name}</p>
                        </div>
                        <div className="p-4 bg-app-surface-soft rounded-2xl border border-app-border">
                            <p className="text-[11px] text-emerald-600 font-semibold mb-2">Fark Aralığı</p>
                            <p className="text-sm font-extrabold text-emerald-900">
                                {((results[0]?.totalScore - results[results.length-1]?.totalScore) * 100).toFixed(1)}% Gap
                            </p>
                        </div>
                    </div>
                    <div className="mt-4 rounded-3xl bg-app-bg/80 p-4 border border-app-border">
                      <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-[0.3em]">Simplex Optimize Edilen Amaç Fonksiyonu</p>
                      <p className="mt-2 text-sm text-app-text">{simplexObjective}</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>

          {/* Footer Area with Tips */}
          <div role="note" className="flex items-start gap-4 p-4 bg-blue-50 text-blue-800 rounded-3xl border border-blue-100 text-sm shadow-sm">
            <i className="fa-solid fa-circle-info text-lg mt-1"></i>
            <p>
              <strong>İpucu:</strong> Ağırlıkları değiştirdikçe sıralama anlık olarak güncellenir. Modelimiz lineer optimizasyon temelli bir başarı endeksi çıkarır ve tercihlerinizi amaç matrisine göre değerlendirir.
            </p>
          </div>
        </section>
      </main>

      {/* Footer / Status Bar */}
      <footer role="contentinfo" className="bg-app-surface border-t border-app-border px-6 py-2 flex items-center justify-between text-[10px] text-app-muted font-medium shrink-0">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            Motor: Lineer Optimizasyon &amp; Amaç Matrisi
          </span>
          <span>•</span>
          <span>Dil: Türkçe (TR)</span>
        </div>
        <div>
          &copy; 2025 DecisionMatrix Pro. Veriler sadece simülasyon amaçlıdır.
        </div>
      </footer>

      {showSettings && (
        <div className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
      )}
      <aside
        id="settings-panel"
        className={`fixed top-20 right-6 z-50 w-[320px] rounded-3xl border border-app-border bg-app-surface p-5 shadow-app transition-all duration-300 ${showSettings ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-app-text">Ayarlar</h3>
            <p className="text-sm text-app-muted">Tema ve tercihler</p>
          </div>
          <button
            type="button"
            onClick={() => setShowSettings(false)}
            aria-label="Ayarları kapat"
            className="rounded-full bg-app-surface-soft p-2 text-app-text transition hover:bg-app-surface"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div className="space-y-4">
          <div className="rounded-3xl bg-app-surface-soft p-4 border border-app-border">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-app-text">Karanlık Tema</p>
                <p className="text-xs text-app-muted">Gece modu aç/kapat.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsDarkMode((prev) => !prev)}
                className={`inline-flex h-10 w-16 items-center rounded-full p-1 transition ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-300'}`}
                aria-pressed={isDarkMode}
              >
                <span className={`h-8 w-8 rounded-full bg-white shadow transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          <div className="rounded-3xl bg-app-surface-soft p-4 border border-app-border">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-app-text">Belirsizlik Analizi</p>
                <p className="text-xs text-app-muted">Aralık tabanlı hesap.</p>
              </div>
              <input
                type="checkbox"
                checked={enableUncertainty}
                onChange={(e) => setEnableUncertainty(e.target.checked)}
                className="h-5 w-5 cursor-pointer accent-indigo-600"
              />
            </div>
          </div>
        </div>
      </aside>
      <AIAssistant
        state={decisionState}
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen((prev) => !prev)}
      />
    </div>
  );
};

export default App;
