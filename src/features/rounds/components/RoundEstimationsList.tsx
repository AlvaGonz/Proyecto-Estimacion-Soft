import React from 'react';
import { Estimation, Round } from '../../../types';
import { BarChart2, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { sanitizeInput } from '../../../shared/utils/security';

interface RoundEstimationsListProps {
  viewedRound: Round | null;
  activeRound: Round | null;
  currentRoundEstimations: Estimation[];
  currentRoundEstimationsWithLabels: (Estimation & { expertLabel: string })[];
  totalExperts: number;
  isFacilitator: boolean;
  currentUserId: string;
  isOutlier: (id: string) => boolean;
  canClose: boolean;
  isAnalyzing: boolean;
  onCloseRound: () => void;
  errors: { submit?: string };
  unit: string;
}

export const RoundEstimationsList: React.FC<RoundEstimationsListProps> = ({
  viewedRound,
  activeRound,
  currentRoundEstimations,
  currentRoundEstimationsWithLabels,
  totalExperts,
  isFacilitator,
  currentUserId,
  isOutlier,
  canClose,
  isAnalyzing,
  onCloseRound,
  errors,
  unit
}) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-0.5">
          <h4 className="text-lg font-bold text-slate-900">
            {viewedRound ? `Ronda ${viewedRound.roundNumber}` : 'Resultados'}
          </h4>
          <p className="text-[10px] font-bold text-slate-400 @/ui-ux-pro-max uppercase tracking-wider">Participación de Expertos</p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xl font-bold text-slate-900">
            {currentRoundEstimations.length} <span className="text-slate-300 font-normal">/ {totalExperts}</span>
          </span>
        </div>
      </div>

      <div className="flex-1 space-y-3 min-h-[300px] overflow-y-auto pr-1">
        {currentRoundEstimationsWithLabels.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 gap-4 opacity-50">
            <div className="bg-slate-50 p-6 rounded-2xl">
              <BarChart2 className="w-10 h-10 text-slate-300" />
            </div>
            <div className="space-y-1">
              <h5 className="text-sm font-bold text-slate-800">Esperando datos...</h5>
              <p className="text-xs text-slate-500 max-w-[180px]">No se han registrado estimaciones.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {currentRoundEstimationsWithLabels.map((est, idx) => {
              const outlier = isOutlier(est.id);
              const roundIsCurrentlyOpen = viewedRound?.status === 'open';
              const showValue = isFacilitator || !roundIsCurrentlyOpen;
              
              return (
                <div
                  key={est.id}
                  className={`p-4 rounded-xl border transition-colors ${
                    outlier 
                      ? 'bg-red-50 border-red-100' 
                      : 'bg-slate-50 border-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] ${
                         outlier ? 'bg-red-100 text-red-700' : 'bg-slate-800 text-white'
                      }`}>
                         {est.expertLabel.substring(0, 2)}
                      </div>
                      <div className="flex flex-col">
                         <span className="text-xs font-bold text-slate-800">{est.expertLabel}</span>
                      </div>
                    </div>

                    <div className="text-right">
                       <span className="text-sm font-bold text-slate-900">
                          {showValue ? `${est.value} ${unit}` : '••••'}
                       </span>
                    </div>
                  </div>
                  
                  {outlier && (
                    <div className="mt-2 flex items-center gap-1.5 text-[9px] font-bold text-red-600 uppercase tracking-tighter">
                      <ShieldAlert className="w-3 h-3" />
                      Valor Atípico
                    </div>
                  )}

                  {(showValue || est.expertId === currentUserId) && (
                    <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 flex-1 min-w-0">
                    <p className="text-slate-600 font-medium leading-relaxed italic text-sm">
                      "{sanitizeInput(est.justification || 'Sin comentario.')}"
                    </p>
                  </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {canClose && viewedRound?.id === (activeRound?.id || (activeRound as any)?._id) && (
        <div className="mt-6 pt-6 border-t border-slate-100">
          <button
            onClick={onCloseRound}
            disabled={currentRoundEstimations.length < 1 || isAnalyzing}
            className="w-full bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50 btn-base"
          >
            {isAnalyzing ? "Analizando..." : "Cerrar y Analizar Ronda"}
          </button>
        </div>
      )}
    </div>
  );
};
