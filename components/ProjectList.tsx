
import React from 'react';
import { Project } from '../types';
import { ChevronRight, Calendar, Users, Target } from 'lucide-react';
import { EmptyState } from './ui/EmptyState';

interface ProjectListProps {
  projects?: Project[];
  onProjectSelect: (id: string) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ projects = [], onProjectSelect }) => {
  return (
    <div className="grid grid-cols-1 gap-6">
      {projects.length === 0 ? (
        <EmptyState 
          icon={<Target className="w-12 h-12" />}
          title="No hay proyectos"
          description="Aún no se han registrado proyectos en el sistema."
        />
      ) : projects.map((project) => (
        <button 
          key={project.id}
          onClick={() => onProjectSelect(project.id)}
          aria-label={`Ver detalles del proyecto ${project.name}`}
          className="group flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 rounded-3xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all cursor-pointer w-full text-left focus:outline-none focus:ring-2 focus:ring-delphi-keppel/50"
        >
          <div className="w-16 h-16 bg-white rounded-2xl border-2 border-slate-100 flex items-center justify-center text-delphi-keppel shadow-sm group-hover:border-delphi-keppel/30 group-hover:bg-delphi-keppel/5 transition-all shrink-0">
            <Target className="w-8 h-8" />
          </div>
          <div className="flex-1 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-1">
              <h4 className="font-black text-slate-900 group-hover:text-delphi-keppel transition-colors text-lg">{project.name}</h4>
              <span className={`w-fit text-[10px] uppercase tracking-widest font-black px-3 py-1 rounded-full ${project.status === 'active' ? 'bg-delphi-celadon/20 text-delphi-keppel border border-delphi-keppel/20' : project.status === 'kickoff' ? 'bg-delphi-orange/20 text-delphi-giants border border-delphi-giants/20' : 'bg-slate-200 text-slate-600 border border-slate-300'}`}>
                {project.status === 'preparation' ? 'Preparación' : project.status === 'kickoff' ? 'Kickoff' : project.status === 'active' ? 'Activo' : project.status === 'finished' ? 'Finalizado' : project.status}
              </span>
            </div>
            <p className="text-sm text-slate-500 line-clamp-2 sm:line-clamp-1 mb-3">{project.description}</p>
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-1">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-delphi-keppel" />
                {new Date(project.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </span>
              <span className="text-xs font-bold text-slate-400 flex items-center gap-2">
                <Users className="w-4 h-4 text-delphi-orange" />
                {project.expertIds.length} expertos
              </span>
            </div>
          </div>
          <div className="hidden sm:block bg-slate-100 p-2 rounded-xl text-slate-400 group-hover:bg-delphi-keppel group-hover:text-white transition-all">
            <ChevronRight className="w-5 h-5" />
          </div>
        </button>
      ))}
    </div>
  );
};

export default ProjectList;
