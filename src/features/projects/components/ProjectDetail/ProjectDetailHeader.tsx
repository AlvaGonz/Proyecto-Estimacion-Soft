import React from 'react';
import { Project, UserRole } from '../../../../types';
import { FileText, Users, History, CheckCircle2 } from 'lucide-react';

interface ProjectDetailHeaderProps {
  project: Project;
  sprintIsLocked: boolean;
  isFacilitator: boolean;
  onFinalizeClick: () => void;
}

export const ProjectDetailHeader: React.FC<ProjectDetailHeaderProps> = ({ 
  project, 
  sprintIsLocked,
  isFacilitator,
  onFinalizeClick
}) => {
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
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="space-y-4">
        <div className="flex items-start gap-4 md:gap-6 flex-wrap">
          <h1 className="font-black text-slate-900 tracking-tight leading-[0.9] italic uppercase" style={{ fontSize: 'clamp(2rem, 5vw + 1rem, 4.5rem)' }}>
            {project.name}
          </h1>
          <div className="pt-2">
            <span className={`px-5 md:px-7 py-2.5 rounded-full text-[10px] md:text-[12px] font-black uppercase tracking-[0.2em] shadow-xl backdrop-blur-md border animate-reveal inline-flex items-center gap-2 ${getStatusStyles(project.status)}`}>
              <div className={`w-2 h-2 rounded-full animate-pulse ${project.status === 'active' ? 'bg-delphi-keppel' : 'bg-white'}`} />
              {getStatusLabel(project.status)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-8 flex-wrap">
          <div className="group flex items-center gap-4 bg-white/40 hover:bg-white/60 p-1.5 pr-4 rounded-2xl border border-slate-200/50 transition-all cursor-default shadow-sm">
            <div className="p-3 bg-delphi-keppel/10 rounded-xl group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5 text-delphi-keppel" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Unidad de Medida</span>
              <span className="text-sm font-bold text-slate-900 uppercase tracking-wider">{
                project.unit === 'hours' ? 'Horas' : 
                project.unit === 'storyPoints' ? 'Puntos de Historia' : 
                project.unit === 'personDays' ? 'Días Persona' : 
                project.unit
              }</span>
            </div>
          </div>

          <div className="group flex items-center gap-4 bg-white/40 hover:bg-white/60 p-1.5 pr-4 rounded-2xl border border-slate-200/50 transition-all cursor-default shadow-sm">
            <div className="p-3 bg-delphi-orange/10 rounded-xl group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5 text-delphi-orange" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Equipo Técnico</span>
              <span className="text-sm font-bold text-slate-900 uppercase tracking-wider">{project.expertIds?.length || 0} Expertos</span>
            </div>
          </div>

          {isFacilitator && project.status?.toLowerCase() !== 'finished' && (
            <button
              onClick={onFinalizeClick}
              className="group flex items-center gap-4 bg-slate-900 hover:bg-delphi-giants p-1.5 pr-6 rounded-2xl border border-slate-800 transition-all cursor-pointer shadow-xl shadow-slate-900/10 active:scale-95"
            >
              <div className="p-3 bg-white/10 rounded-xl group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-black text-white/50 uppercase tracking-widest leading-none text-left">Acción Final</span>
                <span className="text-sm font-black text-white uppercase tracking-widest leading-tight">Finalizar Proyecto</span>
              </div>
            </button>
          )}

          {sprintIsLocked && (
            <div className="group flex items-center gap-4 bg-delphi-giants/5 p-1.5 pr-4 rounded-2xl border border-delphi-giants/20 transition-all cursor-default animate-pulse ml-0 md:ml-auto">
              <div className="p-3 bg-delphi-giants/10 rounded-xl">
                <History className="w-5 h-5 text-delphi-giants" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-delphi-giants/60 uppercase tracking-widest leading-none">Estado de Sprint</span>
                <span className="text-sm font-bold text-delphi-giants uppercase tracking-wider">🔒 En Estimación</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
