import React, { useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { Alternative, Criterion, UserProfile } from '../types';
import { buildTeamConsensus } from '../utils/analysis';
import CriteriaControl from './CriteriaControl';

interface Props {
  criteria: Criterion[];
  alternatives: Alternative[];
  profiles: UserProfile[];
  activeProfileId: string;
  onProfileChange: (profileId: string) => void;
  onProfileUpdate: (profileId: string, updatedWeights: Record<string, number>) => void;
}

const TeamDecisionMode: React.FC<Props> = ({ criteria, alternatives, profiles, activeProfileId, onProfileChange, onProfileUpdate }) => {
  const activeProfile = profiles.find((profile) => profile.id === activeProfileId) ?? profiles[0];
  const consensus = useMemo(() => buildTeamConsensus(criteria, alternatives, profiles), [criteria, alternatives, profiles]);

  const profileCriteria = useMemo(
    () => criteria.map((criterion) => ({
      ...criterion,
      weight: activeProfile.weights[criterion.id] ?? 0,
    })),
    [criteria, activeProfile]
  );

  const handleProfileWeightChange = (updated: Criterion[]) => {
    onProfileUpdate(activeProfile.id, Object.fromEntries(updated.map((item) => [item.id, item.weight])));
  };

  const radarData = criteria.map((criterion) => ({
    subject: criterion.name,
    ...profiles.reduce((acc, profile) => ({
      ...acc,
      [profile.name]: (profile.weights[criterion.id] ?? 0) * 100,
    }), {} as Record<string, number>),
  }));

  return (
    <section className="bg-app-surface p-6 rounded-[32px] border border-app-border shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-app-muted font-semibold">Team Decision Mode</p>
          <h2 className="text-2xl font-bold text-app-text mt-2">Ekip Bazlı Ağırlık Analizi</h2>
          <p className="mt-3 text-sm text-app-muted leading-relaxed max-w-2xl">
            Farklı rol profillerinin tercihlerini karşılaştırın ve ortak konsensüs ile çatışma noktalarını görün.
          </p>
        </div>
        <div className="rounded-3xl border border-app-border bg-app-surface-soft p-4 text-sm text-app-text">
          <p className="font-semibold">Konsensüs Lideri</p>
          <p className="mt-2 text-2xl font-extrabold text-teal-500">{consensus.consensusWinner}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-[32px] border border-app-border bg-app-bg/80 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="text-sm font-bold text-app-text uppercase tracking-[0.25em]">Aktif Profil</h3>
                <p className="text-sm text-app-muted">{activeProfile.role}</p>
              </div>
              <select
                value={activeProfile.id}
                onChange={(event) => onProfileChange(event.target.value)}
                className="rounded-2xl border border-app-border bg-app-bg px-4 py-3 text-sm text-app-text outline-none focus:border-indigo-500"
              >
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>{profile.name}</option>
                ))}
              </select>
            </div>
            <CriteriaControl criteria={profileCriteria} onChange={handleProfileWeightChange} />
          </div>

          <div className="rounded-3xl border border-app-border bg-app-surface p-5">
            <h3 className="text-sm font-bold text-app-text mb-4 uppercase tracking-[0.25em]">Çatışma Isı Haritası</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-app-text">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-app-muted"></th>
                    {profiles.map((profile) => (
                      <th key={profile.id} className="px-4 py-3 text-app-muted">{profile.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((left) => (
                    <tr key={left.id} className="border-t border-app-border">
                      <td className="px-4 py-3 font-semibold text-app-text">{left.name}</td>
                      {profiles.map((right) => (
                        <td key={right.id} className="px-4 py-3">
                          <div className="rounded-2xl bg-slate-950/80 p-3 text-right font-semibold" style={{ backgroundColor: `rgba(16, 185, 129, ${consensus.conflictMatrix[left.id]?.[right.id] ?? 0} / 100)` }}>
                            {Math.round(consensus.conflictMatrix[left.id]?.[right.id] ?? 0)}%
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-app-border bg-app-surface-soft p-5">
            <h3 className="text-sm font-bold text-app-text mb-4 uppercase tracking-[0.25em]">Konsensüs Skoru</h3>
            <div className="rounded-3xl bg-app-bg p-6 text-center">
              <p className="text-xs text-app-muted uppercase tracking-[0.25em]">Ortak Karar Uyumu</p>
              <p className="mt-4 text-4xl font-extrabold text-indigo-500">{Math.round(consensus.agreementScore)}%</p>
              <p className="mt-2 text-sm text-app-muted">Profiller arasındaki genel tutarlılık puanı</p>
            </div>
          </div>

          <div className="rounded-3xl border border-app-border bg-app-surface p-5">
            <h3 className="text-sm font-bold text-app-text mb-4 uppercase tracking-[0.25em]">Ağırlık Dağılımı</h3>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={criteria.map((criterion) => ({
                  subject: criterion.name,
                  ...profiles.reduce((acc, profile) => ({
                    ...acc,
                    [profile.name]: (profile.weights[criterion.id] ?? 0) * 100,
                  }), {} as Record<string, number>),
                }))}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  {profiles.map((profile, index) => (
                    <Radar
                      key={profile.id}
                      name={profile.name}
                      dataKey={profile.name}
                      stroke={index === 0 ? '#6366f1' : index === 1 ? '#14b8a6' : '#f97316'}
                      fill={index === 0 ? '#6366f1' : index === 1 ? '#14b8a6' : '#f97316'}
                      fillOpacity={0.2}
                    />
                  ))}
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default TeamDecisionMode;
