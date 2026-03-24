
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
import { notificationService } from '../services/notificationService';

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
              <span className={`px-3 md:px-4 py-1.5 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] shadow-lg ${
                project.status?.toLowerCase() === 'active' ? 'bg-delphi-celadon text-delphi-keppel shadow-delphi-keppel/20' : 
                project.status?.toLowerCase() === 'finished' ? 'bg-delphi-keppel text-white shadow-delphi-keppel/20' : 
                project.status?.toLowerCase() === 'kickoff' ? 'bg-delphi-orange text-white shadow-delphi-orange/20' :
                project.status?.toLowerCase() === 'preparation' ? 'bg-slate-200 text-slate-600 shadow-slate-200/20' :
                project.status?.toLowerCase() === 'archived' ? 'bg-slate-800 text-slate-100' :
                'bg-slate-100 text-slate-400'}`}>
                {project.status?.toLowerCase() === 'preparation' ? 'Preparación' : 
                 project.status?.toLowerCase() === 'kickoff' ? 'Kickoff' : 
                 project.status?.toLowerCase() === 'active' ? 'Activo' : 
                 project.status?.toLowerCase() === 'finished' ? 'Finalizado' : 
                 project.status?.toLowerCase() === 'archived' ? 'Archivado' : 
                 project.status}
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
              {sprintIsLocked && (
                <>
                  <div className="hidden sm:block h-4 w-px bg-slate-200" />
                  <p className="text-delphi-giants font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center gap-2 bg-delphi-giants/10 px-3 py-1 rounded-full animate-pulse">
                    <History className="w-4 h-4" />
                    🔒 Sprint bloqueado por estimación
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {isFacilitator && project.status?.toLowerCase() !== 'finished' && project.status?.toLowerCase() !== 'archived' && (
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={() => setShowConfigModal(true)}
              className="flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:border-delphi-keppel/30 transition-all font-bold"
            >
              <Settings className="w-4 h-4" />
              Configurar
            </button>
            <button
              onClick={() => setShowTaskForm(true)}
              disabled={sprintIsLocked}
              title={sprintIsLocked ? "No se pueden añadir tareas una vez iniciada la estimación" : ""}
              className={`flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl transition-all font-bold ${
                sprintIsLocked 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                  : 'bg-delphi-keppel text-white shadow-delphi-keppel/30 hover:scale-[1.02]'
              }`}
            >
              <Plus className="w-4 h-4" />
              Añadir Tarea
            </button>
            <button
              onClick={() => setShowFinalizeModal(true)}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-slate-900/10 hover:bg-delphi-giants transition-all font-bold md:ml-auto"
            >
              <CheckCircle2 className="w-4 h-4" />
              Finalizar Proyecto
            </button>
            {role === UserRole.ADMIN && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center justify-center gap-3 px-8 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-red-600/20 hover:bg-red-700 transition-all font-bold"
              >
                <X className="w-4 h-4" />
                Eliminar Proyecto
              </button>
            )}
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

      {/* Modal de Configuración del Proyecto */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] md:rounded-[3rem] w-full max-w-xl p-8 md:p-10 shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl md:text-2xl font-black tracking-tight">Configurar Proyecto</h3>
              <button onClick={() => setShowConfigModal(false)} aria-label="Cerrar modal" className="p-2 text-slate-400 hover:text-delphi-giants transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSaveConfig} className="space-y-6">
              {configError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                  <p className="text-red-600 text-sm font-bold">{configError}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <label htmlFor="configName" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Nombre del Proyecto</label>
                <input
                  id="configName"
                  type="text"
                  required
                  value={configForm.name}
                  onChange={(e) => setConfigForm({...configForm, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-delphi-keppel/30"
                  placeholder="Nombre del proyecto"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="configDesc" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Descripción</label>
                <textarea
                  id="configDesc"
                  rows={3}
                  value={configForm.description}
                  onChange={(e) => setConfigForm({...configForm, description: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-delphi-keppel/30"
                  placeholder="Descripción del proyecto..."
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="configUnit" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Unidad de Estimación</label>
                <select
                  id="configUnit"
                  value={configForm.unit}
                  onChange={(e) => setConfigForm({...configForm, unit: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-delphi-keppel/30"
                >
                  <option value="hours">Horas</option>
                  <option value="storyPoints">Puntos de Historia</option>
                  <option value="personDays">Días Persona</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="configMethod" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Método de Estimación</label>
                <select
                  id="configMethod"
                  value={configForm.estimationMethod}
                  onChange={(e) => setConfigForm({...configForm, estimationMethod: e.target.value})}
                  disabled={isMethodImmutable}
                  className={`w-full p-4 rounded-2xl border-2 transition-all outline-none font-black text-xs ${isMethodImmutable ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed' : 'border-slate-100 focus:border-delphi-keppel focus:ring-4 focus:ring-delphi-keppel/10'}`}
                >
                  <option value="wideband-delphi">Wideband Delphi</option>
                  <option value="planning-poker">Planning Poker</option>
                  <option value="three-point">Estimación de Tres Puntos</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">
                  Umbral de Convergencia (CV): {configForm.cvThreshold}
                </label>
                <input
                  type="range"
                  min="0.05"
                  max="0.5"
                  step="0.05"
                  value={configForm.cvThreshold}
                  onChange={(e) => setConfigForm({...configForm, cvThreshold: parseFloat(e.target.value)})}
                  className="w-full"
                />
                <p className="text-[10px] text-slate-500 ml-2">Valores menores indican mayor precisión requerida</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">
                  % Máximo de Outliers: {configForm.maxOutlierPercent}%
                </label>
                <input
                  type="range"
                  min="10"
                  max="50"
                  step="5"
                  value={configForm.maxOutlierPercent}
                  onChange={(e) => setConfigForm({...configForm, maxOutlierPercent: parseInt(e.target.value)})}
                  className="w-full"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="flex-1 py-4 rounded-2xl border-2 border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSavingConfig}
                  className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                    isSavingConfig 
                      ? 'bg-slate-300 text-slate-500' 
                      : 'bg-delphi-keppel text-white hover:scale-[1.02] shadow-lg shadow-delphi-keppel/20'
                  }`}
                >
                  {isSavingConfig ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Navegación por Pestañas */}
      <nav aria-label="Navegación del proyecto" role="tablist" className="flex bg-slate-100/50 p-1.5 md:p-2 rounded-2xl md:rounded-3xl gap-2 md:gap-4 overflow-x-auto no-scrollbar scroll-smooth shadow-inner border border-slate-200/50 backdrop-blur-sm w-fit max-w-full">
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
            className={`flex items-center gap-2 md:gap-3 py-3 md:py-4 px-6 md:px-8 rounded-xl md:rounded-2xl text-[10px] md:text-sm font-black uppercase tracking-[0.1EM] transition-all shrink-0 ${activeTab === tab.id
              ? 'bg-white text-delphi-keppel shadow-sm ring-1 ring-slate-900/5 scale-[1.02]'
              : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
              }`}
          >
            <tab.icon className={`w-4 h-4 md:w-5 md:h-5 ${activeTab === tab.id ? 'opacity-100' : 'opacity-60'}`} />
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative">
        {activeTab === 'tasks' && (
          <div role="tabpanel" id="panel-tasks" aria-labelledby="tab-tasks" className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            <div className="lg:col-span-4 lg:sticky lg:top-8 space-y-6 md:space-y-8">
              <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] md:rounded-[3xl] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 md:p-8 flex flex-col h-full max-h-[80vh]">
                <div className="flex items-center justify-between mb-8 shrink-0">
                  <h3 className="font-black text-xl md:text-2xl tracking-tight text-slate-800">Tareas</h3>
                  <div className="bg-delphi-keppel/10 px-4 py-2 rounded-xl text-[10px] md:text-xs font-black text-delphi-keppel uppercase tracking-widest ring-1 ring-delphi-keppel/20">
                    {tasks.length} items
                  </div>
                </div>

                <div className="space-y-3 md:space-y-4 overflow-y-auto no-scrollbar pb-6 grow">
                  {tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-center px-4">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Activity className="w-6 h-6 text-slate-300" />
                      </div>
                      <p className="text-slate-500 font-bold text-sm">No hay tareas creadas.</p>
                      {isFacilitator && (
                        <p className="text-slate-400 text-xs mt-2">Usa el botón "Añadir Tarea" para comenzar.</p>
                      )}
                    </div>
                  ) : (
                    tasks.map(task => (
                      <button
                        key={task.id}
                        onClick={() => setSelectedTaskId(task.id)}
                        className={`w-full text-left p-4 md:p-5 rounded-2xl md:rounded-[1.5rem] border-2 transition-all duration-300 relative overflow-hidden group ${selectedTaskId === task.id
                          ? 'border-delphi-keppel bg-gradient-to-br from-delphi-keppel/[0.05] to-transparent shadow-sm'
                          : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-[0_4px_20px_rgb(0,0,0,0.03)]'
                          }`}
                      >
                        {selectedTaskId === task.id && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-delphi-keppel rounded-r-full" />
                        )}
                        <div className="flex items-start gap-4">
                          <div className={`shrink-0 mt-1 transition-colors ${selectedTaskId === task.id ? 'text-delphi-keppel' : 'text-slate-300 group-hover:text-slate-400'}`}>
                            {task.status?.toLowerCase() === 'consensus' || task.status?.toLowerCase() === 'finalized' ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                          </div>
                          <div className="flex-1 min-w-0 pr-2">
                            <h4 className={`text-sm md:text-[15px] font-black leading-tight mb-2 truncate ${selectedTaskId === task.id ? 'text-slate-900' : 'text-slate-600'}`}>
                              {task.title}
                            </h4>
                            {task.status?.toLowerCase() === 'consensus' || task.status?.toLowerCase() === 'finalized' ? (
                              <div className="flex items-center gap-2 text-delphi-keppel bg-delphi-keppel/10 w-fit px-3 py-1 rounded-xl ring-1 ring-delphi-keppel/20">
                                <Award className="w-3 h-3" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{task.finalEstimate} {project.unit === 'hours' ? 'h' : project.unit === 'storyPoints' ? 'pts' : 'd'}</span>
                              </div>
                            ) : (
                              <div className="space-y-2 mt-3">
                                {(() => {
                                    if (task.status?.toLowerCase() === 'consensus' || task.status?.toLowerCase() === 'finalized') return null;
                                    
                                    const taskRounds = roundsByTask[task.id] || [];
                                    const totalExperts = project?.expertIds?.length || 1;
                                    const maxRounds = project?.maxRounds || 3;
                                    
                                    const statusValue = (task.status || '').toLowerCase();
                                    if (statusValue === 'pending' || statusValue === 'pendiente') {
                                      return (
                                        <>
                                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-slate-200" style={{ width: '0%' }}></div>
                                          </div>
                                          <div className="flex justify-between items-center mt-1.5">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">PENDIENTE</span>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">0%</span>
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
                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                          <div 
                                            className="h-full bg-gradient-to-r from-delphi-keppel/50 to-delphi-keppel transition-all duration-1000 shadow-[0_0_8px_rgba(43,186,165,0.4)]" 
                                            style={{ width: `${totalProgress}%` }}
                                          ></div>
                                        </div>
                                        <div className="flex justify-between items-center mt-1.5">
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
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {isFacilitator && (
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 md:p-8 rounded-[2rem] border border-white/5 relative overflow-hidden group shadow-xl shadow-slate-900/10">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
                    <ShieldCheck className="w-32 h-32" />
                  </div>
                  <div className="relative z-10">
                    <div className="bg-delphi-keppel/20 w-fit p-3 rounded-2xl mb-4 text-delphi-keppel">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h4 className="flex items-center gap-3 text-white font-black mb-2 text-lg">
                      Facilitador
                    </h4>
                    <p className="text-sm text-slate-400 font-medium">
                      Supervisión activa del flujo iterativo y consensos.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-8 space-y-10 min-h-[500px]">
              {currentTask ? (
                <div className="animate-in fade-in slide-in-from-right-8 duration-500">
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
                  />
                </div>
              ) : (
                <div className="h-full min-h-[60vh] bg-white/50 backdrop-blur-3xl rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-8 shadow-sm">
                  <div className="relative">
                    <div className="absolute inset-0 bg-delphi-keppel/20 blur-3xl rounded-full scale-150 animate-pulse" />
                    <div className="bg-white p-8 rounded-full shadow-xl shadow-slate-200/50 relative z-10 animate-bounce cursor-default" style={{ animationDuration: '3s' }}>
                      <Star className="w-12 h-12 md:w-16 md:h-16 text-slate-300" />
                    </div>
                  </div>
                  <div className="text-center space-y-2 relative z-10">
                    <p className="font-black text-2xl md:text-3xl tracking-tight text-slate-800">Selecciona una tarea</p>
                    <p className="font-medium text-slate-500">Elige una tarea de la lista para ver o iniciar su debate y estimación.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab !== 'tasks' && (
          <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`} className="lg:col-span-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] md:rounded-[3rem] w-full max-w-md p-8 md:p-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center gap-6">
              <div className="w-20 h-20 bg-delphi-keppel/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-delphi-keppel" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-black tracking-tight mb-2">¿Finalizar Proyecto?</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  Esta acción cerrará el proyecto de estimación. Ya no se podrán añadir nuevas tareas ni realizar nuevas estimaciones.
                </p>
              </div>
              <div className="w-full flex flex-col gap-3">
                <button 
                  onClick={handleFinalizeProject}
                  disabled={isFinalizing}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-delphi-giants transition-all disabled:opacity-50"
                >
                  {isFinalizing ? 'Finalizando...' : 'Sí, Finalizar Proyecto'}
                </button>
                <button 
                  onClick={() => setShowFinalizeModal(false)}
                  disabled={isFinalizing}
                  className="w-full bg-slate-50 text-slate-500 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white border border-slate-100 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] md:rounded-[3rem] w-full max-w-md p-8 md:p-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center gap-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-black tracking-tight mb-2">¿Eliminar Proyecto?</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  Esta acción realizará un borrado lógico del proyecto. El proyecto dejará de ser visible en las listas generales, pero sus datos se conservarán en los registros de auditoría para el administrador.
                </p>
              </div>
              <div className="w-full flex flex-col gap-3">
                <button 
                  onClick={handleDeleteProject}
                  disabled={isDeleting}
                  className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-50"
                >
                  {isDeleting ? 'Eliminando...' : 'Sí, Eliminar de los Registros'}
                </button>
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="w-full bg-slate-50 text-slate-500 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white border border-slate-100 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
