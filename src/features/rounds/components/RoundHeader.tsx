import React from 'react';
import { Round } from '../../../types';
import { Target, Activity, Calendar, LayoutGrid, BarChart2, Plus } from 'lucide-react';

interface RoundHeaderProps {
  rounds: Round[];
  selectedRoundId: string | null;
  onSelectRound: (id: string | null) => void;
  activeTab: 'round' | 'history' | 'discussion' | 'documentation';
  setActiveTab: (tab: 'round' | 'history' | 'discussion' | 'documentation') => void;
  isFacilitator?: boolean;
  onStartNextRound?: () => void;
  hasActiveRound?: boolean;
}

export const RoundHeader: React.FC<RoundHeaderProps> = ({
  rounds,
  selectedRoundId,
  onSelectRound,
  activeTab,
  setActiveTab,
  isFacilitator,
  onStartNextRound,
  hasActiveRound
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-sm">
          {[
            { id: 'round', label: 'Ronda Actual', icon: Activity },
            { id: 'history', label: 'Evolución', icon: BarChart2 },
            { id: 'discussion', label: 'Discusión', icon: LayoutGrid },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-delphi-keppel' : ''}`} />
              <span className="text-xs font-bold uppercase tracking-wide">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Round Selector */}
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap mr-2 border-r pr-4 border-slate-100">Círculo de Rondas</span>
          <div className="flex items-center gap-2">
            {rounds.length > 0 ? (
              rounds.map((round) => {
                const isSelected = (round.id || (round as any)._id) === selectedRoundId;
                return (
                  <button
                    key={round.id || (round as any)._id}
                    onClick={() => onSelectRound(round.id || (round as any)._id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                      : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'
                      }`}
                  >
                    R{round.roundNumber}
                  </button>
                );
              })
            ) : (
              <span className="text-xs text-slate-300 italic px-2">Sin rondas activas</span>
            )}
            
            {/* New Round "+" Button - Always visible for Facilitator context */}
            <button
              onClick={onStartNextRound}
              disabled={!onStartNextRound || hasActiveRound}
              title="Iniciar Nueva Ronda"
              aria-label="Nueva Ronda"
              className={`min-w-[32px] rounded-lg transition-all border-2 border-dashed ${!hasActiveRound && onStartNextRound ? 'border-delphi-keppel text-delphi-keppel hover:bg-delphi-keppel hover:text-white hover:border-solid shadow-sm' : 'border-slate-100 text-slate-300 cursor-not-allowed opacity-50' } btn-base`}
            >
              <span className="text-sm font-black relative -top-[1px]">+</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
