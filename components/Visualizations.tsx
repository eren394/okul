
import React from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { DecisionState } from '../types';

interface Props {
  state: DecisionState;
}

const Visualizations: React.FC<Props> = ({ state }) => {
  // Prep radar data for Top 2 alternatives
  const top2 = state.results.slice(0, 2);
  const radarData = state.criteria.map(c => {
    const entry: any = { subject: c.name, fullMark: 100 };
    
    // Basic normalization for radar visualization (all scales to 0-100)
    top2.forEach(res => {
      const alt = state.alternatives.find(a => a.id === res.alternativeId);
      const val = alt?.scores[c.id] || 0;
      
      const values = state.alternatives.map(a => a.scores[c.id]);
      const min = Math.min(...values);
      const max = Math.max(...values);
      
      let norm = 0;
      if (max !== min) {
        if (c.isBenefit) norm = ((val - min) / (max - min)) * 100;
        else norm = ((max - val) / (max - min)) * 100;
      } else {
        norm = 100;
      }
      
      entry[res.name] = Math.round(norm);
    });
    
    return entry;
  });

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
      {/* Radar Chart for Trade-off Analysis */}
      <div className="bg-app-surface p-6 rounded-3xl shadow-sm border border-app-border lg:row-span-1">
        <h3 className="text-sm font-bold text-app-muted mb-4 uppercase tracking-widest">Kıyaslamalı Performans (En İyi 2)</h3>
        <div className="h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 11 }} />
              {top2.map((res, i) => (
                <Radar
                  key={res.alternativeId}
                  name={res.name}
                  dataKey={res.name}
                  stroke={i === 0 ? '#4f46e5' : '#10b981'}
                  fill={i === 0 ? '#4f46e5' : '#10b981'}
                  fillOpacity={0.35}
                />
              ))}
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart for Total Scores */}
      <div className="bg-app-surface p-6 rounded-3xl shadow-sm border border-app-border">
        <h3 className="text-sm font-bold text-app-muted mb-4 uppercase tracking-widest">Toplam Karar Skorları</h3>
        <div className="h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={state.results} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
              <XAxis type="number" domain={[0, 1]} tick={{ fill: '#475569', fontSize: 11 }} />
              <YAxis dataKey="name" type="category" width={140} tick={{ fill: '#475569', fontSize: 11 }} />
              <Tooltip cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="totalScore" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Visualizations;
