
import React from 'react';
import { Criterion } from '../types';

interface Props {
  criteria: Criterion[];
  onChange: (updated: Criterion[]) => void;
}

const generateId = () => `c${Math.random().toString(36).slice(2, 9)}`;

const normalizeCriteria = (items: Criterion[]): Criterion[] => {
  const activeItems = items.filter((item) => item.active !== false);
  const totalActiveWeight = activeItems.reduce((sum, item) => sum + item.weight, 0) || 1;
  return items.map((item) =>
    item.active === false ? item : { ...item, weight: item.weight / totalActiveWeight }
  );
};

const CriteriaControl: React.FC<Props> = ({ criteria, onChange }) => {
  const handleChange = (id: string, update: Partial<Criterion>) => {
    const updated = criteria.map((item) => (item.id === id ? { ...item, ...update } : item));
    onChange(normalizeCriteria(updated));
  };

  const toggleActive = (id: string) => {
    const updated = criteria.map((item) =>
      item.id === id ? { ...item, active: item.active === false ? true : false } : item
    );
    onChange(normalizeCriteria(updated));
  };

  const addCriterion = (parentId?: string) => {
    const newCriterion: Criterion = {
      id: generateId(),
      parentId,
      name: parentId ? 'Yeni Alt Kriter' : 'Yeni Kriter',
      weight: 0.1,
      isBenefit: true,
      unit: parentId ? '' : '1-100',
      description: parentId ? 'Alt kriter açıklaması' : 'Yeni amaç matrisine uygun kriter',
      active: true,
    };
    onChange(normalizeCriteria([...criteria, newCriterion]));
  };

  return (
    <div className="bg-app-surface p-6 rounded-xl shadow-sm border border-app-border h-full">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <i className="fa-solid fa-sliders text-indigo-600"></i>
            Kriter Yönetimi
          </h2>
          <p className="text-sm text-app-muted mt-2">Kriter isimlerini düzenleyin, alt kriter ekleyin ve gerektiğinde devre dışı bırakın.</p>
        </div>
        <button
          type="button"
          onClick={() => addCriterion()}
          className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          Kriter Ekle
        </button>
      </div>

      <div className="space-y-5 overflow-y-auto max-h-[calc(100%-120px)] pr-2">
        {criteria.map((criterion) => {
          const isSub = Boolean(criterion.parentId);
          return (
            <div key={criterion.id} className={`rounded-3xl border border-app-border p-4 ${isSub ? 'bg-app-surface-soft/80' : 'bg-app-surface'} ${isSub ? 'pl-8' : ''}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <label className="text-sm font-semibold text-app-text">{criterion.parentId ? 'Alt Kriter' : 'Kriter'}</label>
                  <input
                    type="text"
                    value={criterion.name}
                    onChange={(event) => handleChange(criterion.id, { name: event.target.value })}
                    className="mt-2 w-full rounded-2xl border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleActive(criterion.id)}
                    className={`rounded-full px-3 py-2 text-xs font-semibold transition ${criterion.active === false ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}
                  >
                    {criterion.active === false ? 'Devre Dışı' : 'Aktif'}
                  </button>
                  {!criterion.parentId && (
                    <button
                      type="button"
                      onClick={() => addCriterion(criterion.id)}
                      className="rounded-full bg-app-surface-soft px-3 py-2 text-xs font-semibold text-app-text transition hover:bg-app-surface"
                    >
                      Alt Kriter Ekle
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.3em] text-app-muted">Ağırlık</label>
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={criterion.weight}
                      onChange={(event) => handleChange(criterion.id, { weight: Number(event.target.value) })}
                      className="w-full h-2 rounded-full accent-indigo-600"
                    />
                    <span className="text-xs font-mono text-app-muted">%{Math.round(criterion.weight * 100)}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.3em] text-app-muted">Tip</label>
                  <select
                    value={criterion.isBenefit ? 'benefit' : 'cost'}
                    onChange={(event) => handleChange(criterion.id, { isBenefit: event.target.value === 'benefit' })}
                    className="mt-2 w-full rounded-2xl border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text outline-none focus:border-indigo-500"
                  >
                    <option value="benefit">Fayda (Yüksek iyi)</option>
                    <option value="cost">Maliyet (Düşük iyi)</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.3em] text-app-muted">Birim</label>
                  <input
                    type="text"
                    value={criterion.unit}
                    onChange={(event) => handleChange(criterion.id, { unit: event.target.value })}
                    className="mt-2 w-full rounded-2xl border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.3em] text-app-muted">Açıklama</label>
                  <input
                    type="text"
                    value={criterion.description}
                    onChange={(event) => handleChange(criterion.id, { description: event.target.value })}
                    className="mt-2 w-full rounded-2xl border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CriteriaControl;
