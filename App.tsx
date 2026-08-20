
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

type ViewId = 'home' | 'data' | 'model' | 'monte-carlo' | 'ai' | 'sensitivity' | 'pareto' | 'team' | 'visuals' | 'ranking' | 'settings';

const NAV_ITEMS: Array<{ id: ViewId; label: string; icon: string }> = [
  { id: 'home', label: 'Ana Sayfa', icon: 'fa-house' },
  { id: 'data', label: 'Veri ve Kriterler', icon: 'fa-table-list' },
  { id: 'model', label: 'Simplex Modeli', icon: 'fa-calculator' },
  { id: 'monte-carlo', label: 'Monte Carlo', icon: 'fa-chart-area' },
  { id: 'ai', label: 'Karar Hikayesi', icon: 'fa-wand-magic-sparkles' },
  { id: 'sensitivity', label: 'Duyarlılık', icon: 'fa-sliders' },
  { id: 'pareto', label: 'Pareto Analizi', icon: 'fa-bullseye' },
  { id: 'team', label: 'Ekip Kararı', icon: 'fa-users' },
  { id: 'visuals', label: 'Görselleştirmeler', icon: 'fa-chart-column' },
  { id: 'ranking', label: 'Sıralama', icon: 'fa-ranking-star' },
  { id: 'settings', label: 'Ayarlar', icon: 'fa-gear' },
];

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
  const [activeView, setActiveView] = useState<ViewId>('home');
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

  const activePage = NAV_ITEMS.find((item) => item.id === activeView) ?? NAV_ITEMS[0];

  const renderPage = () => {
    switch (activeView) {
      case 'data':
        return (
          <div className="grid gap-8">
            <CriteriaControl criteria={criteria} onChange={setCriteria} />
            <AlternativeManager criteria={activeCriteria} alternatives={alternatives} onChange={setAlternatives} />
            {enableUncertainty && (
              <UncertaintySettings
                criteria={criteria}
                uncertaintyRanges={uncertaintyRanges}
                onRangeChange={(id, min, max) => setUncertaintyRanges((prev) => ({ ...prev, [id]: { min, max } }))}
              />
            )}
          </div>
        );
      case 'model':
        return (
          <div className="grid gap-8">
            <section className="rounded-[32px] border border-app-border bg-app-surface p-6 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-indigo-600">Simplex Amaç Fonksiyonu</p>
              <h2 className="mt-3 text-2xl font-bold text-app-text">Lineer optimizasyon modeli</h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-app-muted">Aktif kriterlerin normalize edilmiş ağırlıkları ile alternatif puanlarını birleştirir. Fayda kriterleri yükseldikçe, maliyet kriterleri düştükçe toplam skor artar.</p>
              <div className="mt-6 rounded-3xl border border-indigo-200 bg-indigo-50 p-5 text-sm font-semibold text-indigo-900">{simplexObjective}</div>
            </section>
            <Visualizations state={{ ...decisionState, criteria: activeCriteria }} />
          </div>
        );
      case 'monte-carlo':
        return <MonteCarloComparison criteria={activeCriteria} alternatives={alternatives} firstAlternativeId={firstAlternativeId} secondAlternativeId={secondAlternativeId} simulationCount={simulationCount} distributionType={distributionType} onFirstAlternativeChange={setFirstAlternativeId} onSecondAlternativeChange={setSecondAlternativeId} onSimulationCountChange={setSimulationCount} onDistributionTypeChange={setDistributionType} />;
      case 'ai':
        return <AIExplanationPanel criteria={activeCriteria} alternatives={alternatives} results={results} />;
      case 'sensitivity':
        return <SensitivityAnalysis criteria={criteria} alternatives={alternatives} onCriteriaChange={setCriteria} />;
      case 'pareto':
        return <ParetoVisualization criteria={criteria} alternatives={alternatives} />;
      case 'team':
        return <TeamDecisionMode criteria={criteria} alternatives={alternatives} profiles={teamProfiles} activeProfileId={activeProfileId} onProfileChange={setActiveProfileId} onProfileUpdate={handleProfileUpdate} />;
      case 'visuals':
        return <Visualizations state={{ ...decisionState, criteria: activeCriteria }} />;
      case 'ranking':
        return <RankingTable results={results} />;
      case 'settings':
        return (
          <section className="max-w-2xl rounded-[32px] border border-app-border bg-app-surface p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-app-text">Ayarlar</h2>
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between rounded-3xl border border-app-border bg-app-surface-soft p-4">
                <div><p className="font-semibold text-app-text">Karanlık Tema</p><p className="text-sm text-app-muted">Gece görünümünü açıp kapatın.</p></div>
                <button type="button" onClick={() => setIsDarkMode((prev) => !prev)} className={`inline-flex h-10 w-16 items-center rounded-full p-1 transition ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-300'}`} aria-pressed={isDarkMode}><span className={`h-8 w-8 rounded-full bg-white shadow transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`} /></button>
              </div>
              <div className="flex items-center justify-between rounded-3xl border border-app-border bg-app-surface-soft p-4">
                <div><p className="font-semibold text-app-text">Belirsizlik Analizi</p><p className="text-sm text-app-muted">Ağırlık aralıklarını veri sayfasında gösterin.</p></div>
                <input type="checkbox" checked={enableUncertainty} onChange={(event) => setEnableUncertainty(event.target.checked)} className="h-5 w-5 accent-indigo-600" />
              </div>
            </div>
          </section>
        );
      case 'home':
      default:
        return (
          <div className="grid gap-8">
            <section className="rounded-[32px] border border-app-border bg-app-surface p-8 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-600">DecisionMatrix Pro</p>
              <h2 className="mt-3 text-3xl font-bold text-app-text">Karar çalışma alanınız</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-app-muted">Veriyi düzenleyin, Simplex modelini inceleyin ve istediğiniz analize menüden geçin. Her sayfa yalnızca kendi kararını destekleyen araçları gösterir.</p>
            </section>
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="rounded-3xl border border-app-border bg-app-surface p-5"><p className="text-xs uppercase tracking-[0.25em] text-app-muted">Alternatif</p><p className="mt-2 text-3xl font-bold text-teal-600">{alternatives.length}</p></div>
              <div className="rounded-3xl border border-app-border bg-app-surface p-5"><p className="text-xs uppercase tracking-[0.25em] text-app-muted">Aktif Kriter</p><p className="mt-2 text-3xl font-bold text-indigo-600">{activeCriteria.length}</p></div>
              <div className="rounded-3xl border border-app-border bg-app-surface p-5"><p className="text-xs uppercase tracking-[0.25em] text-app-muted">Lider</p><p className="mt-2 truncate text-lg font-bold text-app-text">{results[0]?.name ?? '—'}</p></div>
            </div>
            <RankingTable results={results} />
          </div>
        );
    }
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

      <main role="main" className="flex flex-1 overflow-hidden">
        <nav aria-label="Analiz menüsü" className="hidden w-64 shrink-0 overflow-y-auto border-r border-app-border bg-app-surface-soft p-4 lg:block">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.3em] text-app-muted">Çalışma Alanı</p>
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <button key={item.id} type="button" onClick={() => setActiveView(item.id)} className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold transition ${activeView === item.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-app-text hover:bg-app-surface'}`}>
                <i className={`fa-solid ${item.icon} w-5 text-center`} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
        <section className="flex-1 overflow-y-auto bg-app-bg p-4 sm:p-6">
          <div className="mb-5 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {NAV_ITEMS.map((item) => (
              <button key={item.id} type="button" onClick={() => setActiveView(item.id)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold ${activeView === item.id ? 'bg-indigo-600 text-white' : 'bg-app-surface text-app-text border border-app-border'}`}>{item.label}</button>
            ))}
          </div>
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div><p className="text-xs font-semibold uppercase tracking-[0.3em] text-app-muted">{activePage.id === 'home' ? 'Çok Amaçlı Karar Destek Sistemi' : 'Analiz Sayfası'}</p><h2 className="mt-2 text-2xl font-bold text-app-text">{activePage.label}</h2></div>
              <span className="hidden rounded-full border border-app-border bg-app-surface px-3 py-2 text-xs text-app-muted sm:inline-flex">{alternatives.length} alternatif · {activeCriteria.length} aktif kriter</span>
            </div>
            {renderPage()}
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
