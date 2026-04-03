
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
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  GripVertical
} from 'lucide-react';
import { Task, UserRole, AuditEntry, Project, Round } from '../../../types';
import EstimationRounds from '../../rounds/components/EstimationRounds';
import Documentation from '../../../shared/components/Documentation';
import DiscussionSpace from '../../discussion/components/DiscussionSpace';
import TeamPanel from '../../users/components/TeamPanel';
import ProjectAuditLog from '../../audit-log/components/ProjectAuditLog';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { projectService } from '../services/projectService';
import { taskService } from '../../tasks/services/taskService';
import { roundService } from '../../rounds/services/roundService';
import { notificationService } from '../../notifications/services/notificationService';

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
  currentUserId: string;
}

type TabType = 'tasks' | 'docs' | 'discussion' | 'team' | 'audit';

const ProjectDetail: React.FC<ProjectDetailProps> = ({ projectId, onBack, role, currentUserId }) => {
  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeRound, setActiveRound] = useState<Round | null>(null);
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sprintIsLocked, setSprintIsLocked] = useState(false);
  const [roundsByTask, setRoundsByTask] = useState<Record<string, Round[]>>({});
  
  // Config form state
  const [configForm, setConfigForm] = useState({
    name: '',
    description: '',
    unit: 'hours',
    estimationMethod: 'wideband-delphi',
    cvThreshold: 0.25,
    maxOutlierPercent: 30
  });
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configError, setConfigError] = useState('');

  // Sidebar Resize State
  const [sidebarWidth, setSidebarWidth] = useState(360);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const startResizing = React.useCallback(() => {
    if (isSidebarCollapsed) setIsSidebarCollapsed(false);
    setIsResizing(true);
  }, [isSidebarCollapsed]);

  const stopResizing = React.useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = React.useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth = mouseMoveEvent.clientX - containerRect.left;
        // Limit range for usability
        if (newWidth > 280 && newWidth < 800) {
          setSidebarWidth(newWidth);
        }
      }
    },
    [isResizing]
  );

  React.useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, resize, stopResizing]);

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

  const currentTask = tasks.find(t => t.id === selectedTaskId);
  const isFacilitator = role === UserRole.FACILITATOR || role === UserRole.ADMIN;

  // Security and Navigation Logic
  React.useEffect(() => {
    if (project && !isLoading) {
      const isExpert = role === UserRole.EXPERT;
      const isParticipant = isFacilitator || (project.expertIds && project.expertIds.includes(currentUserId));

      // 1. Security Check: Redirect if not a participant/facilitator
      if (!isParticipant) {
        notificationService.addNotification({
          type: 'system',
          message: 'No tienes permiso para acceder a este proyecto.'
        });
        onBack();
        return;
      }

      // 2. Expert Preference: Focus on tasks if it's active or kickoff
      if (isExpert && (project.status === 'active' || project.status === 'kickoff')) {
        setActiveTab('tasks');
      }
    }
  }, [project, isLoading, role, currentUserId, isFacilitator, onBack]);

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
        
        // Fetch rounds for all tasks to check for lock condition
        const roundsPromises = taskList.map(t => roundService.getRoundsByTask(projectId, t.id));
        const allRounds = await Promise.all(roundsPromises);
        
        const roundsMap: Record<string, Round[]> = {};
        let hasEstimation = false;
        
        taskList.forEach((t, i) => {
          roundsMap[t.id] = allRounds[i];
          if (!hasEstimation && allRounds[i].some(r => r.estimations && r.estimations.length > 0)) {
            hasEstimation = true;
          }
        });
        
        setRoundsByTask(roundsMap);
        setSprintIsLocked(hasEstimation);

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
    if (activeTab === 'docs' && !isFacilitator && role !== UserRole.ADMIN) {
      setActiveTab('tasks');
    }
  }, [activeTab, isFacilitator, role]);

  // Cargar datos del proyecto en el formulario de configuración
  React.useEffect(() => {
    if (project && showConfigModal) {
      setConfigForm({
        name: project.name || '',
        description: project.description || '',
        unit: project.unit || 'hours',
        estimationMethod: project.estimationMethod || 'wideband-delphi',
        cvThreshold: project.convergenceConfig?.cvThreshold || 0.25,
        maxOutlierPercent: (project.convergenceConfig?.maxOutlierPercent || 0.30) * 100
      });
      setConfigError('');
    }
  }, [project, showConfigModal]);
  
  // RF021: El método es inmutable si ya hay tareas estimándose o consensuadas
  const isMethodImmutable = tasks.some(t => {
    const status = (t.status || '').toLowerCase();
    // Consider as immutable if it's estimating, in consensus, or already finalized
    return status === 'estimating' || status === 'estimando' || 
           status === 'consensus' || status === 'consenso' || 
           status === 'finalized' || status === 'finalizada';
  });
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configForm.name.trim()) {
      setConfigError('El nombre del proyecto es requerido');
      return;
    }
    
    setIsSavingConfig(true);
    setConfigError('');
    
    try {
      const updated = await projectService.updateProject(projectId, {
        name: configForm.name,
        description: configForm.description,
        unit: configForm.unit,
        estimationMethod: configForm.estimationMethod,
        convergenceConfig: {
          cvThreshold: configForm.cvThreshold,
          maxOutlierPercent: configForm.maxOutlierPercent / 100
        }
      });
      
      setProject(updated);
      setShowConfigModal(false);
    } catch (err: any) {
      setConfigError(err.message || 'Error al guardar la configuración');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle || !newTaskDesc || sprintIsLocked) return;
    try {
      const newTask = await taskService.createTask(projectId, {
        title: newTaskTitle,
        description: newTaskDesc,
      });
      setTasks([...tasks, newTask]);
      setRoundsByTask(prev => ({ ...prev, [newTask.id]: [] }));
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
        ? { ...t, status: 'consensus', finalEstimate: finalValue, completionPercentage: 100 }
        : t
    ));
  };

  const handleTaskFinalize = async (taskId: string) => {
    try {
      const updatedTasks = await taskService.getTasks(projectId);
      setTasks(updatedTasks);
      
      // Update rounds for this task as it might have changed
      const updatedRounds = await roundService.getRoundsByTask(projectId, taskId);
      setRoundsByTask(prev => ({ ...prev, [taskId]: updatedRounds }));
      
      // Re-evaluate lock just in case
      if (updatedRounds.some(r => r.estimations && r.estimations.length > 0)) {
        setSprintIsLocked(true);
      }
    } catch (err) {
      console.error("Error refreshing tasks after finalization", err);
    }
  };

  const handleFinalizeProject = async () => {
    try {
      setIsFinalizing(true);
      const updated = await projectService.updateProject(projectId, { status: 'finished' });
      setProject(updated);
      
      // RF014: All participants should be notified when the session ends
      // Since it's a finish, we can just notify all interested roles in a real app.
      // For now, in-app notification for the facilitator's session end.
      const targetIds = [project.facilitatorId, ...(project.expertIds || [])].filter(id => id !== currentUserId);
      
      targetIds.forEach(targetId => {
        notificationService.addNotification({
          type: 'system',
          message: `Proyecto "${project.name}" finalizado con éxito. Reportes disponibles.`,
          projectId: project.id,
          targetUserId: targetId
        });
      });

      setShowFinalizeModal(false);
    } catch (err: any) {
      alert(err.message || "Error al finalizar el proyecto");
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleDeleteProject = async () => {
    try {
      setIsDeleting(true);
      await projectService.deleteProject(projectId);
      
      // RF025: Enviar notificaciones únicamente a los afiliados (facilitador y expertos)
      // Excepto al administrador que está realizando la eliminación.
      const allIds = [project.facilitatorId, ...(project.expertIds || [])];
      const targetIds = allIds
        .map(id => (typeof id === 'object' && id !== null ? (id as any).id || (id as any)._id : id))
        .filter(id => id && String(id) !== String(currentUserId));
      
      targetIds.forEach(targetId => {
        notificationService.addNotification({
          type: 'system',
          message: `El proyecto "${project.name}" ha sido eliminado por el administrador.`,
          projectId,
          targetUserId: String(targetId)
        });
      });

      // Redireccionar y recargar para asegurar que la UI se actualice completamente
      onBack();
      setTimeout(() => {
        window.location.reload();
      }, 500); // Pequeño delay para que la transición de onBack sea visible o el storage se procese
    } catch (err: any) {
      alert(err.message || "Error al eliminar el proyecto");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (isLoading) {
    return <div className="h-full w-full flex items-center justify-center min-h-[50vh]"><LoadingSpinner /></div>;
  }

  if (!project) {
    return <div className="p-8 text-center text-slate-500">Proyecto no encontrado.</div>;
  }

  return (
    <div className="w-full min-h-screen">
      <nav aria-label="Breadcrumb" className="max-w-[1600px] mx-auto pt-8 px-4 sm:px-8 lg:px-12 mb-4">
        <ol className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <li><span className="hover:text-delphi-keppel cursor-pointer transition-colors" onClick={onBack}>Proyectos</span></li>
          <li><span className="opacity-40">/</span></li>
          <li><span className="text-slate-900">{project.name}</span></li>
        </ol>
      </nav>

      <div className="max-w-[1600px] mx-auto space-y-8 md:space-y-12 pb-20 animate-reveal px-4 sm:px-8 lg:px-12">
      <div className="flex flex-col gap-10">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-10">
          <button
            onClick={onBack}
            className="w-14 h-14 md:w-20 md:h-20 flex items-center justify-center bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2rem] md:rounded-[2.5rem] text-slate-400 hover:text-delphi-keppel hover:border-delphi-keppel/50 hover:bg-white transition-all shadow-sm group"
            aria-label="Volver a la lista de proyectos"
          >
            <ArrowLeft className="w-7 h-7 md:w-9 md:h-9 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="space-y-4">
            <div className="flex items-center gap-4 md:gap-6 flex-wrap">
              <h2 className="font-black text-slate-900 tracking-tight leading-none italic uppercase" style={{ fontSize: 'clamp(1.5rem, 4vw + 0.5rem, 3.75rem)' }}>{project.name}</h2>
              <span className={`px-5 md:px-7 py-2.5 rounded-full text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] shadow-xl backdrop-blur-md border animate-reveal ${
                project.status?.toLowerCase() === 'active' ? 'bg-delphi-celadon/20 text-delphi-keppel border-delphi-keppel/20 shadow-delphi-keppel/5' : 
                project.status?.toLowerCase() === 'finished' ? 'bg-delphi-keppel text-white border-white/20 shadow-delphi-keppel/20' : 
                project.status?.toLowerCase() === 'kickoff' ? 'bg-delphi-orange text-white border-white/20 shadow-delphi-orange/20' :
                project.status?.toLowerCase() === 'preparation' ? 'bg-slate-200/50 text-slate-600 border-slate-300/30' :
                'bg-slate-100 text-slate-400'}`}>
                {project.status?.toLowerCase() === 'preparation' ? 'Preparación' : 
                 project.status?.toLowerCase() === 'kickoff' ? 'Kickoff' : 
                 project.status?.toLowerCase() === 'active' ? 'Activo' : 
                 project.status?.toLowerCase() === 'finished' ? 'Finalizado' : 
                 project.status}
              </span>
            </div>
            <div className="flex items-center gap-6 md:gap-10 flex-wrap">
              <div className="text-slate-500 font-bold text-xs md:text-sm uppercase tracking-widest flex items-center gap-3">
                <div className="p-2 bg-delphi-keppel/10 rounded-lg"><FileText className="w-4 h-4 text-delphi-keppel" /></div>
                Unidad: <span className="text-slate-900">{project.unit === 'hours' ? 'Horas' : project.unit === 'storyPoints' ? 'Puntos de Historia' : project.unit === 'personDays' ? 'Días Persona' : project.unit}</span>
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

        {isFacilitator && project.status?.toLowerCase() !== 'finished' && project.status?.toLowerCase() !== 'archived' && (
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => setShowConfigModal(true)}
              className="group flex items-center justify-center gap-3 px-6 py-4 bg-white/50 backdrop-blur-md border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-white hover:border-delphi-keppel/50 transition-all shadow-sm active:scale-95 flex-1 sm:flex-none min-w-[160px]"
            >
              <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform" />
              Configurar
            </button>
            <button
              onClick={() => setShowTaskForm(true)}
              disabled={sprintIsLocked}
              title={sprintIsLocked ? "No se pueden añadir tareas una vez iniciada la estimación" : ""}
              className={`flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl transition-all border flex-1 sm:flex-none min-w-[160px] ${
                sprintIsLocked 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200 shadow-none' 
                  : 'bg-delphi-keppel text-white border-delphi-keppel shadow-delphi-keppel/30 hover:scale-[1.02] active:scale-95'
              }`}
            >
              <Plus className="w-4 h-4" />
              Añadir Tarea
            </button>
            <button
              onClick={() => setShowFinalizeModal(true)}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-delphi-giants transition-all active:scale-95 w-full sm:w-auto flex-1 sm:flex-none min-w-[160px] md:ml-auto"
            >
              <CheckCircle2 className="w-4 h-4" />
              Finalizar Proyecto
            </button>
            {role === UserRole.ADMIN && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center justify-center gap-3 px-8 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-600/20 hover:bg-red-700 transition-all active:scale-95 flex-1 sm:flex-none min-w-[160px]"
              >
                <X className="w-4 h-4" />
                Eliminar Proyecto
              </button>
            )}
          </div>
        )}
      </div>

      {showTaskForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[2rem] md:rounded-[3rem] w-full max-w-xl p-6 md:p-10 lg:p-14 shadow-[0_32px_80px_rgba(0,0,0,0.15)] animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 border border-white/40 ring-1 ring-slate-900/5">
            <div className="flex items-center justify-between mb-12">
              <div className="space-y-1">
                <h3 className="text-2xl md:text-3xl font-black tracking-tighter text-slate-900">Nueva Tarea</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-delphi-keppel">Especificación del Backlog</p>
              </div>
              <button 
                onClick={() => setShowTaskForm(false)} 
                aria-label="Cerrar modal" 
                className="group p-3 bg-slate-100 hover:bg-slate-900 transition-all rounded-2xl"
              >
                <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
              </button>
            </div>
            <form onSubmit={handleAddTask} className="space-y-8">
              <div className="space-y-3">
                <label htmlFor="newTaskTitle" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Título Identificador</label>
                <input
                  id="newTaskTitle"
                  autoFocus
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-3xl px-8 py-5 text-sm font-bold shadow-inner focus:bg-white focus:ring-4 focus:ring-delphi-keppel/10 transition-all outline-none"
                  placeholder="Ej: Módulo de Autenticación Biométrica"
                />
              </div>
              <div className="space-y-3">
                <label htmlFor="newTaskDesc" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 flex items-center gap-2">
                  Descripción Técnica 
                  <span className="text-delphi-giants animate-pulse">*</span>
                </label>
                <textarea
                  id="newTaskDesc"
                  rows={4}
                  required
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className={`w-full bg-slate-50/50 border ${!newTaskDesc && newTaskTitle ? 'border-delphi-giants/50 ring-4 ring-delphi-giants/5' : 'border-slate-200'} rounded-3xl px-8 py-5 text-sm font-medium shadow-inner focus:bg-white focus:ring-4 focus:ring-delphi-keppel/10 transition-all outline-none resize-none`}
                  placeholder="Detalla los requisitos específicos, alcances y restricciones técnicas de la tarea..."
                />
                {!newTaskDesc && newTaskTitle && (
                  <p className="text-delphi-giants text-[10px] font-black uppercase tracking-widest ml-4 mt-2 bg-delphi-giants/5 w-fit px-3 py-1 rounded-full">Campo obligatorio para procesar</p>
                )}
              </div>
              <button 
                type="submit" 
                className="w-full group relative overflow-hidden bg-delphi-keppel text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-delphi-keppel/30 hover:shadow-delphi-keppel/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-shimmer" />
                Crear Tarea Técnica
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Configuración del Proyecto */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[2rem] md:rounded-[3rem] w-full max-w-2xl p-6 md:p-10 lg:p-14 shadow-[0_32px_80px_rgba(0,0,0,0.15)] animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 max-h-[90vh] overflow-y-auto no-scrollbar border border-white/40 ring-1 ring-slate-900/5">
            <div className="flex items-center justify-between mb-12">
              <div className="space-y-1">
                <h3 className="text-2xl md:text-3xl font-black tracking-tighter text-slate-900">Configurar Proyecto</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-delphi-orange">Ajustes Globales y Umbrales</p>
              </div>
              <button 
                onClick={() => setShowConfigModal(false)} 
                className="group p-3 bg-slate-100 hover:bg-slate-900 transition-all rounded-2xl"
              >
                <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
              </button>
            </div>
            
            <form onSubmit={handleSaveConfig} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {configError && (
                <div className="md:col-span-2 bg-red-50 border border-red-200 rounded-3xl p-6 flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 shrink-0">
                    <X className="w-5 h-5" />
                  </div>
                  <p className="text-red-700 text-sm font-black uppercase tracking-wide">{configError}</p>
                </div>
              )}
              
              <div className="md:col-span-2 space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Nombre del Proyecto</label>
                <input
                  required
                  value={configForm.name}
                  onChange={(e) => setConfigForm({...configForm, name: e.target.value})}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-3xl px-8 py-5 text-sm font-bold shadow-inner focus:bg-white focus:ring-4 focus:ring-delphi-keppel/10 transition-all outline-none"
                />
              </div>
              
              <div className="md:col-span-2 space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Descripción General</label>
                <textarea
                  rows={3}
                  value={configForm.description}
                  onChange={(e) => setConfigForm({...configForm, description: e.target.value})}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-3xl px-8 py-5 text-sm font-medium shadow-inner focus:bg-white focus:ring-4 focus:ring-delphi-keppel/10 transition-all outline-none resize-none"
                />
              </div>
              
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Unidad de Medida</label>
                <select
                  value={configForm.unit}
                  onChange={(e) => setConfigForm({...configForm, unit: e.target.value})}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-[1.5rem] px-8 py-5 text-sm font-black shadow-inner appearance-none focus:bg-white focus:ring-4 focus:ring-delphi-keppel/10 transition-all outline-none"
                >
                  <option value="hours">Horas (H)</option>
                  <option value="storyPoints">Puntos de Historia (SP)</option>
                  <option value="personDays">Días Persona (DP)</option>
                </select>
              </div>
              
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Metodología Principal</label>
                <select
                  value={configForm.estimationMethod}
                  onChange={(e) => setConfigForm({...configForm, estimationMethod: e.target.value})}
                  disabled={isMethodImmutable}
                  className={`w-full bg-slate-50/50 border rounded-[1.5rem] px-8 py-5 text-sm font-black shadow-inner appearance-none transition-all outline-none ${isMethodImmutable ? 'opacity-50 grayscale cursor-not-allowed border-slate-100' : 'border-slate-200 focus:bg-white focus:ring-4 focus:ring-delphi-keppel/10'}`}
                >
                  <option value="wideband-delphi">Wideband Delphi</option>
                  <option value="planning-poker">Planning Poker</option>
                  <option value="three-point">Estimación de Tres Puntos</option>
                </select>
              </div>
              
              <div className="space-y-6 bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100 shadow-inner">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Umbral CV
                  </label>
                  <span className="bg-delphi-keppel text-white px-3 py-1 rounded-full text-[10px] font-black tracking-widest">{configForm.cvThreshold}</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.5"
                  step="0.05"
                  value={configForm.cvThreshold}
                  onChange={(e) => setConfigForm({...configForm, cvThreshold: parseFloat(e.target.value)})}
                  className="w-full accent-delphi-keppel"
                />
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight leading-relaxed">Coeficiente de Variación: umbral para determinar convergencia automática.</p>
              </div>
              
              <div className="space-y-6 bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100 shadow-inner">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Outliers Máx.
                  </label>
                  <span className="bg-delphi-orange text-white px-3 py-1 rounded-full text-[10px] font-black tracking-widest">{configForm.maxOutlierPercent}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  step="5"
                  value={configForm.maxOutlierPercent}
                  onChange={(e) => setConfigForm({...configForm, maxOutlierPercent: parseInt(e.target.value)})}
                  className="w-full accent-delphi-orange"
                />
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight leading-relaxed">Porcentaje de valores extremos permitidos antes de requerir nueva ronda.</p>
              </div>
              
              <div className="md:col-span-2 flex gap-4 mt-6">
                <button 
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="flex-1 py-5 rounded-[2rem] border-2 border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSavingConfig}
                  className={`flex-[2] py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 ${
                    isSavingConfig 
                      ? 'bg-slate-300 text-slate-500' 
                      : 'bg-delphi-keppel text-white hover:scale-[1.02] shadow-delphi-keppel/20'
                  }`}
                >
                  {isSavingConfig ? 'Actualizando...' : 'Guardar Cambios de Proyecto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Navegación por Pestañas */}
      <nav aria-label="Navegación del proyecto" role="tablist" className="flex bg-slate-100/50 p-1.5 rounded-2xl gap-1 flex-wrap shadow-inner border border-slate-200/50 backdrop-blur-sm w-full mb-8">
        {[
          { id: 'tasks', label: 'Proceso', icon: Activity, color: 'text-delphi-keppel' },
          { id: 'docs', label: 'Docs', icon: FileText, color: 'text-delphi-orange' },
          { id: 'discussion', label: 'Debate', icon: MessageSquare, color: 'text-delphi-celadon' },
          { id: 'team', label: 'Panel', icon: Award, color: 'text-delphi-keppel' },
          { id: 'audit', label: 'Logs', icon: History, color: 'text-delphi-giants' },
        ].map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex-1 min-w-[80px] justify-center flex items-center gap-2 md:gap-3 py-3 md:py-4 px-4 md:px-8 rounded-xl md:rounded-2xl text-[10px] md:text-sm font-black uppercase tracking-[0.1EM] transition-all ${activeTab === tab.id
              ? 'bg-white text-slate-900 shadow-lg shadow-slate-200/50 ring-1 ring-slate-200 scale-[1.02]'
              : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
              }`}
          >
            <tab.icon className={`w-4 h-4 md:w-5 md:h-5 ${activeTab === tab.id ? tab.color : 'opacity-60'}`} />
            {tab.label}
          </button>
        ))}
      </nav>

      <div ref={containerRef} className="relative">
        {activeTab === 'tasks' && (
          <div role="tabpanel" id="panel-tasks" aria-labelledby="tab-tasks" className="flex flex-col lg:flex-row gap-8 lg:gap-0 items-start min-h-[70vh]">
            {/* Sidebar de Tareas - Resizable */}
            <div 
              style={{ width: window.innerWidth >= 1024 ? (isSidebarCollapsed ? '96px' : `${sidebarWidth}px`) : '100%' }}
              className="lg:sticky lg:top-8 flex flex-col shrink-0 min-w-0 transition-all duration-500 ease-in-out"
            >
              <div className={`bg-white/70 backdrop-blur-3xl rounded-[2.5rem] border border-white shadow-[0_4px_24px_rgba(0,0,0,0.06)] flex flex-col h-full max-h-[80vh] ring-1 ring-slate-200/60 transition-all duration-500 ${isSidebarCollapsed ? 'p-4 items-center' : 'p-6 md:p-10'}`}>
                <div className={`flex items-center justify-between shrink-0 transition-all duration-500 ${isSidebarCollapsed ? 'flex-col gap-6 mb-6' : 'mb-10'}`}>
                  {!isSidebarCollapsed ? (
                    <>
                      <div className="space-y-1">
                        <h3 className="font-black text-2xl tracking-tighter text-slate-900">Tareas</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Backlog del Sprint</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="bg-delphi-keppel/10 px-5 py-2.5 rounded-2xl text-[10px] md:text-xs font-black text-delphi-keppel uppercase tracking-widest ring-1 ring-delphi-keppel/20 shadow-sm shadow-delphi-keppel/5">
                          {tasks.length}
                        </div>
                        <button 
                          onClick={() => setIsSidebarCollapsed(true)}
                          className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors group"
                          title="Minimizar panel"
                        >
                          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <button 
                      onClick={() => setIsSidebarCollapsed(false)}
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
                        onClick={() => setSelectedTaskId(task.id)}
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
                            {task.status?.toLowerCase() === 'consensus' || task.status?.toLowerCase() === 'finalized' 
                              ? <CheckCircle2 className="w-7 h-7" /> 
                              : <Circle className="w-7 h-7" />}
                          </div>
                          {!isSidebarCollapsed && (
                            <div className="flex-1 min-w-0 pr-2">
                              <h4 className={`text-sm md:text-base font-black leading-tight mb-3 transition-colors ${selectedTaskId === task.id ? 'text-slate-900' : 'text-slate-600'}`}>
                                {task.title}
                              </h4>
                            {task.status?.toLowerCase() === 'consensus' || task.status?.toLowerCase() === 'finalized' ? (
                              <div className="flex items-center gap-2 text-delphi-keppel bg-delphi-keppel/10 w-fit px-4 py-1.5 rounded-xl ring-1 ring-delphi-keppel/20 shadow-sm shadow-delphi-keppel/5">
                                <Award className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{task.finalEstimate} {project.unit === 'hours' ? 'h' : project.unit === 'storyPoints' ? 'pts' : 'd'}</span>
                              </div>
                            ) : (
                              <div className="space-y-2 mt-4">
                                {(() => {
                                    if (task.status?.toLowerCase() === 'consensus' || task.status?.toLowerCase() === 'finalized') return null;
                                    
                                    const taskRounds = roundsByTask[task.id] || [];
                                    const totalExperts = project?.expertIds?.length || 1;
                                    const maxRounds = project?.maxRounds || 3;
                                    
                                    const statusValue = (task.status || '').toLowerCase();
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
   
                                    const statusLabel = statusValue === 'estimating' ? 'ESTIMANDO' : statusValue.toUpperCase();
                                    const statusColor = 'text-delphi-orange animate-pulse';
   
                                    return (
                                      <>
                                        <div className="h-2 w-full bg-slate-100/80 rounded-full overflow-hidden shadow-inner">
                                          <div 
                                            className="h-full bg-gradient-to-r from-delphi-keppel/40 to-delphi-keppel transition-all duration-1000 shadow-[2px_0_10px_rgba(43,186,165,0.3)]" 
                                            style={{ width: `${totalProgress}%` }}
                                          ></div>
                                        </div>
                                        <div className="flex justify-between items-center mt-2 px-1">
                                          <span className={`text-[9px] font-black uppercase tracking-widest ${statusColor}`}>
                                            {statusLabel}
                                          </span>
                                          <span className="text-[9px] font-black text-delphi-keppel uppercase tracking-widest">
                                            {totalProgress}%
                                          </span>
                                        </div>
                                      </>
                                    );
                                  })()}
                              </div>
                            )}
                          </div>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Resize Handle - Simple & Robust */}
            <div 
              onMouseDown={startResizing}
              className="hidden lg:flex w-2 relative self-stretch cursor-col-resize group items-center justify-center z-20"
            >
              <div className={`w-1 h-32 rounded-full transition-all duration-300 ${isResizing ? 'bg-delphi-keppel scale-x-125' : 'bg-slate-200 group-hover:bg-delphi-keppel'}`} />
              <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-white border border-slate-200 shadow-xl p-1.5 rounded-full scale-0 group-hover:scale-100 transition-all pointer-events-none">
                 <GripVertical className="w-3 h-3 text-slate-400" />
              </div>
            </div>

            {/* Area de Contenido Principal (Estimación) */}
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
          <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`} className="lg:col-span-12 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[60vh] bg-white/30 backdrop-blur-3xl rounded-[3.5rem] border border-white/40 shadow-sm p-6 md:p-10">
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

      {showFinalizeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[2rem] md:rounded-[3.5rem] w-full max-w-md p-6 md:p-10 lg:p-14 shadow-[0_32px_80px_rgba(0,0,0,0.15)] animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 border border-white/40 ring-1 ring-slate-900/5">
            <div className="flex flex-col items-center text-center gap-8">
              <div className="relative">
                <div className="absolute inset-0 bg-delphi-keppel/20 blur-3xl rounded-full scale-150 animate-pulse" />
                <div className="w-24 h-24 bg-delphi-keppel/10 rounded-[2rem] flex items-center justify-center relative z-10 border border-delphi-keppel/20">
                  <CheckCircle2 className="w-12 h-12 text-delphi-keppel" />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl md:text-3xl font-black tracking-tighter text-slate-900">¿Finalizar Proyecto?</h3>
                <p className="text-slate-500 text-sm font-bold leading-relaxed max-w-[280px]">
                  Esta acción cerrará el proyecto. <span className="text-slate-900">No se podrán añadir tareas</span> ni realizar nuevas estimaciones.
                </p>
              </div>
              <div className="w-full flex flex-col gap-4">
                <button 
                  onClick={handleFinalizeProject}
                  disabled={isFinalizing}
                  className="group relative overflow-hidden w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-shimmer" />
                  {isFinalizing ? 'Procesando...' : 'Sí, Finalizar Proyecto'}
                </button>
                <button 
                  onClick={() => setShowFinalizeModal(false)}
                  disabled={isFinalizing}
                  className="w-full py-5 rounded-[2rem] border-2 border-slate-100 text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[2rem] md:rounded-[3.5rem] w-full max-w-md p-6 md:p-10 lg:p-14 shadow-[0_32px_80px_rgba(0,0,0,0.15)] animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 border border-white/40 ring-1 ring-slate-900/5">
            <div className="flex flex-col items-center text-center gap-8">
              <div className="relative">
                <div className="absolute inset-0 bg-delphi-giants/20 blur-3xl rounded-full scale-150 animate-pulse" />
                <div className="w-24 h-24 bg-red-50 rounded-[2.5rem] flex items-center justify-center relative z-10 border border-red-100">
                  <ShieldCheck className="w-12 h-12 text-red-600" />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl md:text-3xl font-black tracking-tighter text-slate-900">¿Eliminar Proyecto?</h3>
                <p className="text-slate-500 text-sm font-bold leading-relaxed max-w-[300px]">
                  Realizarás un <span className="text-red-600 animate-pulse font-black">borrado lógico</span>. Los datos se conservarán solo en auditoría avanzada.
                </p>
              </div>
              <div className="w-full flex flex-col gap-4">
                <button 
                  onClick={handleDeleteProject}
                  disabled={isDeleting}
                  className="group relative overflow-hidden w-full bg-red-600 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-red-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-shimmer" />
                  {isDeleting ? 'Eliminando...' : 'Eliminar Permanentemente'}
                </button>
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="w-full py-5 rounded-[2rem] border-2 border-slate-100 text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                >
                  Mantener Proyecto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default ProjectDetail;
