import React from 'react';
import { Task, Round, Project } from '../../../../types';
import { Activity, ChevronLeft, ChevronRight, CheckCircle2, Circle, Award, Plus, Settings } from 'lucide-react';

interface TaskSidebarProps {
  tasks: Task[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
  isSidebarCollapsed: boolean;
  onToggleCollapse: (collapsed: boolean) => void;
  onAddTaskClick: () => void;
  sprintIsLocked: boolean;
  sidebarWidth: number;
  roundsByTask: Record<string, Round[]>;
  project: Project;
  isFacilitator: boolean;
}

export const TaskSidebar: React.FC<TaskSidebarProps> = ({
  tasks,
  selectedTaskId,
  onSelectTask,
  isSidebarCollapsed,
  onToggleCollapse,
  onAddTaskClick,
  sprintIsLocked,
  sidebarWidth,
  roundsByTask,
  project,
  isFacilitator
}) => {
  const getTaskStatus = (task: Task) => {
    const taskRounds = roundsByTask[task.id] || [];
    const totalExperts = project?.expertIds?.length || 1;
    const maxRounds = project?.maxRounds || 3;
    const statusValue = (task.status || '').toLowerCase();

    if (statusValue === 'consensus' || statusValue === 'finalized') {
      return (
        <div className="flex items-center gap-2 text-delphi-keppel bg-delphi-keppel/10 w-fit px-4 py-1.5 rounded-xl ring-1 ring-delphi-keppel/20 shadow-sm shadow-delphi-keppel/5">
          <Award className="w-3.5 h-3.5" />
          <span className="text-[10px] font-black uppercase tracking-widest">
            {task.finalEstimate} {project.unit === 'hours' ? 'h' : project.unit === 'storyPoints' ? 'pts' : 'd'}
          </span>
        </div>
      );
    }

    if (statusValue === 'pending' || statusValue === 'pendiente') {
      return (
        <>
          <div className="h-2 w-full bg-slate-100/80 rounded-full overflow-hidden shadow-inner uppercase tracking-widest text-[10px] font-black">
            <div className="h-full bg-slate-200" style={{ width: '0%' }}></div>
          </div>
          <div className="flex justify-between items-center mt-2 px-1">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">PENDIENTE</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">0%</span>
          </div>
        </>
      );
    }

    const currentRound = taskRounds[taskRounds.length - 1];
    const currentRoundNumber = currentRound ? currentRound.roundNumber : 1;
    const expertsWhoEstimated = currentRound ? (currentRound.estimations?.filter(e => e.value > 0).length || 0) : 0;
    
    const completedRoundsProgress = ((currentRoundNumber - 1) / maxRounds) * 100;
    const currentRoundContribution = (expertsWhoEstimated / totalExperts) * (1 / maxRounds) * 100;
    const totalProgress = Math.min(99, Math.round(completedRoundsProgress + currentRoundContribution));

    return (
      <>
        <div className="h-2 w-full bg-slate-100/80 rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-delphi-keppel/40 to-delphi-keppel transition-all duration-1000 shadow-[2px_0_10px_rgba(43,186,165,0.3)]" 
            style={{ width: `${totalProgress}%` }}
          ></div>
        </div>
        <div className="flex justify-between items-center mt-2 px-1">
          <span className="text-[9px] font-black uppercase tracking-widest text-delphi-orange animate-pulse">
            ESTIMANDO
          </span>
          <span className="text-[9px] font-black text-delphi-keppel uppercase tracking-widest">
            {totalProgress}%
          </span>
        </div>
      </>
    );
  };

  return (
    <div 
      style={{ width: window.innerWidth >= 1024 ? (isSidebarCollapsed ? '96px' : `${sidebarWidth}px`) : '100%' }}
      className="lg:sticky lg:top-8 flex flex-col shrink-0 min-w-0 transition-all duration-500 ease-in-out"
    >
      <div className={`bg-white/70 backdrop-blur-3xl rounded-[2.5rem] border border-white shadow-[0_4px_24px_rgba(0,0,0,0.06)] flex flex-col h-full max-h-[85vh] ring-1 ring-slate-200/60 transition-all duration-500 ${isSidebarCollapsed ? 'p-4 items-center' : 'p-6 md:p-10'}`}>
        <div className={`flex items-start justify-between shrink-0 transition-all duration-500 ${isSidebarCollapsed ? 'flex-col gap-6 mb-6' : 'mb-8 border-b border-slate-100 pb-8'}`}>
          {!isSidebarCollapsed ? (
            <>
              <div className="space-y-4 w-full">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-black text-2xl tracking-tighter text-slate-900">Tareas</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                       Backlog del Sprint
                       <span className="bg-slate-100 px-2 py-0.5 rounded-lg text-slate-500">{tasks.length}</span>
                    </p>
                  </div>
                  <button 
                    onClick={() => onToggleCollapse(true)}
                    className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors group"
                    title="Minimizar panel"
                  >
                    <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                  </button>
                </div>

                {isFacilitator && (
                  <button
                    onClick={onAddTaskClick}
                    disabled={sprintIsLocked}
                    className={`gap-3 w-full rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border shadow-lg ${ sprintIsLocked ? 'bg-slate-50 text-slate-300 border-slate-100 shadow-none cursor-not-allowed' : 'bg-delphi-keppel text-white border-delphi-keppel shadow-delphi-keppel/20 hover:scale-[1.02] active:scale-95' } btn-base`}
                  >
                    <Plus className="w-4 h-4" />
                    Añadir Tarea
                  </button>
                )}
              </div>
            </>
          ) : (
            <button 
              onClick={() => onToggleCollapse(false)}
              className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-900/20 hover:scale-110 active:scale-95 transition-all"
              title="Expandir panel"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="space-y-4 overflow-y-auto no-scrollbar pb-6 grow pr-2">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-6 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200/50">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-sm">
                <Activity className="w-8 h-8 text-slate-200" />
              </div>
              <p className="text-slate-500 font-black text-sm uppercase tracking-wider">No hay tareas</p>
              {isFacilitator && (
                <p className="text-slate-400 text-[10px] mt-2 font-bold uppercase tracking-widest leading-relaxed">Usa el botón "Añadir Tarea" para comenzar el proceso.</p>
              )}
            </div>
          ) : (
            tasks.map(task => (
              <button
                key={task.id}
                onClick={() => onSelectTask(task.id)}
                className={`w-full text-left p-5 md:p-6 rounded-[2rem] border transition-all duration-500 relative overflow-hidden group hover:scale-[1.02] active:scale-[0.98] ${selectedTaskId === task.id
                  ? 'border-delphi-keppel bg-white shadow-xl shadow-delphi-keppel/10 ring-1 ring-delphi-keppel/20'
                  : 'border-slate-100 bg-white/60 hover:bg-white hover:border-slate-200 hover:shadow-lg hover:shadow-slate-200/40'
                  }`}
              >
                {selectedTaskId === task.id && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-16 bg-delphi-keppel rounded-r-full shadow-[2px_0_10px_rgba(43,186,165,0.4)]" />
                )}
                <div className={`flex items-start gap-5 transition-all duration-500 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                  <div className={`shrink-0 mt-1 transition-all duration-500 ${selectedTaskId === task.id ? 'text-delphi-keppel scale-110' : 'text-slate-300 group-hover:text-slate-400'}`}>
                    {(task.status?.toLowerCase() === 'consensus' || task.status?.toLowerCase() === 'finalized') 
                      ? <CheckCircle2 className="w-7 h-7" /> 
                      : <Circle className="w-7 h-7" />}
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="flex-1 min-w-0 pr-2">
                      <h4 className={`text-sm md:text-base font-black leading-tight mb-3 transition-colors ${selectedTaskId === task.id ? 'text-slate-900' : 'text-slate-600'}`}>
                        {task.title}
                      </h4>
                      {getTaskStatus(task)}
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
