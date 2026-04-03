import React from 'react';
import { Project, UserRole } from '../../../../types';
import { FileText, Users, History } from 'lucide-react';

interface ProjectDetailHeaderProps {
  project: Project;
  sprintIsLocked: boolean;
}

export const ProjectDetailHeader: React.FC<ProjectDetailHeaderProps> = ({ project, sprintIsLocked }) => {
  const getStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'preparation': return 'Preparación';
      case 'kickoff': return 'Kickoff';
      case 'active': return 'Activo';
      case 'finished': return 'Finalizado';
      default: return status;
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-delphi-celadon/20 text-delphi-keppel border-delphi-keppel/20 shadow-delphi-keppel/5';
      case 'finished': return 'bg-delphi-keppel text-white border-white/20 shadow-delphi-keppel/20';
      case 'kickoff': return 'bg-delphi-orange text-white border-white/20 shadow-delphi-orange/20';
      case 'preparation': return 'bg-slate-200/50 text-slate-600 border-slate-300/30';
      default: return 'bg-slate-100 text-slate-400';
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-10">
      <div className="space-y-4">
        <div className="flex items-center gap-4 md:gap-6 flex-wrap">
          <h2 className="font-black text-slate-900 tracking-tight leading-none italic uppercase" style={{ fontSize: 'clamp(1.5rem, 4vw + 0.5rem, 3.75rem)' }}>
            {project.name}
          </h2>
          <span className={`px-5 md:px-7 py-2.5 rounded-full text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] shadow-xl backdrop-blur-md border animate-reveal ${getStatusStyles(project.status)}`}>
            {getStatusLabel(project.status)}
          </span>
        </div>
        <div className="flex items-center gap-6 md:gap-10 flex-wrap">
          <div className="text-slate-500 font-bold text-xs md:text-sm uppercase tracking-widest flex items-center gap-3">
            <div className="p-2 bg-delphi-keppel/10 rounded-lg"><FileText className="w-4 h-4 text-delphi-keppel" /></div>
            Unidad: <span className="text-slate-900">{
              project.unit === 'hours' ? 'Horas' : 
              project.unit === 'storyPoints' ? 'Puntos de Historia' : 
              project.unit === 'personDays' ? 'Días Persona' : 
              project.unit
            }</span>
          </div>
          <div className="hidden sm:block h-6 w-px bg-slate-200" />
          <div className="text-slate-500 font-bold text-xs md:text-sm uppercase tracking-widest flex items-center gap-3">
            <div className="p-2 bg-delphi-orange/10 rounded-lg"><Users className="w-4 h-4 text-delphi-orange" /></div>
            <span className="text-slate-900">{project.expertIds?.length || 0}</span> Expertos
          </div>
          {sprintIsLocked && (
            <>
              <div className="hidden sm:block h-6 w-px bg-slate-200" />
              <p className="text-delphi-giants font-black text-xs md:text-sm uppercase tracking-widest flex items-center gap-3 bg-delphi-giants/10 px-4 py-2 rounded-full animate-pulse border border-delphi-giants/20 shadow-lg shadow-delphi-giants/5">
                <History className="w-5 h-5" />
                🔒 Sprint bloqueado
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
