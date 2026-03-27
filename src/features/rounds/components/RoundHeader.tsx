import React from 'react';
import { Round } from '../../../types';
import { Target, Activity, Calendar, LayoutGrid, BarChart2 } from 'lucide-react';

interface RoundHeaderProps {
  rounds: Round[];
  selectedRoundId: string | null;
  onSelectRound: (id: string | null) => void;
  activeTab: 'round' | 'history' | 'discussion' | 'documentation';
  setActiveTab: (tab: 'round' | 'history' | 'discussion' | 'documentation') => void;
}

export const RoundHeader: React.FC<RoundHeaderProps> = ({
  rounds,
  selectedRoundId,
  onSelectRound,
  activeTab,
  setActiveTab
}) => {
  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700">
      {/* Selector de Rondas Estilo Glassmorphism */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white/40 backdrop-blur-md p-6 rounded-[2rem] border border-white/60 shadow-lg">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-slate-900 rounded-2xl shadow-xl shadow-slate-900/20">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Gestión de Rondas <span className="text-slate-200">/</span>
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Fase de Estimación Estratégica
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-hide px-1">
          {rounds.length === 0 ? (
            <p className="text-[10px] font-black text-slate-400/60 uppercase tracking-widest px-4 italic animate-pulse">
              Sin rondas activas...
            </p>
          ) : rounds.map((round) => {
            const isSelected = (round.id || (round as any)._id) === selectedRoundId;
            const isOpen = round.status === 'open';
            
            return (
              <button
                key={round.id || (round as any)._id}
                onClick={() => onSelectRound(round.id || (round as any)._id)}
                className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all whitespace-nowrap border-2 flex items-center gap-3 active:scale-95 ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-900/20'
                    : 'bg-white/80 border-slate-100 text-slate-400 hover:border-delphi-keppel hover:text-delphi-keppel shadow-sm'
                }`}
              >
                {isOpen && <div className="w-1.5 h-1.5 bg-delphi-keppel rounded-full animate-pulse shadow-[0_0_10px_rgba(43,186,165,0.8)]" />}
                Ronda {round.roundNumber}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabs de Navegación Premium */}
      <div className="flex p-1.5 bg-slate-900/5 backdrop-blur-sm rounded-[1.5rem] border border-slate-100 max-w-fit shadow-inner">
        {[
          { id: 'round', label: 'Enfoque Actual', icon: Activity },
          { id: 'history', label: 'Evolución', icon: BarChart2 },
          { id: 'discussion', label: 'Espacio Técnico', icon: LayoutGrid },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-3 px-6 md:px-8 py-3 rounded-[1.25rem] transition-all group ${
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-md transform scale-[1.02]'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-delphi-keppel' : 'group-hover:text-delphi-keppel'}`} />
            <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
