
import React from 'react';
import { Project } from '../types';
import { ChevronRight, Calendar, Users, Target } from 'lucide-react';
import { EmptyState } from './ui/EmptyState';

interface ProjectListProps {
  projects?: Project[];
  onProjectSelect: (id: string) => void;
}
 
const STATUS_LABELS = {
  'preparation': 'Preparación',
  'kickoff': 'Kickoff',
  'active': 'Activo',
  'finished': 'Finalizado',
  'archived': 'Archivado'
} as const;

const ProjectList: React.FC<ProjectListProps> = ({ projects = [], onProjectSelect }) => {
  return (
    <div className="grid grid-cols-1 gap-8 animate-reveal">
      {projects.length === 0 ? (
        <EmptyState 
          icon={<Target className="w-16 h-16 text-slate-300" />}
          title="No hay proyectos"
          description="Aún no se han registrado proyectos en el sistema. Comienza creando uno nuevo."
        />
      ) : projects.map((project, index) => (
        <button 
          key={project.id}
          onClick={() => onProjectSelect(project.id)}
          style={{ animationDelay: `${index * 100}ms` }}
          className="group flex flex-col md:flex-row items-center gap-8 p-8 rounded-[2.5rem] glass-card hover:bg-white hover:shadow-2xl hover:shadow-delphi-keppel/10 hover:translate-x-2 transition-all duration-500 w-full text-left focus:outline-none focus:ring-4 focus:ring-delphi-keppel/10 animate-reveal"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-white to-slate-50 rounded-[1.5rem] border border-slate-100 flex items-center justify-center text-delphi-keppel shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shrink-0">
            <Target className="w-10 h-10" />
          </div>
          
          <div className="flex-1 w-full space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h4 className="font-black text-slate-900 group-hover:text-delphi-keppel transition-colors text-xl tracking-tight">
                {project.name}
              </h4>
              <span className={`w-fit text-[10px] uppercase tracking-[0.2em] font-black px-4 py-1.5 rounded-full border shadow-sm ${
                project.status === 'active' ? 'bg-delphi-keppel/10 text-delphi-keppel border-delphi-keppel/20' : 
                project.status === 'kickoff' ? 'bg-delphi-orange/10 text-delphi-orange border-delphi-orange/20' : 
                project.status === 'finished' ? 'bg-delphi-celadon/20 text-delphi-keppel border-delphi-celadon/30' :
                project.status === 'preparation' ? 'bg-slate-100 text-slate-500 border-slate-200' :
                'bg-slate-900 text-white border-slate-800'}`}>
                {STATUS_LABELS[project.status as keyof typeof STATUS_LABELS] || project.status}
              </span>
            </div>
            
            <p className="text-slate-500 font-medium line-clamp-2 md:line-clamp-1 text-sm leading-relaxed max-w-2xl">
              {project.description}
            </p>
            
            <div className="flex flex-wrap items-center gap-6 pt-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100">
                <Calendar className="w-4 h-4 text-delphi-keppel" />
                <span className="text-xs font-bold text-slate-600">
                  {new Date(project.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100">
                <Users className="w-4 h-4 text-delphi-orange" />
                <span className="text-xs font-bold text-slate-600">
                  {project.expertIds.length} Expertos
                </span>
              </div>
            </div>
          </div>
          
          <div className="hidden md:flex bg-slate-50 p-3 rounded-2xl text-slate-300 group-hover:bg-delphi-keppel group-hover:text-white group-hover:shadow-lg group-hover:shadow-delphi-keppel/30 transition-all duration-500">
            <ChevronRight className="w-6 h-6" />
          </div>
        </button>
      ))}
    </div>
  );
};

export default ProjectList;
