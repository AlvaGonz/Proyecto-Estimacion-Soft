import React from 'react';
import { 
  ArrowLeft, 
  FileText, 
  MessageSquare, 
  Users, 
  History, 
  ChevronLeft, 
  Star,
  GripVertical,
  CheckCircle2
} from 'lucide-react';
import { UserRole } from '../../../types';
import EstimationRounds from '../../rounds/components/EstimationRounds';
import DiscussionSpace from '../../discussion/components/DiscussionSpace';
import TeamPanel from '../../users/components/TeamPanel';
import Documentation from '../../../shared/components/Documentation';
import ProjectAuditLog from '../../audit-log/components/ProjectAuditLog';
import { useProjectDetail } from '../hooks/useProjectDetail';
import { ProjectDetailHeader } from './ProjectDetail/ProjectDetailHeader';
import { ProjectActionButtons } from './ProjectDetail/ProjectActionButtons';
import { TaskSidebar } from './ProjectDetail/TaskSidebar';
import { ProjectModals } from './ProjectDetail/ProjectModals';

interface ProjectDetailProps {
  projectId: string;
  onBack: () => void;
  role: UserRole;
  currentUserId: string;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ projectId, onBack, role, currentUserId }) => {
  const {
    state,
    updateState,
    containerRef,
    isFacilitator,
    startResizing,
    handleSaveConfig,
    handleAddTask,
    handleTaskConsensus,
    handleTaskFinalize,
    handleFinalizeProject,
    handleDeleteProject
  } = useProjectDetail(projectId, role, currentUserId, onBack);

  const {
    activeTab,
    project,
    tasks,
    selectedTaskId,
    showTaskForm,
    showConfigModal,
    newTaskTitle,
    newTaskDesc,
    isLoading,
    activeRound,
    logs,
    showFinalizeModal,
    isFinalizing,
    showDeleteModal,
    isDeleting,
    sprintIsLocked,
    roundsByTask,
    sidebarWidth,
    isSidebarCollapsed,
    isResizing,
    configForm,
    isSavingConfig,
    configError
  } = state;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8 animate-in fade-in duration-1000">
        <div className="relative">
          <div className="w-24 h-24 border-8 border-slate-100 border-t-delphi-keppel rounded-full animate-spin shadow-xl shadow-delphi-keppel/10" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 bg-delphi-orange rounded-full animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-sm font-black text-slate-800 uppercase tracking-[0.3em] animate-pulse">Sincronizando Entorno</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cifrando túnel de datos Delphi...</p>
        </div>
      </div>
    );
  }

  if (!project) return null;

  const currentTask = tasks.find(t => t.id === selectedTaskId);

  return (
    <div className="max-w-[1920px] mx-auto px-4 md:px-8 lg:px-12 py-8 md:py-12" ref={containerRef}>
      <div className="space-y-12 md:space-y-20">
        
        {/* Breadcrumbs & Navigation */}
        <nav className="flex items-center gap-6 animate-in slide-in-from-left-8 duration-700 ease-out">
          <button 
            onClick={onBack}
            className="group p-4 bg-white/40 backdrop-blur-xl border border-slate-200 rounded-[1.5rem] shadow-sm hover:bg-slate-900 transition-all active:scale-90"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" />
          </button>
          <div className="flex items-center gap-4 text-[10px] md:text-xs font-black uppercase tracking-[0.2em]">
            <span className="text-slate-400">Proyectos</span>
            <ChevronLeft className="w-3 h-3 text-slate-300 rotate-180" />
            <span className="text-delphi-keppel drop-shadow-sm">{project.name}</span>
          </div>
        </nav>

        {/* Header Seccion */}
        <header className="flex flex-col lg:flex-row lg:items-start justify-between gap-10 animate-in fade-in slide-in-from-top-8 duration-1000">
          <ProjectDetailHeader 
            project={project} 
            sprintIsLocked={sprintIsLocked} 
            isFacilitator={isFacilitator}
            onFinalizeClick={() => updateState({ showFinalizeModal: true })}
          />
          <div className="flex-shrink-0">
            <ProjectActionButtons 
              isFacilitator={isFacilitator}
              role={role}
              projectStatus={project.status}
              sprintIsLocked={sprintIsLocked}
              onConfigClick={() => updateState({ showConfigModal: true })}
              onDeleteClick={() => updateState({ showDeleteModal: true })}
            />
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="relative animate-in fade-in duration-1000 delay-300">
          <div className="flex p-1.5 bg-slate-100/80 backdrop-blur-xl rounded-[2rem] w-full lg:w-fit border border-slate-200/60 shadow-inner overflow-x-auto no-scrollbar">
            {[
              { id: 'tasks', label: 'Proceso Estimación', icon: FileText },
              { id: 'docs', label: 'Especificaciones', icon: CheckCircle2 },
              { id: 'discussion', label: 'Sala de Debate', icon: MessageSquare },
              { id: 'team', label: 'Panel de Expertos', icon: Users },
              { id: 'audit', label: 'Trazabilidad', icon: History }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => updateState({ activeTab: tab.id as any })}
                className={`flex items-center gap-3 px-5 md:px-8 py-3.5 rounded-[1.75rem] text-[10px] md:text-[11px] font-black uppercase tracking-[0.1em] transition-all whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-white text-slate-900 shadow-[0_8px_20px_rgba(0,0,0,0.06)] scale-[1.02] ring-1 ring-slate-900/5' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-delphi-keppel' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
          {activeTab === 'tasks' && (
            <div className="lg:col-span-12 flex flex-col lg:flex-row gap-8 items-start min-h-[70vh]">
              {/* Task Sidebar */}
              <TaskSidebar 
                tasks={tasks}
                selectedTaskId={selectedTaskId}
                onSelectTask={(id) => updateState({ selectedTaskId: id })}
                isSidebarCollapsed={isSidebarCollapsed}
                onToggleCollapse={(coll) => updateState({ isSidebarCollapsed: coll })}
                onAddTaskClick={() => updateState({ showTaskForm: true })}
                sprintIsLocked={sprintIsLocked}
                sidebarWidth={sidebarWidth}
                roundsByTask={roundsByTask}
                project={project}
                isFacilitator={isFacilitator}
              />

              {/* Resize Handle */}
              <div 
                onMouseDown={startResizing}
                className="hidden lg:flex w-2 relative self-stretch cursor-col-resize group items-center justify-center z-20"
              >
                <div className={`w-1 h-32 rounded-full transition-all duration-300 ${isResizing ? 'bg-delphi-keppel scale-x-125' : 'bg-slate-200 group-hover:bg-delphi-keppel'}`} />
              </div>

              {/* Main Content Area */}
              <div className="flex-1 min-w-0 lg:pl-12">
                <div className="space-y-10 min-h-[500px] bg-white/40 backdrop-blur-3xl rounded-[3.5rem] p-4 md:p-8 border border-white/40 shadow-inner overflow-hidden">
                  {currentTask ? (
                    <div className="animate-in fade-in slide-in-from-right-12 duration-700 ease-out">
                      <EstimationRounds
                        taskId={currentTask.id}
                        taskTitle={currentTask.title}
                        unit={project.unit || "hours"}
                        estimationMethod={project.estimationMethod}
                        onConsensusReached={handleTaskConsensus}
                        onTaskFinalize={handleTaskFinalize}
                        isFacilitator={isFacilitator}
                        projectId={project.id}
                        currentUserId={currentUserId}
                        expertIds={project.expertIds || []}
                      />
                    </div>
                  ) : (
                    <div className="h-full min-h-[70vh] bg-white/50 backdrop-blur-3xl rounded-[3.5rem] border-2 border-dashed border-slate-200/60 flex flex-col items-center justify-center text-slate-400 gap-10 shadow-[0_32px_100px_-20px_rgba(0,0,0,0.05)] relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-50/30 to-transparent pointer-events-none" />
                      <div className="relative">
                        <div className="absolute inset-0 bg-delphi-keppel/20 blur-[100px] rounded-full scale-150 animate-pulse transition-all duration-1000 group-hover:scale-[2]" />
                        <div className="bg-white p-5 md:p-10 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl shadow-slate-200/50 relative z-10 transition-all duration-500 group-hover:-translate-y-2">
                          <Star className="w-16 h-16 md:w-20 md:h-20 text-slate-200 group-hover:text-delphi-keppel transition-colors duration-500" />
                        </div>
                      </div>
                      <div className="text-center space-y-3 relative z-10 px-6">
                        <h3 className="font-black text-3xl md:text-4xl tracking-tighter text-slate-900">Selecciona una tarea</h3>
                        <p className="font-bold text-slate-500 text-sm md:text-base max-w-md mx-auto leading-relaxed">
                          Elige una tarea de la lista lateral para iniciar el proceso de <span className="text-delphi-keppel">debate y estimación técnica</span>.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab !== 'tasks' && (
            <div role="tabpanel" className="lg:col-span-12 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[60vh] bg-white/30 backdrop-blur-3xl rounded-[3.5rem] border border-white/40 shadow-sm p-6 md:p-10">
              {activeTab === 'docs' && <Documentation projectId={projectId} role={role} />}
              {activeTab === 'discussion' && activeRound ? (
                <DiscussionSpace roundId={activeRound.id} />
              ) : activeTab === 'discussion' ? (
                <div className="h-[60vh] bg-white rounded-[3rem] border border-slate-100 flex flex-col items-center justify-center text-slate-400 gap-6 shadow-sm">
                  <div className="bg-slate-50 p-8 rounded-full">
                    <MessageSquare className="w-12 h-12 text-slate-300" />
                  </div>
                  <div className="text-center">
                    <p className="font-black text-2xl tracking-tight text-slate-800">No hay ronda activa</p>
                    <p className="font-medium text-slate-500 mt-2">Selecciona una tarea con rondas activas para unirte al debate.</p>
                  </div>
                </div>
              ) : null}
              {activeTab === 'team' && (
                <TeamPanel 
                  expertIds={project?.expertIds} 
                  facilitatorId={project?.facilitatorId}
                  rounds={roundsByTask} 
                  tasks={tasks}
                  isFacilitator={isFacilitator}
                />
              )}
              {activeTab === 'audit' && (
                <ProjectAuditLog entries={logs.filter(log => {
                  const detailsStr = typeof log.details === 'string' ? log.details : JSON.stringify(log.details || {});
                  return !selectedTaskId || detailsStr.includes(selectedTaskId) || log.action.includes('Project') || log.action.includes('Proyecto');
                })} />
              )}
            </div>
          )}
        </div>

        <ProjectModals 
          showTaskForm={showTaskForm}
          setShowTaskForm={(show) => updateState({ showTaskForm: show })}
          handleAddTask={handleAddTask}
          newTaskTitle={newTaskTitle}
          setNewTaskTitle={(title) => updateState({ newTaskTitle: title })}
          newTaskDesc={newTaskDesc}
          setNewTaskDesc={(desc) => updateState({ newTaskDesc: desc })}
          sprintIsLocked={sprintIsLocked}

          showConfigModal={showConfigModal}
          setShowConfigModal={(show) => updateState({ showConfigModal: show })}
          handleSaveConfig={handleSaveConfig}
          configForm={configForm}
          setConfigForm={(form: any) => updateState({ configForm: form })}
          configError={configError}
          isSavingConfig={isSavingConfig}
          isMethodImmutable={sprintIsLocked}

          showFinalizeModal={showFinalizeModal}
          setShowFinalizeModal={(show) => updateState({ showFinalizeModal: show })}
          handleFinalizeProject={handleFinalizeProject}
          isFinalizing={isFinalizing}
          projectName={project.name}

          showDeleteModal={showDeleteModal}
          setShowDeleteModal={(show) => updateState({ showDeleteModal: show })}
          handleDeleteProject={handleDeleteProject}
          isDeleting={isDeleting}
        />
      </div>
    </div>
  );
};

export default ProjectDetail;
