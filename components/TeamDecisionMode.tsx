import React, { useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Cell, LabelList } from 'recharts';
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
  const activeCriteria = criteria.filter((criterion) => criterion.active !== false);
  const consensus = useMemo(() => buildTeamConsensus(criteria, alternatives, profiles), [criteria, alternatives, profiles]);

  const profileCriteria = useMemo(
    () => activeCriteria.map((criterion) => ({
      ...criterion,
      weight: activeProfile.weights[criterion.id] ?? 0,
    })),
    [activeCriteria, activeProfile]
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

  const profileAgreementData = profiles.map((profile) => {
    const profileScores = profiles.map((other) => consensus.conflictMatrix[profile.id]?.[other.id] ?? 0);
    const averageAgreement = profileScores.reduce((sum, value) => sum + value, 0) / Math.max(profileScores.length, 1);
    return {
      name: profile.name,
      agreement: Math.round(averageAgreement),
    };
  });

  const activeProfileWeightData = activeCriteria.map((criterion) => ({
    name: criterion.name,
    weight: Number((((activeProfile.weights[criterion.id] ?? 0) * 100)).toFixed(1)),
    unit: criterion.unit,
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
            <h3 className="text-sm font-bold text-app-text mb-4 uppercase tracking-[0.25em]">Ağırlık Sütun Grafiği</h3>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activeProfileWeightData} layout="vertical" margin={{ top: 10, right: 12, left: 12, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fill: '#cbd5e1', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, 'Ağırlık']}
                    labelStyle={{ color: '#e2e8f0' }}
                    contentStyle={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.25)', color: '#e2e8f0' }}
                  />
                  <Bar dataKey="weight" radius={[0, 10, 10, 0]} fill="#6366f1">
                    <LabelList dataKey="weight" position="right" formatter={(value: number) => `${value}%`} fill="#e2e8f0" fontSize={10} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-3xl border border-app-border bg-app-surface p-5">
            <h3 className="text-sm font-bold text-app-text mb-4 uppercase tracking-[0.25em]">Profiller Arası Uyum</h3>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={profileAgreementData} margin={{ top: 20, right: 12, bottom: 10, left: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#cbd5e1', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, 'Uyum']}
                    labelStyle={{ color: '#e2e8f0' }}
                    contentStyle={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.25)', color: '#e2e8f0' }}
                  />
                  <Bar dataKey="agreement" radius={[10, 10, 0, 0]} fill="#14b8a6">
                    <LabelList dataKey="agreement" position="top" formatter={(value: number) => `${value}%`} fill="#e2e8f0" fontSize={10} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
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
                <RadarChart data={activeCriteria.map((criterion) => ({
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
