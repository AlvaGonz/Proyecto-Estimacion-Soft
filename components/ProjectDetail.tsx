
import React, { useState } from 'react';
import {
  ArrowLeft,
  Plus,
  CheckCircle2,
  Circle,
  Activity,
  FileText,
  Users,
  MessageSquare,
  Settings,
  Star,
  Award,
  X,
  History,
  ShieldCheck
} from 'lucide-react';
import { Task, UserRole, AuditEntry, Project, Round } from '../types';
import EstimationRounds from './EstimationRounds';
import Documentation from './Documentation';
import DiscussionSpace from './DiscussionSpace';
import TeamPanel from './TeamPanel';
import ProjectAuditLog from './ProjectAuditLog';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';
import { roundService } from '../services/roundService';

// TODO: Connect Discussion, Team, and AuditLog to actual endpoints when ready
const MOCK_AUDIT: AuditEntry[] = [
  { id: 'a1', projectId: 'p1', userId: 'u1', action: 'Creación de Proyecto', timestamp: Date.now() - 86400000 * 5, details: 'Proyecto inicializado en fase de preparación.' },
  { id: 'a2', projectId: 'p1', userId: 'u1', action: 'Apertura de Ronda', timestamp: Date.now() - 3600000, details: 'Ronda 1 abierta para la tarea T1.' },
  { id: 'a3', projectId: 'p1', userId: 'u2', action: 'Estimación Recibida', timestamp: Date.now() - 1800000, details: 'Experto E1 envió estimación para Ronda 1.' },
];

interface ProjectDetailProps {
  projectId: string;
  onBack: () => void;
  role: UserRole;
}

type TabType = 'tasks' | 'docs' | 'discussion' | 'team' | 'audit';

const ProjectDetail: React.FC<ProjectDetailProps> = ({ projectId, onBack, role }) => {
  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeRound, setActiveRound] = useState<Round | null>(null);
  const [logs, setLogs] = useState<AuditEntry[]>([]);

  React.useEffect(() => {
    const fetchLogs = async () => {
      try {
        const auditLogs = await projectService.getAuditLogs(projectId);
        setLogs(auditLogs);
      } catch (err) {
        console.error("Failed to fetch logs", err);
      }
    };
    if (activeTab === 'audit') {
      fetchLogs();
    }
  }, [projectId, activeTab]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [proj, taskList] = await Promise.all([
          projectService.getProject(projectId),
          taskService.getTasks(projectId)
        ]);
        setProject(proj);
        setTasks(taskList);
        if (taskList.length > 0) {
          setSelectedTaskId(taskList[0].id);
        }
      } catch (err) {
        console.error("Error fetching project details", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

  React.useEffect(() => {
    if (!selectedTaskId) {
      setActiveRound(null);
      return;
    }
    const fetchActiveRound = async () => {
      try {
        const rounds = await roundService.getRoundsByTask(projectId, selectedTaskId);
        const active = rounds.find(r => r.status === 'open');
        setActiveRound(active || rounds[rounds.length - 1] || null);
      } catch (err) {
        console.error("Error fetching rounds for discussion", err);
      }
    };
    fetchActiveRound();
  }, [selectedTaskId]);

  const currentTask = tasks.find(t => t.id === selectedTaskId);
  const isFacilitator = role === UserRole.FACILITATOR || role === UserRole.ADMIN;

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle || !newTaskDesc) return;
    try {
      const newTask = await taskService.createTask(projectId, {
        title: newTaskTitle,
        description: newTaskDesc,
      });
      setTasks([...tasks, newTask]);
      setNewTaskTitle('');
      setNewTaskDesc('');
      setShowTaskForm(false);
      setSelectedTaskId(newTask.id);
    } catch (err) {
      console.error("Error", err);
      alert("Error creando la tarea");
    }
  };

  const handleTaskConsensus = (finalValue: number) => {
    if (!selectedTaskId) return;
    setTasks(prev => prev.map(t =>
      t.id === selectedTaskId
        ? { ...t, status: 'consensus', finalEstimate: finalValue }
        : t
    ));
  };

  if (isLoading) {
    return <div className="h-full w-full flex items-center justify-center min-h-[50vh]"><LoadingSpinner /></div>;
  }

  if (!project) {
    return <div className="p-8 text-center text-slate-500">Proyecto no encontrado.</div>;
  }

  return (
    <div className="space-y-8 md:space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
          <button
            onClick={onBack}
            className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center bg-white border-2 border-slate-100 rounded-2xl md:rounded-3xl text-slate-400 hover:text-delphi-keppel hover:border-delphi-keppel transition-all shadow-sm group"
            aria-label="Volver a la lista de proyectos"
          >
            <ArrowLeft className="w-6 h-6 md:w-8 md:h-8 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-3 md:gap-4 flex-wrap">
              <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight leading-none">{project.name}</h2>
              <span className={`px-3 md:px-4 py-1.5 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] shadow-lg ${project.status === 'active' ? 'bg-delphi-orange text-white shadow-delphi-orange/20' : 'bg-slate-200 text-slate-600'}`}>
                {project.status === 'preparation' ? 'Preparación' : project.status === 'kickoff' ? 'Kickoff' : project.status === 'active' ? 'Activo' : project.status === 'finished' ? 'Finalizado' : project.status}
              </span>
            </div>
            <div className="flex items-center gap-4 md:gap-6 mt-3 flex-wrap">
              <p className="text-slate-400 font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-4 h-4 text-delphi-keppel" />
                Unidad: {project.unit === 'hours' ? 'Horas' : project.unit === 'storyPoints' ? 'Puntos de Historia' : project.unit === 'personDays' ? 'Días Persona' : project.unit}
              </p>
              <div className="hidden sm:block h-4 w-px bg-slate-200" />
              <p className="text-slate-400 font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center gap-2">
                <Users className="w-4 h-4 text-delphi-orange" />
                {project.expertIds?.length || 0} Expertos
              </p>
            </div>
          </div>
        </div>

        {isFacilitator && (
          <div className="flex flex-col sm:flex-row gap-3">
            <button className="flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all">
              <Settings className="w-4 h-4" />
              Configurar
            </button>
            <button
              onClick={() => setShowTaskForm(true)}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-delphi-keppel text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-delphi-keppel/30 hover:scale-[1.02] transition-all"
            >
              <Plus className="w-4 h-4" />
              Añadir Tarea
            </button>
          </div>
        )}
      </div>

      {showTaskForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] md:rounded-[3rem] w-full max-w-xl p-8 md:p-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl md:text-2xl font-black tracking-tight">Nueva Tarea</h3>
              <button onClick={() => setShowTaskForm(false)} aria-label="Cerrar modal" className="p-2 text-slate-400 hover:text-delphi-giants transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleAddTask} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="newTaskTitle" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Título de la Tarea</label>
                <input
                  id="newTaskTitle"
                  autoFocus
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none"
                  placeholder="Ej: Implementación de WebSockets"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="newTaskDesc" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 flex items-center gap-2">
                  Descripción Técnica
                  <span className="text-delphi-giants">*</span>
                </label>
                <textarea
                  id="newTaskDesc"
                  rows={4}
                  required
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className={`w-full bg-slate-50 border ${!newTaskDesc && newTaskTitle ? 'border-delphi-giants/50 focus:border-delphi-giants' : 'border-slate-200'} rounded-2xl px-6 py-4 text-sm font-medium outline-none transition-colors`}
                  placeholder="Detalla los requisitos específicos... (requerida)"
                />
                {!newTaskDesc && newTaskTitle && (
                  <p className="text-delphi-giants text-xs ml-2">La descripción es requerida</p>
                )}
              </div>
              <button type="submit" className="w-full bg-delphi-keppel text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all">
                Crear Tarea
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Navegación por Pestañas */}
      <nav aria-label="Navegación del proyecto" role="tablist" className="flex border-b border-slate-200 gap-6 md:gap-12 overflow-x-auto no-scrollbar scroll-smooth">
        {[
          { id: 'tasks', label: 'Proceso', icon: Activity },
          { id: 'docs', label: 'Docs', icon: FileText },
          { id: 'discussion', label: 'Debate', icon: MessageSquare },
          { id: 'team', label: 'Panel', icon: Award },
          { id: 'audit', label: 'Logs', icon: History },
        ].map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 md:gap-3 pb-4 md:pb-5 px-1 text-[10px] md:text-sm font-black uppercase tracking-[0.15em] transition-all shrink-0 relative ${activeTab === tab.id
              ? 'text-delphi-keppel'
              : 'text-slate-400 hover:text-slate-600'
              }`}
          >
            <tab.icon className={`w-4 h-4 md:w-5 md:h-5 ${activeTab === tab.id ? 'scale-110' : ''}`} />
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 w-full h-1 md:h-1.5 bg-delphi-keppel rounded-t-full" />
            )}
          </button>
        ))}
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {activeTab === 'tasks' && (
          <div role="tabpanel" id="panel-tasks" aria-labelledby="tab-tasks" className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            <div className="lg:col-span-4 space-y-8">
              <div className="bg-white rounded-[2rem] md:rounded-[3rem] border border-slate-100 p-6 md:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-black text-xl tracking-tight">Tareas del Sprint</h3>
                  <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {tasks.length} items
                  </div>
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
                  {tasks.map(task => (
                    <button
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className={`w-full text-left p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border-2 transition-all ${selectedTaskId === task.id
                        ? 'border-delphi-keppel bg-delphi-keppel/[0.03]'
                        : 'border-slate-50 bg-slate-50/30 hover:border-slate-200'
                        }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`shrink-0 mt-1 transition-colors ${selectedTaskId === task.id ? 'text-delphi-keppel' : 'text-slate-300'}`}>
                          {task.status === 'consensus' ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm md:text-base font-black leading-tight mb-2 truncate ${selectedTaskId === task.id ? 'text-slate-900' : 'text-slate-500 font-bold'}`}>
                            {task.title}
                          </h4>
                          {task.status === 'consensus' ? (
                            <div className="flex items-center gap-2 text-delphi-keppel bg-delphi-keppel/10 w-fit px-2 py-0.5 rounded-lg">
                              <Award className="w-3 h-3" />
                              <span className="text-[9px] font-black uppercase tracking-widest">{task.finalEstimate}h</span>
                            </div>
                          ) : (
                            <div className="space-y-1.5 mt-2">
                              <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full bg-delphi-keppel transition-all duration-1000 ${selectedTaskId === task.id ? (task.status === 'estimating' ? 'w-2/3' : 'w-1/4') : 'w-0'}`}></div>
                              </div>
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                {task.status === 'pending' ? 'Pendiente' : task.status === 'estimating' ? 'Estimando' : task.status}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {isFacilitator && (
                <div className="bg-slate-900 p-8 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-white/5 relative overflow-hidden group">
                  <div className="relative z-10">
                    <h4 className="flex items-center gap-3 text-delphi-keppel font-black mb-3 md:mb-4 text-base">
                      <ShieldCheck className="w-5 h-5 md:w-6 md:h-6" />
                      Facilitador
                    </h4>
                    <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-bold">
                      Supervisión activa del flujo iterativo.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-8 space-y-10">
              {currentTask ? (
                <EstimationRounds
                  taskId={currentTask.id}
                  taskTitle={currentTask.title}
                  unit={project.unit || "Horas"}
                  estimationMethod={project.estimationMethod}
                  onConsensusReached={handleTaskConsensus}
                  isFacilitator={isFacilitator}
                  projectId={project.id}
                />
              ) : (
                <div className="h-64 md:h-96 bg-white rounded-[2rem] md:rounded-[3rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-200 gap-4 md:gap-6">
                  <Star className="w-12 h-12 md:w-20 md:h-20 opacity-20" />
                  <p className="font-black text-lg md:text-2xl tracking-tight text-slate-300">Selecciona una tarea</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab !== 'tasks' && (
          <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`} className="lg:col-span-12">
            {activeTab === 'docs' && <Documentation projectId={projectId} />}
            {activeTab === 'discussion' && activeRound ? (
              <DiscussionSpace roundId={activeRound.id} />
            ) : activeTab === 'discussion' ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-4">
                <MessageSquare className="w-12 h-12 opacity-20" />
                <p className="font-bold">Selecciona una tarea con rondas activas para ver el debate.</p>
              </div>
            ) : null}
            {activeTab === 'team' && <TeamPanel expertIds={project?.expertIds} />}
            {activeTab === 'audit' && <ProjectAuditLog entries={logs} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;
