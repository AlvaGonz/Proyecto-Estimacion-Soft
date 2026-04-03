import React from 'react';
import { Settings, Plus, CheckCircle2, X } from 'lucide-react';
import { UserRole } from '../../../../types';

interface ProjectActionButtonsProps {
  isFacilitator: boolean;
  role: UserRole;
  projectStatus: string;
  sprintIsLocked: boolean;
  onConfigClick: () => void;
  onAddTaskClick: () => void;
  onFinalizeClick: () => void;
  onDeleteClick: () => void;
}

export const ProjectActionButtons: React.FC<ProjectActionButtonsProps> = ({
  isFacilitator,
  role,
  projectStatus,
  sprintIsLocked,
  onConfigClick,
  onAddTaskClick,
  onFinalizeClick,
  onDeleteClick
}) => {
  if (!isFacilitator || projectStatus?.toLowerCase() === 'finished') return null;

  return (
    <div className="flex flex-wrap gap-3">
      <button 
        onClick={onConfigClick}
        className="group flex items-center justify-center gap-3 px-6 py-4 bg-white/50 backdrop-blur-md border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-white hover:border-delphi-keppel/50 transition-all shadow-sm active:scale-95 flex-1 sm:flex-none min-w-[160px]"
      >
        <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform" />
        Configurar
      </button>
      <button
        onClick={onAddTaskClick}
        disabled={sprintIsLocked}
        title={sprintIsLocked ? "No se pueden añadir tareas una vez iniciada la estimación" : ""}
        className={`flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl transition-all border flex-1 sm:flex-none min-w-[160px] ${
          sprintIsLocked 
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200 shadow-none' 
            : 'bg-delphi-keppel text-white border-delphi-keppel shadow-delphi-keppel/30 hover:scale-[1.02] active:scale-95'
        }`}
      >
        <Plus className="w-4 h-4" />
        Añadir Tarea
      </button>
      <button
        onClick={onFinalizeClick}
        className="flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-delphi-giants transition-all active:scale-95 w-full sm:w-auto flex-1 sm:flex-none min-w-[160px] md:ml-auto"
      >
        <CheckCircle2 className="w-4 h-4" />
        Finalizar Proyecto
      </button>
      {role === UserRole.ADMIN && (
        <button
          onClick={onDeleteClick}
          className="flex items-center justify-center gap-3 px-8 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-600/20 hover:bg-red-700 transition-all active:scale-95 flex-1 sm:flex-none min-w-[160px]"
        >
          <X className="w-4 h-4" />
          Eliminar Proyecto
        </button>
      )}
    </div>
  );
};
