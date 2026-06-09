
import React from 'react';
import { Criterion } from '../types';

interface Props {
  criteria: Criterion[];
  onChange: (updated: Criterion[]) => void;
}

const CriteriaControl: React.FC<Props> = ({ criteria, onChange }) => {
  const handleWeightChange = (id: string, newWeight: number) => {
    const updated = criteria.map(c => c.id === id ? { ...c, weight: newWeight } : c);
    
    // Normalize weights to sum to 1
    const total = updated.reduce((sum, c) => sum + c.weight, 0);
    const normalized = updated.map(c => ({ ...c, weight: c.weight / total }));
    
    onChange(normalized);
  };

  return (
    <div className="bg-app-surface p-6 rounded-xl shadow-sm border border-app-border h-full">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <i className="fa-solid fa-sliders text-indigo-600"></i>
        Kriter Ağırlıkları
      </h2>
      <p className="text-sm text-app-muted mb-6">Önceliklerinizi belirlemek için sürgüleri hareket ettirin.</p>
      
      <div className="space-y-6 overflow-y-auto max-h-[calc(100%-100px)] pr-2">
        {criteria.map((c) => {
          const inputId = `criterion-${c.id}`;
          const descriptionId = `description-${c.id}`;
          return (
            <div key={c.id} className="group">
              <div className="flex justify-between items-center mb-1">
                <label htmlFor={inputId} className="text-sm font-semibold text-app-text">{c.name}</label>
                <span className="text-xs font-mono bg-app-surface-soft px-2 py-0.5 rounded text-app-muted">
                  %{(c.weight * 100).toFixed(0)}
                </span>
              </div>
              <input
                id={inputId}
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={c.weight}
                aria-valuemin={0}
                aria-valuemax={1}
                aria-valuenow={c.weight}
                aria-describedby={descriptionId}
                onChange={(e) => handleWeightChange(c.id, parseFloat(e.target.value))}
                className="w-full h-2 bg-app-surface-soft rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <p id={descriptionId} className="text-[10px] text-app-muted mt-1 italic">{c.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CriteriaControl;
