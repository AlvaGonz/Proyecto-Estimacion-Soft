import { useState, useCallback, useRef, useEffect } from 'react';
import { z } from 'zod';
import { Estimation, Round, ConvergenceAnalysis, EstimationMethod } from '../../../../types';
import { estimationService } from '../../estimations/services/estimationService';
import { roundService } from '../services/roundService';
import { convergenceService, type ConvergenceResult } from '../../convergence/services/convergenceService';
import { notificationService } from '../../notifications/services/notificationService';
import { projectService } from '../../projects/services/projectService';
import { taskService } from '../../tasks/services/taskService';
import { estimationSchema } from '../../../shared/utils/schemas';

export const useEstimationActions = (
  projectId: string,
  taskId: string,
  taskTitle: string,
  currentUserId: string,
  isFacilitator: boolean,
  activeRound: Round | null,
  totalExperts: number,
  unit: string,
  onTaskFinalize?: (taskId: string) => void
) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errors, setErrors] = useState<{ value?: string; justification?: string; submit?: string }>({});
  const [userActiveEstimation, setUserActiveEstimation] = useState<Estimation | null>(null);
  const [justification, setJustification] = useState('');
  const [analysis, setAnalysis] = useState<ConvergenceAnalysis | null>(null);
  const [convergenceResult, setConvergenceResult] = useState<ConvergenceResult | null>(null);
  
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // Fetch active user estimation when active round changes
  useEffect(() => {
    const fetchActiveUserEst = async () => {
      if (!activeRound || isFacilitator) {
        if (isMounted.current) setUserActiveEstimation(null);
        return;
      }
      
      const activeId = activeRound.id || (activeRound as any)._id;
      try {
        const roundEsts = await estimationService.getEstimationsByRound(activeId);
        const myEst = roundEsts.find(e => {
          const eId = typeof e.expertId === 'object' && e.expertId !== null ? (e.expertId as any)._id || (e.expertId as any).id : e.expertId || (e as any).userId;
          return String(eId) === String(currentUserId);
        });
        
        if (myEst && isMounted.current) {
          setUserActiveEstimation(myEst);
          setJustification(myEst.justification || '');
        } else if (isMounted.current) {
          setUserActiveEstimation(null);
          setJustification('');
        }
      } catch (err) {
        console.error("Error fetching user active estimation", err);
      }
    };
    fetchActiveUserEst();
  }, [activeRound, currentUserId, isFacilitator]);

  const handleSubmitEstimate = useCallback(async (
    value: number | null,
    justificationText: string,
    estimationMethod: EstimationMethod,
    metodoData: any,
    forceUpdate = false
  ) => {
    if (!activeRound || value === null || value <= 0 || justificationText.length < 10) return false;

    try {
      estimationSchema.parse({ value, justification: justificationText });
      setErrors({});

      const activeId = activeRound.id || (activeRound as any)._id;
      const existingEst = userActiveEstimation;

      setIsAnalyzing(true);

      let newEst: Estimation;
      if (existingEst) {
        newEst = await estimationService.updateEstimation(existingEst.id, value, justificationText, metodoData);
        if (isMounted.current) setUserActiveEstimation(newEst);
      } else {
        newEst = await estimationService.submitEstimation(activeId, value, justificationText, metodoData);
        if (isMounted.current) setUserActiveEstimation(newEst);
      }
      
      // Notifications
      try {
        const project = await projectService.getProject(projectId);
        if (project.facilitatorId !== currentUserId) {
          notificationService.addNotification({
            type: 'expert_submission',
            message: `Un experto ha ${existingEst ? 'actualizado' : 'enviado'} una estimación para "${taskTitle}".`,
            projectId,
            taskId,
            targetUserId: project.facilitatorId
          });
        }
      } catch (notifErr) {
        console.warn('Notification failed:', notifErr);
      }

      setJustification('');
      return true;
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          const path = err.path[0];
          if (path && typeof path === 'string') newErrors[path] = err.message;
        });
        setErrors(newErrors);
      } else {
        setErrors({ submit: error.message || 'Error submitting estimation' });
      }
      return false;
    } finally {
      setIsAnalyzing(false);
    }
  }, [activeRound, currentUserId, isFacilitator, projectId, taskId, taskTitle, userActiveEstimation]);

  const handleCloseRound = useCallback(async (activeRoundId: string, currentRoundEsts: Estimation[]) => {
    try {
      setIsAnalyzing(true);
      const { round, analysis: analysisResult } = await roundService.closeRound(activeRoundId);
      
      if (isMounted.current) {
        setAnalysis(analysisResult);
        const cv = convergenceService.calculateCV(currentRoundEsts);
        const outlierIds = round.stats?.outlierEstimationIds || [];
        const convResult = convergenceService.evaluateConvergence(cv, currentRoundEsts.length, outlierIds.length);
        setConvergenceResult(convResult);
      }

      // Notifications
      try {
        const project = await projectService.getProject(projectId);
        const targetIds = [project.facilitatorId, ...(project.expertIds || [])].filter(id => id !== currentUserId);
        targetIds.forEach(targetId => {
          notificationService.addNotification({
            type: 'round_closed',
            message: `Ronda de "${taskTitle}" cerrada.`,
            projectId, taskId, targetUserId: String(targetId)
          });
        });
      } catch (notifErr) { console.warn(notifErr); }

      return { round, analysis: analysisResult };
    } catch (err: any) {
      setErrors({ submit: err.message || 'Failed to close round.' });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [projectId, taskId, taskTitle, currentUserId]);

  const handleStartNextRound = useCallback(async () => {
    try {
      setIsAnalyzing(true);
      const nextRound = await roundService.openRound(projectId, taskId);
      if (isMounted.current) {
        setAnalysis(null);
        setConvergenceResult(null);
      }
      return nextRound;
    } catch (err: any) {
      alert(err.message || 'Failed opening round');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [projectId, taskId]);

  const handleFinalizeTask = useCallback(async () => {
    try {
      setIsAnalyzing(true);
      await taskService.finalizeTask(projectId, taskId);
      if (onTaskFinalize) onTaskFinalize(taskId);
    } catch (err: any) {
      alert(err.message || 'Error al finalizar la tarea');
    } finally {
      setIsAnalyzing(false);
    }
  }, [projectId, taskId, onTaskFinalize]);

  return {
    isAnalyzing,
    errors,
    setErrors,
    userActiveEstimation,
    justification,
    setJustification,
    analysis,
    setAnalysis,
    convergenceResult,
    setConvergenceResult,
    handleSubmitEstimate,
    handleCloseRound,
    handleStartNextRound,
    handleFinalizeTask
  };
};
