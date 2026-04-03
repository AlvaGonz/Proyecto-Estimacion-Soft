import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Project, Task, Round, UserRole, AuditEntry } from '../../../types';
import { projectService } from '../services/projectService';
import { taskService } from '../../../features/tasks/services/taskService';
import { roundService } from '../../../features/rounds/services/roundService';
import { notificationService } from '../../../features/notifications/services/notificationService';
import { toast } from 'react-hot-toast';

export interface ProjectDetailState {
  activeTab: 'tasks' | 'docs' | 'discussion' | 'team' | 'audit';
  project: Project | null;
  tasks: Task[];
  selectedTaskId: string | null;
  showTaskForm: boolean;
  showConfigModal: boolean;
  newTaskTitle: string;
  newTaskDesc: string;
  isLoading: boolean;
  activeRound: Round | null;
  logs: AuditEntry[];
  showFinalizeModal: boolean;
  isFinalizing: boolean;
  showDeleteModal: boolean;
  isDeleting: boolean;
  sprintIsLocked: boolean;
  roundsByTask: Record<string, Round[]>;
  sidebarWidth: number;
  isSidebarCollapsed: boolean;
  isResizing: boolean;
  configForm: {
    name: string;
    description: string;
    unit: string;
    estimationMethod: string;
    cvThreshold: number;
    maxOutlierPercent: number;
  };
  isSavingConfig: boolean;
  configError: string;
}

export const useProjectDetail = (projectId: string, role: UserRole, currentUserId: string, onBack: () => void) => {
  const [state, setState] = useState<ProjectDetailState>({
    activeTab: 'tasks',
    project: null,
    tasks: [],
    selectedTaskId: null,
    showTaskForm: false,
    showConfigModal: false,
    newTaskTitle: '',
    newTaskDesc: '',
    isLoading: true,
    activeRound: null,
    logs: [],
    showFinalizeModal: false,
    isFinalizing: false,
    showDeleteModal: false,
    isDeleting: false,
    sprintIsLocked: false,
    roundsByTask: {},
    sidebarWidth: 360,
    isSidebarCollapsed: false,
    isResizing: false,
    configForm: {
      name: '',
      description: '',
      unit: 'hours',
      estimationMethod: 'wideband-delphi',
      cvThreshold: 0.25,
      maxOutlierPercent: 30
    },
    isSavingConfig: false,
    configError: ''
  });

  const containerRef = useRef<HTMLDivElement>(null);

  const updateState = (updates: Partial<ProjectDetailState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const isFacilitator = role === UserRole.FACILITATOR || role === UserRole.ADMIN;

  const startResizing = useCallback(() => {
    if (state.isSidebarCollapsed) updateState({ isSidebarCollapsed: false });
    updateState({ isResizing: true });
  }, [state.isSidebarCollapsed]);

  const stopResizing = useCallback(() => {
    updateState({ isResizing: false });
  }, []);

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (state.isResizing && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth = mouseMoveEvent.clientX - containerRect.left;
        if (newWidth > 280 && newWidth < 800) {
          updateState({ sidebarWidth: newWidth });
        }
      }
    },
    [state.isResizing]
  );

  useEffect(() => {
    if (state.isResizing) {
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
  }, [state.isResizing, resize, stopResizing]);

  const fetchData = useCallback(async () => {
    try {
      updateState({ isLoading: true });
      const [proj, taskList] = await Promise.all([
        projectService.getProject(projectId),
        taskService.getTasks(projectId)
      ]);
      
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
      
      setState(prev => ({
        ...prev,
        project: proj,
        tasks: taskList,
        roundsByTask: roundsMap,
        sprintIsLocked: hasEstimation,
        isLoading: false,
        selectedTaskId: prev.selectedTaskId || (taskList.length > 0 ? taskList[0].id : null)
      }));

    } catch (err) {
      console.error("Error fetching project details", err);
      updateState({ isLoading: false });
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const auditLogs = await projectService.getAuditLogs(projectId);
        updateState({ logs: auditLogs });
      } catch (err) {
        console.error("Failed to fetch logs", err);
      }
    };
    if (state.activeTab === 'audit') {
      fetchLogs();
    }
  }, [projectId, state.activeTab]);

  useEffect(() => {
    if (state.project && !state.isLoading) {
      const isParticipant = isFacilitator || (state.project.expertIds && state.project.expertIds.includes(currentUserId));

      if (!isParticipant) {
        notificationService.addNotification({
          type: 'system',
          message: 'No tienes permiso para acceder a este proyecto.'
        });
        onBack();
        return;
      }

      if (role === UserRole.EXPERT && (state.project.status === 'active' || state.project.status === 'kickoff')) {
        updateState({ activeTab: 'tasks' });
      }
    }
  }, [state.project, state.isLoading, role, currentUserId, isFacilitator, onBack]);

  useEffect(() => {
    if (state.project && state.showConfigModal) {
      updateState({
        configForm: {
          name: state.project.name || '',
          description: state.project.description || '',
          unit: state.project.unit || 'hours',
          estimationMethod: state.project.estimationMethod || 'wideband-delphi',
          cvThreshold: state.project.convergenceConfig?.cvThreshold || 0.25,
          maxOutlierPercent: (state.project.convergenceConfig?.maxOutlierPercent || 0.30) * 100
        },
        configError: ''
      });
    }
  }, [state.project, state.showConfigModal]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.configForm.name.trim()) {
      updateState({ configError: 'El nombre del proyecto es requerido' });
      return;
    }
    
    updateState({ isSavingConfig: true, configError: '' });
    
    try {
      const updated = await projectService.updateProject(projectId, {
        name: state.configForm.name,
        description: state.configForm.description,
        unit: state.configForm.unit,
        estimationMethod: state.configForm.estimationMethod,
        convergenceConfig: {
          cvThreshold: state.configForm.cvThreshold,
          maxOutlierPercent: state.configForm.maxOutlierPercent / 100
        }
      });
      
      updateState({ project: updated, showConfigModal: false });
      toast.success('Configuración actualizada');
    } catch (err: any) {
      updateState({ configError: err.message || 'Error al guardar la configuración' });
    } finally {
      updateState({ isSavingConfig: false });
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.newTaskTitle || !state.newTaskDesc || state.sprintIsLocked) return;
    try {
      const newTask = await taskService.createTask(projectId, {
        title: state.newTaskTitle,
        description: state.newTaskDesc,
      });
      updateState({
        tasks: [...state.tasks, newTask],
        roundsByTask: { ...state.roundsByTask, [newTask.id]: [] },
        newTaskTitle: '',
        newTaskDesc: '',
        showTaskForm: false,
        selectedTaskId: newTask.id
      });
      toast.success('Tarea añadida con éxito');
    } catch (err) {
      console.error("Error", err);
      toast.error("Error creando la tarea");
    }
  };

  const handleTaskConsensus = (finalValue: number) => {
    if (!state.selectedTaskId) return;
    updateState({
      tasks: state.tasks.map(t =>
        t.id === state.selectedTaskId
          ? { ...t, status: 'consensus', finalEstimate: finalValue, completionPercentage: 100 }
          : t
      )
    });
  };

  const handleTaskFinalize = async (taskId: string) => {
    try {
      const updatedTasks = await taskService.getTasks(projectId);
      const updatedRounds = await roundService.getRoundsByTask(projectId, taskId);
      
      const newRoundsByTask = { ...state.roundsByTask, [taskId]: updatedRounds };
      let newSprintLocked = state.sprintIsLocked;
      
      if (updatedRounds.some(r => r.estimations && r.estimations.length > 0)) {
        newSprintLocked = true;
      }

      updateState({
        tasks: updatedTasks,
        roundsByTask: newRoundsByTask,
        sprintIsLocked: newSprintLocked
      });
    } catch (err) {
      console.error("Error refreshing tasks after finalization", err);
    }
  };

  const handleFinalizeProject = async () => {
    if (!state.project) return;
    try {
      updateState({ isFinalizing: true });
      const updated = await projectService.updateProject(projectId, { status: 'finished' });
      
      const targetIds = [state.project.facilitatorId, ...(state.project.expertIds || [])]
        .filter(id => id !== currentUserId);
      
      targetIds.forEach(targetId => {
        notificationService.addNotification({
          type: 'system',
          message: `Proyecto "${state.project?.name}" finalizado con éxito. Reportes disponibles.`,
          projectId: state.project?.id,
          targetUserId: String(targetId)
        });
      });

      updateState({ project: updated, showFinalizeModal: false });
      toast.success('Proyecto finalizado');
    } catch (err: any) {
      toast.error(err.message || "Error al finalizar el proyecto");
    } finally {
      updateState({ isFinalizing: false });
    }
  };

  const handleDeleteProject = async () => {
    if (!state.project) return;
    try {
      updateState({ isDeleting: true });
      await projectService.deleteProject(projectId);
      
      const allIds = [state.project.facilitatorId, ...(state.project.expertIds || [])];
      const targetIds = allIds
        .map(id => (typeof id === 'object' && id !== null ? (id as any).id || (id as any)._id : id))
        .filter(id => id && String(id) !== String(currentUserId));
      
      targetIds.forEach(targetId => {
        notificationService.addNotification({
          type: 'system',
          message: `El proyecto "${state.project?.name}" ha sido eliminado por el administrador.`,
          projectId,
          targetUserId: String(targetId)
        });
      });

      onBack();
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar el proyecto");
    } finally {
      updateState({ isDeleting: false, showDeleteModal: false });
    }
  };

  return {
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
  };
};
