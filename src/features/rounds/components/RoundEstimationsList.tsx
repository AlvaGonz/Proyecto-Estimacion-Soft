import React from 'react';
import { Estimation, Round } from '../../../../types';
import { BarChart2, ShieldAlert, CheckCircle2 } from 'lucide-react';

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
    <div className="bg-white/95 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-white/40 shadow-xl flex flex-col h-full group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-delphi-keppel/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-delphi-keppel/10 transition-colors" />
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="space-y-1">
          <h4 className="text-2xl font-black text-slate-900 tracking-tight">
            {viewedRound ? `Ronda ${viewedRound.roundNumber}` : 'Resultados'}
          </h4>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Estimaciones Recibidas</p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-2xl font-black text-delphi-keppel leading-none">
            {currentRoundEstimations.length}<span className="text-slate-200 ml-1">/</span><span className="text-slate-300 text-lg">{totalExperts}</span>
          </span>
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Participantes</span>
        </div>
      </div>

      <div className="flex-1 space-y-4 min-h-[300px] relative z-10 custom-scrollbar overflow-y-auto pr-2">
        {currentRoundEstimationsWithLabels.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-10 gap-6 opacity-40">
            <div className="bg-slate-100 p-8 rounded-[2.5rem]">
              <BarChart2 className="w-16 h-16 text-slate-400" />
            </div>
            <div className="space-y-2">
              <h5 className="text-lg font-black text-slate-900 uppercase tracking-widest">Esperando Datos</h5>
              <p className="text-sm font-medium text-slate-500 max-w-[200px]">Aún no se han registrado estimaciones en esta ronda estratégica.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {currentRoundEstimationsWithLabels.map((est, idx) => {
              const outlier = isOutlier(est.id);
              const roundIsCurrentlyOpen = viewedRound?.status === 'open';
              const showValue = isFacilitator || !roundIsCurrentlyOpen;
              
              return (
                <div
                  key={est.id}
                  className={`expert-card p-6 rounded-[2rem] border transition-all relative overflow-hidden group/item ${
                    outlier 
                      ? 'bg-delphi-giants/5 border-delphi-giants/20 hover:bg-delphi-giants/10' 
                      : 'bg-slate-50 border-slate-100 hover:bg-white hover:border-delphi-keppel/30 hover:shadow-lg hover:shadow-slate-200/50'
                  }`}
                  data-testid={`expert-card-${est.id}`}
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  {outlier && (
                    <div className="absolute top-0 right-0 py-1.5 px-4 bg-delphi-giants text-white text-[8px] font-black uppercase tracking-widest rounded-bl-2xl flex items-center gap-1.5 z-20">
                      <ShieldAlert className="w-3 h-3" />
                      Atípico Detectado
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                         outlier ? 'bg-delphi-giants/20 text-delphi-giants' : 'bg-slate-900 text-white'
                      }`}>
                         {est.expertLabel.substring(0, 2)}
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Experto</p>
                         <p className="text-xs font-black text-slate-900">{est.expertLabel}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                       {showValue ? (
                         <div className="flex flex-col items-end">
                           <span className={`text-2xl font-black leading-none ${outlier ? 'text-delphi-giants' : 'text-delphi-keppel'}`}>
                             {est.value} {(unit?.toLowerCase() === 'hours' || unit?.toLowerCase() === 'horas') ? 'Horas' : (unit?.toLowerCase() === 'storypoints' || unit?.toLowerCase() === 'pts') ? 'SP' : (unit?.toLowerCase() === 'persondays') ? 'DP' : unit}
                           </span>
                         </div>
                       ) : (
                         <div className="flex items-center gap-2 bg-delphi-keppel/10 px-4 py-2 rounded-xl border border-delphi-keppel/20">
                           <CheckCircle2 className="w-4 h-4 text-delphi-keppel" />
                           <span className="text-[9px] font-black text-delphi-keppel uppercase tracking-widest">Enviada</span>
                         </div>
                       )}
                    </div>
                  </div>

                  {(showValue || est.expertId === currentUserId) && (
                    <div className="mt-4 pt-4 border-t border-slate-200/50 relative z-10">
                      <p className="text-xs text-slate-600 font-medium leading-relaxed italic bg-white/50 p-3 rounded-xl border border-slate-100">
                        "{est.justification || 'Sin comentario técnico proporcionado.'}"
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
        <div className="mt-6 space-y-2">
          <button
            onClick={onCloseRound}
            disabled={currentRoundEstimations.length < 1 || isAnalyzing}
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-delphi-giants transition-all disabled:opacity-50"
          >
            {isAnalyzing ? 'Procesando...' : 'Cerrar y Analizar Ronda'}
          </button>
          {errors.submit && <p id="close-error" role="alert" className="text-red-500 text-xs font-bold text-center">{errors.submit}</p>}
          <p className="text-[10px] text-slate-400 text-center font-bold uppercase tracking-widest">
            Participantes: {currentRoundEstimations.length} de {totalExperts}
          </p>
        </div>
      )}
    </div>
  );
};
