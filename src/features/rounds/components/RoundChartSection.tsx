import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { Round } from '../../../../types';
import { BarChart3, TrendingUp } from 'lucide-react';

interface RoundChartSectionProps {
  viewedRound: Round | null;
  rounds: Round[];
  showEvolution: boolean;
  setShowEvolution: (show: boolean) => void;
}

export const RoundChartSection: React.FC<RoundChartSectionProps> = ({
  viewedRound,
  rounds,
  showEvolution,
  setShowEvolution
}) => {
  if (!viewedRound) return null;

  const getDistributionData = () => {
    if (!viewedRound?.stats?.distribution) return [];
    return Object.entries(viewedRound.stats.distribution).map(([val, count]) => ({
      name: val,
      count
    }));
  };

  const getEvolutionData = () => {
    return rounds
      .filter(r => r.status === 'closed')
      .map(r => ({
        name: `R${r.roundNumber}`,
        media: r.stats?.mean || 0,
        mediana: r.stats?.median || 0
      }));
  };

  const hasEvolutionData = rounds.some(r => r.status === 'closed');

  return (
    <div className="bg-white/95 backdrop-blur-xl p-8 md:p-12 rounded-[3.5rem] border border-white/40 shadow-2xl space-y-10 relative overflow-hidden animate-in zoom-in-95 duration-1000 group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50/50 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-slate-100/50 transition-colors duration-1000" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10 border-b border-slate-50 pb-8">
        <div className="space-y-4">
          <div className="p-3 bg-delphi-keppel/10 rounded-2xl w-fit">
            <BarChart3 className="w-6 h-6 text-delphi-keppel" />
          </div>
          <div>
            <h4 className="text-3xl font-black text-slate-900 tracking-tighter">
              {showEvolution ? "Evolución de Consenso" : "Distribución de Votos"}
            </h4>
            <div className="flex items-center gap-2 mt-2">
              <Activity className="w-3 h-3 text-slate-400" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Análisis Estadístico Inteligente</p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 p-1.5 bg-slate-900/5 rounded-2xl border border-slate-100">
           <button 
             onClick={() => setShowEvolution(false)}
             className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!showEvolution ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
           >
             Distribución
           </button>
           {hasEvolutionData && (
             <button 
               onClick={() => setShowEvolution(true)}
               className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showEvolution ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
             >
               Evolución
             </button>
           )}
        </div>
      </div>

      <div className="h-[350px] md:h-[400px] w-full bg-slate-50/30 rounded-[2.5rem] p-8 md:p-10 border border-slate-50 relative z-10 overflow-visible">
        {showEvolution ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={getEvolutionData()}>
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#2BBAA5" />
                  <stop offset="100%" stopColor="#299E8F" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', backdropFilter: 'blur(10px)', background: 'rgba(255,255,255,0.95)' }}
              />
              <Line type="monotone" dataKey="media" stroke="url(#lineGradient)" strokeWidth={4} dot={{ r: 6, fill: '#2BBAA5', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 8, strokeWidth: 4, stroke: 'rgba(43, 186, 165, 0.2)' }} />
              <Line type="monotone" dataKey="mediana" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4, fill: '#94a3b8' }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col">
            {getDistributionData().length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4 opacity-40">
                <BarChart3 className="w-16 h-16" />
                <p className="font-black text-[10px] uppercase tracking-widest">Esperando Consolidación de Votos</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getDistributionData()}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2BBAA5" />
                      <stop offset="100%" stopColor="#2BBAA5" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}
                    cursor={{ fill: 'rgba(43, 186, 165, 0.05)', radius: [10, 10, 0, 0] }}
                  />
                  <Bar dataKey="count" fill="url(#barGradient)" radius={[10, 10, 0, 0]} name="Expertos" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

import { Activity } from 'lucide-react';
