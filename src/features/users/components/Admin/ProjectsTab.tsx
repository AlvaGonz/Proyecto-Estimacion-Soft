
import React from 'react';
import { 
  FolderArchive, 
  Trash2, 
  RotateCcw, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';
import { LoadingSpinner } from '../../../../shared/components/LoadingSpinner';

interface ProjectsTabProps {
  projects: any[];
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  onRestoreProject: (id: string, name: string) => void;
  onDeleteProject: (id: string, project: any) => void;
}

export const ProjectsTab: React.FC<ProjectsTabProps> = ({
  projects,
  isLoading,
  error,
  successMessage,
  onRestoreProject,
  onDeleteProject
}) => {
  return (
    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
        <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
          <FolderArchive className="w-5 h-5 text-delphi-giants" />
          Gestión de Proyectos
        </h3>
      </div>

      {successMessage && (
        <div className="mx-8 mt-6 flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-sm font-bold animate-in fade-in slide-in-from-top-2">
          <ShieldCheck className="w-4 h-4 flex-shrink-0" />
          {successMessage}
        </div>
      )}

      {error && (
        <div className="mx-8 mt-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-bold">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="overflow-x-auto min-h-[300px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full py-20">
            <LoadingSpinner size="lg" label="Cargando proyectos..." />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-4">
            <FolderArchive className="w-12 h-12 opacity-30" />
            <p className="font-black">No hay proyectos registrados</p>
          </div>
        ) : (
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500">
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest">Proyecto</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest">Facilitador</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest">Estado</th>
                <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.map(project => {
                const projectId = project.id || project._id;
                return (
                  <tr key={projectId} className={`hover:bg-slate-50 transition-colors group ${project.isDeleted ? 'bg-red-50/30' : ''}`}>
                    <td className="px-8 py-6">
                      <div>
                        <p className="font-black text-slate-900">{project.name}</p>
                        <p className="text-xs text-slate-400 font-bold line-clamp-1">{project.description}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-700">{project.facilitatorId?.name}</span>
                        <span className="text-[10px] text-slate-400 font-bold">{project.facilitatorId?.email}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        {project.isDeleted ? (
                          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-widest rounded-lg border border-red-200">
                            <Trash2 className="w-3 h-3" /> Eliminado
                          </span>
                        ) : (
                          <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border ${
                            project.status === 'archived' 
                              ? 'bg-slate-100 text-slate-500 border-slate-200' 
                              : 'bg-delphi-keppel/10 text-delphi-keppel border-delphi-keppel/20'
                          }`}>
                            {project.status}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {project.isDeleted ? (
                          <button
                            aria-label={`Restaurar ${project.name}`}
                            title="Restaurar proyecto"
                            onClick={() => onRestoreProject(projectId, project.name)}
                            className="p-2.5 rounded-xl bg-delphi-keppel text-white hover:scale-105 transition-all shadow-lg shadow-delphi-keppel/20"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            aria-label={`Eliminar ${project.name}`}
                            title="Eliminar proyecto"
                            onClick={() => onDeleteProject(projectId, project)}
                            className="p-2.5 rounded-xl bg-red-600 text-white hover:scale-105 transition-all shadow-lg shadow-red-600/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
