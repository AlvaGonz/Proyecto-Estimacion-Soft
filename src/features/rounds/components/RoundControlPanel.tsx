import React from 'react';
import { Round, Estimation } from '../../../types';
import { Users, Bell, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface RoundControlPanelProps {
  activeRound: Round | null;
  isFacilitator: boolean;
  hasEstimation: boolean;
  canEstimate: boolean;
  renderEstimationInput: () => React.ReactNode;
  onSubmitEstimate: () => void;
  canSubmit: () => boolean;
  onSendReminder: () => void;
  estimations: Estimation[];
  totalExperts: number;
  errors: { value?: string; justification?: string };
}

export const RoundControlPanel: React.FC<RoundControlPanelProps> = ({
  activeRound,
  isFacilitator,
  hasEstimation,
  canEstimate,
  renderEstimationInput,
  onSubmitEstimate,
  canSubmit,
  onSendReminder,
  estimations,
  totalExperts,
  errors
}) => {
  if (!activeRound) return null;

  const currentRoundEstCount = estimations.filter(
    e => String(e.roundId) === String(activeRound.id || (activeRound as any)._id)
  ).length;

  return (
    <div className="bg-white/95 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-white/40 shadow-xl space-y-8 relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-2 h-full bg-delphi-keppel" />
      <div className="flex items-center justify-between">
        <h4 className="text-2xl font-black text-slate-900 tracking-tight">
          {isFacilitator ? "Control de Ronda" : (hasEstimation ? "Modificar Estimación" : "Tu Estimación")}
        </h4>
        {hasEstimation && !isFacilitator && (
          <span className="px-3 py-1 bg-delphi-keppel/10 text-delphi-keppel text-[8px] font-black uppercase tracking-widest rounded-lg border border-delphi-keppel/20">
            Modo Edición
          </span>
        )}
      </div>

      <div className="space-y-6">
        {canEstimate ? (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
              {renderEstimationInput()}
              {errors.value && <p id="value-error" role="alert" className="text-delphi-giants text-[10px] font-black uppercase tracking-tighter mt-3 ml-1">Error: {errors.value}</p>}
              {errors.justification && <p id="justification-error" role="alert" className="text-delphi-giants text-[10px] font-black uppercase tracking-tighter mt-3 ml-1">Error: {errors.justification}</p>}
            </div>
            
            <button
              type="button"
              onClick={onSubmitEstimate}
              disabled={!canSubmit()}
              className="w-full bg-delphi-keppel text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-delphi-keppel/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
            >
              {hasEstimation ? 'Guardar Cambios de Estimación' : 'Enviar Estimación Oficial'}
            </button>
            <p className="text-[9px] text-slate-400 text-center font-bold uppercase tracking-widest">
              {hasEstimation ? 'Puedes actualizar tu postura hasta que se cierre la ronda.' : 'Tu estimación será anónima durante la fase de votación.'}
            </p>
          </div>
        ) : isFacilitator ? (
          <div className="bg-slate-900/5 backdrop-blur-sm border-2 border-dashed border-slate-200 rounded-[2.5rem] p-8 text-center space-y-6 group-hover:border-delphi-keppel/30 transition-colors">
            <div className="flex justify-center">
              <div className="bg-delphi-keppel/10 p-6 rounded-[2rem] relative">
                <Users className="w-10 h-10 text-delphi-keppel" />
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-delphi-orange rounded-full border-4 border-white animate-ping" />
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-slate-900 font-black text-sm uppercase tracking-[0.2em]">Monitoreo de Participación</p>
              <p className="text-slate-500 text-xs font-semibold leading-relaxed max-w-[250px] mx-auto">
                <span className="text-delphi-keppel font-black text-lg">{currentRoundEstCount}</span> de <span className="text-slate-900 font-black text-lg">{totalExperts}</span> especialistas han participado.
              </p>
            </div>

            <div className="px-4">
              <div className="h-3 w-full bg-slate-200/50 rounded-full overflow-hidden border border-slate-100 p-0.5">
                 <div 
                   className="h-full bg-gradient-to-r from-delphi-keppel to-delphi-keppel/60 rounded-full transition-all duration-1000 shadow-sm" 
                   style={{ width: `${Math.min(100, (currentRoundEstCount / (totalExperts || 1)) * 100)}%` }}
                 />
              </div>
            </div>

            {Math.max(0, totalExperts - currentRoundEstCount) > 0 && (
              <button
                onClick={onSendReminder}
                className="flex items-center justify-center gap-3 w-full py-4 bg-white text-delphi-giants border-2 border-delphi-giants/10 hover:border-delphi-giants/40 hover:bg-delphi-giants/5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md active:scale-95"
              >
                <Bell className="w-4 h-4 animate-bounce" />
                Notificar a Expertos Faltantes
              </button>
            )}
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-100 rounded-3xl p-10 text-center space-y-4">
            <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-slate-500 text-sm font-black uppercase tracking-widest">
              Ronda Estacionaria
            </p>
            <p className="text-xs text-slate-400 font-medium">
              Esta ronda ya no acepta más participaciones. Por favor, aguarda el análisis del facilitador.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
