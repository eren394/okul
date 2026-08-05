
import React, { useState } from 'react';
import { RankingResult } from '../types';
import { ALTERNATIVE_DESCRIPTIONS } from '../constants';

interface Props {
  results: RankingResult[];
}

const RankingTable: React.FC<Props> = ({ results }) => {
  const [hoveredAltId, setHoveredAltId] = useState<string | null>(null);

  return (
    <div role="region" aria-labelledby="ranking-heading" className="bg-app-surface rounded-xl shadow-sm border border-app-border overflow-hidden relative">
      <div className="p-4 border-b border-app-border bg-app-surface-soft flex justify-between items-center">
        <h3 id="ranking-heading" className="font-bold text-app-text">Analiz Sonuçları (Sıralama)</h3>
        <span className="text-xs text-indigo-600 font-semibold bg-app-accent-soft px-2 py-1 rounded">Anlık Güncelleme Aktif</span>
      </div>
      <table className="w-full text-left" role="table" aria-label="Alternatif sıralaması">
        <thead>
          <tr className="text-xs uppercase text-app-muted font-bold border-b border-app-border">
            <th scope="col" className="px-6 py-4">Sıra</th>
            <th scope="col" className="px-6 py-4">Alternatif</th>
            <th scope="col" className="px-6 py-4 text-right">Başarı Endeksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-app-border">
          {results.map((res) => (
            <tr 
              key={res.alternativeId} 
              className={`hover:bg-app-surface-soft transition-colors ${res.rank === 1 ? 'bg-app-surface-soft/50' : ''}`}
            >
              <td className="px-6 py-4">
                <span className={`
                  inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
                  ${res.rank === 1 ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : 'bg-app-surface-soft text-app-muted'}
                `}>
                  {res.rank === 1 ? <i className="fa-solid fa-crown"></i> : res.rank}
                </span>
              </td>
              <td className="px-6 py-4 relative">
                <button
                  type="button"
                  onMouseEnter={() => setHoveredAltId(res.alternativeId)}
                  onMouseLeave={() => setHoveredAltId(null)}
                  className="font-medium text-app-text hover:text-indigo-600 cursor-help transition-colors"
                  title="Bilgi görmek için tıklayın"
                >
                  {res.name}
                </button>
                {hoveredAltId === res.alternativeId && (
                  <div className="absolute left-0 bottom-full mb-2 z-40 w-72 p-4 rounded-2xl bg-app-surface border border-app-border shadow-lg pointer-events-none">
                    <p className="text-sm text-app-text leading-relaxed">
                      {ALTERNATIVE_DESCRIPTIONS[res.alternativeId] || 'Bilgi bulunamadı.'}
                    </p>
                    <div className="absolute top-full left-4 w-2 h-2 bg-app-surface border border-app-border rotate-45 -mt-1"></div>
                  </div>
                )}
              </td>
              <td className="px-6 py-4 text-right font-mono font-semibold text-indigo-600">
                {(res.totalScore * 100).toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RankingTable;
