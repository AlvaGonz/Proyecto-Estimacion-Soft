import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface CloseRoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  roundNumber: number;
  missingExperts: number;
}

export const CloseRoundModal: React.FC<CloseRoundModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  roundNumber,
  missingExperts
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-300 space-y-6">
        <div className="flex items-center gap-4">
          <div className="bg-delphi-giants/10 p-4 rounded-2xl shrink-0">
            <ShieldAlert className="w-8 h-8 text-delphi-giants" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">¿Cerrar ronda incompleta?</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Ronda {roundNumber} — {missingExperts} experto(s) aún no han enviado su estimación.
            </p>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-xs font-bold text-amber-700 leading-relaxed">
            ⚠️ Cerrar la ronda ahora eliminará la posibilidad de que los expertos restantes participen. El análisis de convergencia podría ser menos preciso.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-delphi-giants text-white font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg"
          >
            Cerrar de Todas Formas
          </button>
        </div>
      </div>
    </div>
  );
};
