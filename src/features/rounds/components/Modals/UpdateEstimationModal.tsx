import React from 'react';
import { Target } from 'lucide-react';

interface UpdateEstimationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const UpdateEstimationModal: React.FC<UpdateEstimationModalProps> = ({
  isOpen,
  onClose,
  onConfirm
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-300 space-y-6">
        <div className="flex items-center gap-4">
          <div className="bg-delphi-keppel/10 p-4 rounded-2xl shrink-0">
            <Target className="w-8 h-8 text-delphi-keppel" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">Actualizar Estimación</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              ¿Estás seguro de que deseas actualizar tu estimación para esta ronda?
            </p>
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <p className="text-xs font-bold text-slate-700 leading-relaxed">
            Tu estimación anterior será reemplazada por los nuevos valores proporcionados. El análisis de convergencia se recalculará automáticamente.
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
            className="flex-1 py-3 rounded-xl bg-delphi-keppel text-white font-black text-xs uppercase tracking-widest hover:scale-[1.02] shadow-lg shadow-delphi-keppel/20 transition-all"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};
