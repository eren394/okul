import React from 'react';
import { Criterion } from '../types';

interface Props {
  criteria: Criterion[];
  uncertaintyRanges: Record<string, { min: number; max: number }>;
  onRangeChange: (criterionId: string, min: number, max: number) => void;
}

const UncertaintySettings: React.FC<Props> = ({ criteria, uncertaintyRanges, onRangeChange }) => {
  return (
    <div className="bg-app-surface p-6 rounded-2xl shadow-sm border border-app-border">
      <h3 className="text-sm font-bold text-app-text mb-1 uppercase tracking-wide">Belirsizlik Aralıkları</h3>
      <p className="text-xs text-app-muted mb-6">Her kriterin ağırlık aralığını belirleyin (+/- değerler).</p>
      
      <div className="space-y-6">
        {criteria.map((c) => {
          const range = uncertaintyRanges[c.id] || { min: -0.1, max: 0.1 };
          return (
            <div key={c.id} className="bg-app-surface-soft rounded-xl p-4 border border-app-border">
              <label className="text-sm font-semibold text-app-text block mb-3">{c.name}</label>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor={`min-${c.id}`} className="text-xs text-app-muted block mb-1">
                    Minimum ({(range.min * 100).toFixed(0)}%)
                  </label>
                  <input
                    id={`min-${c.id}`}
                    type="range"
                    min="-0.5"
                    max="0"
                    step="0.01"
                    value={range.min}
                    onChange={(e) => onRangeChange(c.id, parseFloat(e.target.value), range.max)}
                    className="w-full h-2 bg-app-border rounded-lg appearance-none cursor-pointer accent-red-500"
                  />
                  <span className="text-xs text-app-muted mt-1 block">{(range.min * 100).toFixed(0)}%</span>
                </div>

                <div>
                  <label htmlFor={`max-${c.id}`} className="text-xs text-app-muted block mb-1">
                    Maksimum ({(range.max * 100).toFixed(0)}%)
                  </label>
                  <input
                    id={`max-${c.id}`}
                    type="range"
                    min="0"
                    max="0.5"
                    step="0.01"
                    value={range.max}
                    onChange={(e) => onRangeChange(c.id, range.min, parseFloat(e.target.value))}
                    className="w-full h-2 bg-app-border rounded-lg appearance-none cursor-pointer accent-green-500"
                  />
                  <span className="text-xs text-app-muted mt-1 block">+{(range.max * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-app-surface-soft rounded-xl border border-app-border">
        <p className="text-xs text-app-muted leading-relaxed">
          <strong className="text-app-text">Not:</strong> Belirsizlik aralıkları, seçilen ağırlık değerlerinin etrafında bir varyans oluşturur.
          Bu, karar analizinizin farklı senaryolarda nasıl değişeceğini gösterir.
        </p>
      </div>
    </div>
  );
};

export default UncertaintySettings;
