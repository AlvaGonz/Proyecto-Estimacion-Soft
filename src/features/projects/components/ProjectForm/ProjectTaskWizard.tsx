import React from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, ListChecks } from 'lucide-react';
import { WizardTask } from './useProjectForm';

interface ProjectTaskWizardProps {
  tasks: WizardTask[];
  addTask: () => void;
  removeTask: (id: string) => void;
  updateTask: (id: string, field: 'title' | 'description', value: string) => void;
  moveTask: (index: number, direction: 'up' | 'down') => void;
}

export const ProjectTaskWizard: React.FC<ProjectTaskWizardProps> = ({
  tasks, addTask, removeTask, updateTask, moveTask
}) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex justify-between items-center bg-slate-900 text-white rounded-[2.5rem] p-8 md:px-12 md:py-10 shadow-2xl shadow-slate-900/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-delphi-keppel/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
        <div className="relative z-10 flex items-center gap-6">
           <div className="w-16 h-16 bg-delphi-keppel/20 rounded-[1.5rem] flex items-center justify-center border border-delphi-keppel/20">
              <ListChecks className="w-8 h-8 text-delphi-keppel" />
           </div>
           <div>
             <h3 className="text-2xl font-black mb-1 leading-none tracking-tight">Definición de Tareas</h3>
             <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">{tasks.length} {tasks.length === 1 ? 'Elemento' : 'Elementos'} Identificados</p>
           </div>
        </div>
        <button
          type="button"
          onClick={addTask}
          className="relative z-10 hidden sm:flex gap-3 bg-delphi-keppel text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-delphi-keppel/90 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-delphi-keppel/20 btn-base"
        >
          <Plus className="w-4 h-4" />
          Nueva Tarea
        </button>
      </div>

      <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {tasks.map((task, idx) => (
          <div 
            key={task.id} 
            className="group flex flex-col md:flex-row gap-6 p-6 md:p-8 bg-white border-2 border-slate-100 rounded-[2.5rem] hover:border-delphi-keppel/30 transition-all duration-300 relative shadow-sm hover:shadow-xl hover:shadow-slate-200/40 animate-in slide-in-from-bottom-4 duration-500"
          >
            {/* Index Counter */}
            <div className="flex flex-row md:flex-col items-center justify-between md:justify-start gap-4">
               <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center font-black text-xs border border-slate-100 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all">
                 {idx + 1}
               </div>
               <div className="flex md:flex-col gap-2">
                 <button type="button" onClick={() => moveTask(idx, 'up')} disabled={idx === 0} className="p-2 rounded-lg text-slate-300 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-0 transition-all"><ChevronUp className="w-4 h-4" /></button>
                 <button type="button" onClick={() => moveTask(idx, 'down')} disabled={idx === tasks.length - 1} className="p-2 rounded-lg text-slate-300 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-0 transition-all"><ChevronDown className="w-4 h-4" /></button>
               </div>
            </div>

            {/* Form Fields */}
            <div className="flex-1 space-y-5">
              <input
                type="text"
                value={task.title}
                onChange={(e) => updateTask(task.id, 'title', e.target.value)}
                placeholder="Título de la tarea o hito"
                className="w-full bg-transparent border-none p-0 text-xl md:text-2xl font-black tracking-tight text-slate-900 placeholder:text-slate-300 focus:ring-0"
              />
              <textarea
                value={task.description}
                onChange={(e) => updateTask(task.id, 'description', e.target.value)}
                placeholder="Detalle técnico adicional (opcional)..."
                rows={2}
                className="w-full bg-slate-50/50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-600 placeholder:text-slate-300 focus:ring-1 focus:ring-delphi-keppel/20 transition-all resize-none"
              />
            </div>

            {/* Remove Action */}
            <div className="md:self-start">
               <button
                type="button"
                onClick={() => removeTask(task.id)}
                className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all duration-300 shadow-sm"
               >
                 <Trash2 className="w-5 h-5" />
               </button>
            </div>
          </div>
        ))}
        
        <button
          type="button"
          onClick={addTask}
          className="w-full border-2 border-dashed border-slate-200 rounded-[2.5rem] text-slate-400 font-black text-xs uppercase tracking-[0.25em] flex-col gap-3 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-600 transition-all group btn-base"
        >
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
             <Plus className="w-5 h-5" />
          </div>
          Añadir Nuevo Elemento de Estimación
        </button>
      </div>
    </div>
  );
};
