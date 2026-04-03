import React from 'react';
import { Settings, X } from 'lucide-react';
import { UserRole } from '../../../../types';

interface ProjectActionButtonsProps {
  isFacilitator: boolean;
  role: UserRole;
  projectStatus: string;
  sprintIsLocked: boolean;
  onConfigClick: () => void;
  onDeleteClick: () => void;
}

export const ProjectActionButtons: React.FC<ProjectActionButtonsProps> = ({
  isFacilitator,
  role,
  projectStatus,
  sprintIsLocked,
  onConfigClick,
  onDeleteClick
}) => {
  if (!isFacilitator || projectStatus?.toLowerCase() === 'finished') return null;

  return (
    <div className="flex items-center gap-3">
      <button 
        onClick={onConfigClick}
        className="group p-4 bg-white/40 backdrop-blur-md border border-slate-200 rounded-2xl text-slate-500 hover:text-delphi-keppel hover:border-delphi-keppel/50 hover:bg-white transition-all shadow-sm active:scale-95"
        title="Configurar Proyecto"
      >
        <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
      </button>
      
      {role === UserRole.ADMIN && (
        <button
          onClick={onDeleteClick}
          className="group p-4 bg-white/40 backdrop-blur-md border border-slate-200 rounded-2xl text-slate-400 hover:text-red-500 hover:border-red-500/50 hover:bg-red-50 transition-all shadow-sm active:scale-95"
          title="Eliminar Proyecto"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};
