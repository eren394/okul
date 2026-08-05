import React from 'react';
import { Alternative, Criterion } from '../types';

interface Props {
  alternatives: Alternative[];
  criteria: Criterion[];
  onChange: (updated: Alternative[]) => void;
}

const generateAlternativeId = () => `a${Math.random().toString(36).slice(2, 9)}`;

const AlternativeManager: React.FC<Props> = ({ alternatives, criteria, onChange }) => {
  const activeCriteria = criteria.filter((criterion) => criterion.active !== false);

  const handleNameChange = (id: string, value: string) => {
    onChange(
      alternatives.map((alt) =>
        alt.id === id ? { ...alt, name: value } : alt
      )
    );
  };

  const handleScoreChange = (alternativeId: string, criterionId: string, value: number) => {
    onChange(
      alternatives.map((alt) => {
        if (alt.id !== alternativeId) return alt;
        return {
          ...alt,
          scores: {
            ...alt.scores,
            [criterionId]: value,
          },
        };
      })
    );
  };

  const handleAddAlternative = () => {
    const newAlternative: Alternative = {
      id: generateAlternativeId(),
      name: `Yeni Alternatif ${alternatives.length + 1}`,
      scores: Object.fromEntries(
        activeCriteria.map((criterion) => [criterion.id, 0])
      ) as Record<string, number>,
    };
    onChange([...alternatives, newAlternative]);
  };

  const handleRemoveAlternative = (id: string) => {
    onChange(alternatives.filter((alt) => alt.id !== id));
  };

  return (
    <section className="bg-app-surface p-6 rounded-3xl border border-app-border shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-app-muted font-semibold">Veri Girişi</p>
          <h2 className="text-2xl font-bold text-app-text mt-2">Alternatif ve Puan Girişi</h2>
          <p className="mt-2 text-sm text-app-muted max-w-2xl">
            Ürün/hizmet üretim şartlarına uygun kriter ve hedef matrisini burada tanımlayabilirsiniz. Alternatifleri ve her kritere ait puanları serbestçe düzenleyin.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddAlternative}
          className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          Alternatif Ekle
        </button>
      </div>

      {activeCriteria.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-app-border p-6 text-app-muted">
          Aktif kriter yok. Lütfen sol taraftan en az bir kriter etkinleştiriniz.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-separate border-spacing-y-3">
            <thead>
              <tr className="text-xs uppercase text-app-muted tracking-[0.3em]">
                <th className="px-4 py-3">Alternatif</th>
                {activeCriteria.map((criterion) => (
                  <th key={criterion.id} className="px-4 py-3">{criterion.name}</th>
                ))}
                <th className="px-4 py-3">Sil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border">
              {alternatives.map((alternative) => (
                <tr key={alternative.id} className="bg-app-surface-soft rounded-3xl">
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={alternative.name}
                      onChange={(event) => handleNameChange(alternative.id, event.target.value)}
                      className="w-full rounded-2xl border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text outline-none focus:border-indigo-500"
                    />
                  </td>
                  {activeCriteria.map((criterion) => (
                    <td key={criterion.id} className="px-4 py-3 w-36">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={alternative.scores[criterion.id] ?? 0}
                        onChange={(event) => handleScoreChange(alternative.id, criterion.id, Number(event.target.value))}
                        className="w-full rounded-2xl border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text outline-none focus:border-indigo-500"
                      />
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleRemoveAlternative(alternative.id)}
                      className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                    >
                      Kaldır
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default AlternativeManager;
