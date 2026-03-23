import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Plus,
  LineChart,
  Sparkles,
  History,
  TrendingUp,
  AlertTriangle,
  BarChart2,
  BrainCircuit,
  CheckCircle2,
  Lock,
  MessageSquare,
  Users,
  Target,
  Bell,
  X,
  ShieldAlert,
  BarChart3
} from 'lucide-react';
import { Estimation, Round, ConvergenceAnalysis, type EstimationMethod, type FibonacciCard } from '../types';
import { DelphiInput, PokerCards, ThreePointInput } from './estimation-methods';
import { calculateRoundStats } from '../utils/statistics';
import { analyzeConsensus } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart as ReLineChart, Line } from 'recharts';
import { EmptyState } from './ui/EmptyState';
import { estimationSchema, threePointSchema } from '../utils/schemas';
import { z } from 'zod';
import { roundService } from '../services/roundService';
import { estimationService } from '../services/estimationService';
import { convergenceService, type ConvergenceResult, type EstimationWithExpert } from '../services/convergence.service';
import { taskService } from '../services/taskService';
import { projectService } from '../services/projectService';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { AppErrorBoundary } from './ui/AppErrorBoundary';
// Static import — avoids silent failures from dynamic import() in notification handlers
import { notificationService } from '../services/notificationService';

interface EstimationRoundsProps {
  projectId: string;
  taskId: string;
  taskTitle: string;
  unit: string;
  onTaskFinalize?: (taskId: string) => void;
  isFacilitator?: boolean;
  currentUserId: string;
}

const METHOD_LABELS: Record<EstimationMethod, string> = {
  'wideband-delphi': 'Wideband Delphi',
  'planning-poker': 'Planning Poker',
  'three-point': 'Tres Puntos',
};

const EstimationRounds: React.FC<EstimationRoundsProps> = ({
  projectId,
  taskId,
  taskTitle,
  unit,
  estimationMethod = 'wideband-delphi',
  onConsensusReached,
  onTaskFinalize,
  isFacilitator = true,
  currentUserId
}) => {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [activeRound, setActiveRound] = useState<Round | null>(null);
  const [estimations, setEstimations] = useState<Estimation[]>([]);
  const [delphiValue, setDelphiValue] = useState<number | ''>('');
  const [pokerCard, setPokerCard] = useState<FibonacciCard | null>(null);
  const [threePoint, setThreePoint] = useState<{ optimistic: number | ''; mostLikely: number | ''; pessimistic: number | '' }>({
    optimistic: '', mostLikely: '', pessimistic: '',
  });
  const [justification, setJustification] = useState('');
  const [analysis, setAnalysis] = useState<ConvergenceAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [convergenceResult, setConvergenceResult] = useState<ConvergenceResult | null>(null);
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  const [showEvolution, setShowEvolution] = useState(false);
  const [showBoxPlot, setShowBoxPlot] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<{ value?: string; justification?: string; submit?: string }>({});
  const [totalExperts, setTotalExperts] = useState<number>(0);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [showCloseConfirmModal, setShowCloseConfirmModal] = useState(false);
  const [showUpdateConfirmModal, setShowUpdateConfirmModal] = useState(false);
  const autoSelectedForTask = useRef<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    projectService.getProject(projectId).then(p => {
      setTotalExperts(p.expertIds?.length || 0);
    });
  }, [projectId]);

  const loadRounds = useCallback(async (showSpinner = true) => {
    if (!taskId || !projectId) return;
    
    if (showSpinner) setIsLoading(true);
    
    try {
      const allRounds = await roundService.getRoundsByTask(projectId, taskId);
      const taskRounds = allRounds.filter(r => String(r.taskId) === String(taskId));
      
      if (isMounted.current) {
        // RF032: Deep comparison or simply only update if counts change to avoid flicker
        setRounds(prev => {
          if (JSON.stringify(prev) === JSON.stringify(taskRounds)) return prev;
          return taskRounds;
        });
        
        const active = taskRounds.find(r => r.status === 'open') || null;
        setActiveRound(active);

        // RF012-020: Auto-select latest round on task change or if no selection
        if (autoSelectedForTask.current !== taskId && taskRounds.length > 0) {
          const latestId = active?.id || (active as any)?._id ||
            (taskRounds[taskRounds.length - 1].id || (taskRounds[taskRounds.length - 1] as any)._id);
          setSelectedRoundId(latestId);
          autoSelectedForTask.current = taskId;
        }
        
        if (active) {
          const roundId = active.id || (active as any)._id;
          const roundEstimations = await estimationService.getEstimationsByRound(roundId);
          setEstimations(prev => {
            if (JSON.stringify(prev) === JSON.stringify(roundEstimations)) return prev;
            return roundEstimations;
          });
        } else if (taskRounds.length > 0) { // If no active round, load estimations for the last closed round
          const lastClosed = taskRounds[taskRounds.length - 1];
          const roundId = lastClosed.id || (lastClosed as any)._id;
          const roundEstimations = await estimationService.getEstimationsByRound(roundId);
          setEstimations(prev => {
            if (JSON.stringify(prev) === JSON.stringify(roundEstimations)) return prev;
            return roundEstimations;
          });
        } else {
          setEstimations([]); // No rounds, no estimations
        }
      }
    } catch (err) {
      console.error("Error loading rounds", err);
    } finally {
      if (isMounted.current && showSpinner) setIsLoading(false);
    }
  }, [projectId, taskId]); // Removed selectedRoundId to prevent flickering cycle

  useEffect(() => {
    isMounted.current = true;
    loadRounds(true);
  }, [loadRounds]);

  useEffect(() => {
    // Polling is only active when there is an open round to follow
    if (!activeRound) return;
    
    const pollInterval = setInterval(() => {
      loadRounds(false); // background refresh
    }, 30000);

    return () => clearInterval(pollInterval);
  }, [loadRounds, !!activeRound]);

  const getSubmitValue = (): number | null => {
    switch (estimationMethod) {
      case 'wideband-delphi':
        return delphiValue === '' ? null : delphiValue;
      case 'planning-poker':
        return pokerCard !== null && typeof pokerCard === 'number' ? pokerCard : null;
      case 'three-point': {
        const o = threePoint.optimistic;
        const m = threePoint.mostLikely;
        const p = threePoint.pessimistic;
        if (o === '' || m === '' || p === '') return null;
        const result = threePointSchema.safeParse({ optimistic: o, mostLikely: m, pessimistic: p });
        if (!result.success) return null;
        return (o + 4 * m + p) / 6;
      }
    }
  };

  const canSubmit = (): boolean => {
    // RF012: Solo expertos pueden registrar estimaciones
    if (isFacilitator) return false;
    const v = getSubmitValue();
    if (v === null || v <= 0) return false;
    if (justification.length < 10) return false;
    return true;
  };

  const hasEstimation = React.useMemo(() => {
    if (!activeRound) return false;
    const activeId = activeRound.id || (activeRound as any)._id;
    return estimations.some(e => {
      const rId = e.roundId || (e as any)._id;
      return String(rId) === String(activeId) && String(e.expertId || (e as any).userId) === String(currentUserId);
    });
  }, [estimations, activeRound, currentUserId]);

  const handleSubmitEstimate = async (forceUpdate?: boolean | React.MouseEvent) => {
    const isForceUpdate = forceUpdate === true;
    const value = getSubmitValue();
    if (!activeRound || value === null || value <= 0 || justification.length < 10) return;

    try {
      estimationSchema.parse({ value, justification });
      setErrors({});

      const activeId = activeRound.id || (activeRound as any)._id;

      // Check if user already submitted - if so, ask for confirmation first
      const existingEst = estimations.find(e => {
        const rId = e.roundId || (e as any)._id;
        return String(rId) === String(activeId) && String(e.expertId || (e as any).userId) === String(currentUserId);
      });

      if (existingEst && !isForceUpdate) {
        setShowUpdateConfirmModal(true);
        return;
      }

      setIsAnalyzing(true);

      const metodoData = estimationMethod === 'three-point'
        ? { ...threePoint }
        : estimationMethod === 'planning-poker'
          ? { card: pokerCard }
          : {};

      let newEst: Estimation;
      if (existingEst) {
        newEst = await estimationService.updateEstimation(existingEst.id, value, justification, metodoData);
        setEstimations(prev => prev.map(e => e.id === existingEst.id ? newEst : e));
      } else {
        newEst = await estimationService.submitEstimation(activeId, value, justification, metodoData);
        setEstimations(prev => [...prev, newEst]);
      }
      
      // RF012: Notify facilitator when an expert submits an estimate.
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
        // Check if all experts have submitted
        const currentRoundEsts = existingEst 
          ? estimations.map(e => e.id === existingEst.id ? newEst : e).filter(e => String(e.roundId) === String(activeId))
          : [...estimations, newEst].filter(e => String(e.roundId) === String(activeId));
          
        if (currentRoundEsts.length === totalExperts) {
          const projectData = await projectService.getProject(projectId);
          const targetIds = [projectData.facilitatorId, ...(projectData.expertIds || [])]
            .map(id => typeof id === 'string' ? id : (id as any).id || (id as any)._id)
            .filter(id => String(id) !== String(currentUserId));
            
          targetIds.forEach(targetId => {
            notificationService.addNotification({
              type: 'system',
              message: `Todos los expertos han completado sus estimaciones para "${taskTitle}".`,
              projectId,
              taskId,
              targetUserId: String(targetId)
            });
          });
        }
      } catch (notifErr) {
        console.warn('Notification dispatch failed (non-critical):', notifErr);
      }

      setDelphiValue('');
      setPokerCard(null);
      setThreePoint({ optimistic: '', mostLikely: '', pessimistic: '' });
      setJustification('');
      setShowUpdateConfirmModal(false);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          const path = err.path[0];
          if (path && typeof path === 'string') newErrors[path] = err.message;
        });
        setErrors(newErrors);
      } else {
        alert(error instanceof Error ? error.message : 'Error submitting estimation');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendReminder = async () => {
    if (!activeRound) return;
    setIsAnalyzing(true);
    try {
      // RS57-RS58: Targeted Reminders to missing experts ONLY
      const projectData = await projectService.getProject(projectId);
      const activeId = activeRound.id || (activeRound as any)._id;
      const roundEstimations = await estimationService.getEstimationsByRound(activeId);
      
      const submittedExpertIds = roundEstimations.map(e => String(e.expertId || (e as any).userId));
      
      const missingExperts = (projectData.expertIds || []).filter(expert => {
        const expertId = typeof expert === 'string' ? expert : (expert as any).id || (expert as any)._id;
        return !submittedExpertIds.includes(String(expertId)) && String(expertId) !== String(currentUserId);
      });

      if (missingExperts.length === 0) {
        alert("Todos los expertos han enviado sus estimaciones.");
        return;
      }

      missingExperts.forEach(expert => {
        const expertId = typeof expert === 'string' ? expert : (expert as any).id || (expert as any)._id;
        
        notificationService.addNotification({
          type: 'reminder',
          message: `Recordatorio: Falta tu estimación para "${taskTitle}" en la ronda ${activeRound.roundNumber}.`,
          projectId,
          taskId,
          targetUserId: String(expertId)
        });
      });

      alert(`Recordatorio enviado a ${missingExperts.length} experto(s) faltantes.`);
    } catch (err) {
      console.error('Error sending reminder:', err);
      alert('Error al enviar el recordatorio.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCloseRound = async () => {
    if (!activeRound) return;

    // Double-confirmation if experts are still missing
    const activeId = activeRound.id || (activeRound as any)._id;
    const currentRoundEstCount = estimations.filter(e => String(e.roundId) === String(activeId)).length;
    
    if (currentRoundEstCount < totalExperts && !showCloseConfirmModal) {
      setShowCloseConfirmModal(true);
      return;
    }
    setShowCloseConfirmModal(false);

    try {
      setIsAnalyzing(true);
      const { round, analysis } = await roundService.closeRound(activeId);

      setRounds(prev => prev.map(r => (r.id || (r as any)._id) === activeId ? round : r));
      setActiveRound(null);
      setSelectedRoundId(activeId);
      setAnalysis(analysis);

      // RF020: Calculate convergence for display
      const roundEsts = await estimationService.getEstimationsByRound(activeId);
      const cv = convergenceService.calculateCV(roundEsts);
      const outlierIds = round.stats?.outlierEstimationIds || [];
      const convResult = convergenceService.evaluateConvergence(
        cv,
        roundEsts.length,
        outlierIds.length
      );
      setConvergenceResult(convResult);

      const updatedEsts = await estimationService.getEstimationsByRound(activeId);
      setEstimations(prev => {
        const others = prev.filter(e => e.roundId !== activeId);
        return [...others, ...updatedEsts];
      });

      // RF014: Notify all participants when round is closed
      try {
        const project = await projectService.getProject(projectId);
        const targetIds = [project.facilitatorId, ...(project.expertIds || [])].filter(id => id !== currentUserId);
        targetIds.forEach(targetId => {
          notificationService.addNotification({
            type: 'round_closed',
            message: `Ronda ${round.roundNumber} de "${taskTitle}" cerrada.`,
            projectId,
            taskId,
            targetUserId: targetId
          });
          if (convResult.converged) {
            notificationService.addNotification({
              type: 'consensus_reached',
              message: `Consenso alcanzado para "${taskTitle}" (${round.stats?.mean.toFixed(1)} ${unit}).`,
              projectId,
              taskId,
              targetUserId: targetId
            });
          }
          notificationService.addNotification({
            type: 'results_revealed',
            message: `Resultados disponibles para "${taskTitle}" (Ronda ${round.roundNumber}).`,
            projectId,
            taskId,
            targetUserId: targetId
          });
        });
      } catch (notifErr) {
        console.warn('Notification dispatch failed (non-critical):', notifErr);
      }
    } catch (err: any) {
      setErrors({ submit: err.message || 'Failed to close round.' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStartNextRound = async () => {
    if (activeRound) return;
    try {
      setIsAnalyzing(true);
      const nextRound = await roundService.openRound(projectId, taskId);
      setRounds(prev => [...prev, nextRound]);
      setActiveRound(nextRound);
      setSelectedRoundId(nextRound.id || (nextRound as any)._id);
      setAnalysis(null);

      // RF014: Notify participants when new round opens
      try {
        const project = await projectService.getProject(projectId);
        const targetIds = [project.facilitatorId, ...(project.expertIds || [])].filter(id => id !== currentUserId);
        targetIds.forEach(targetId => {
          notificationService.addNotification({
            type: 'round_opened',
            message: `Ronda ${nextRound.roundNumber} abierta para "${taskTitle}".`,
            projectId,
            taskId,
            targetUserId: targetId
          });
        });
      } catch (notifErr) {
        console.warn('Notification dispatch failed (non-critical):', notifErr);
      }
    } catch (err: any) {
      alert(err.message || 'Failed opening round');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFinalizeTask = async () => {
    try {
      setIsAnalyzing(true);
      await taskService.finalizeTask(projectId, taskId);
      if (onTaskFinalize) {
        onTaskFinalize(taskId);
      }
    } catch (err: any) {
      alert(err.message || 'Error al finalizar la tarea');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const roundIsOpen = activeRound?.status === 'open';
  const canEstimate = roundIsOpen && !isFacilitator; // Solo expertos pueden estimar
  const canClose = activeRound && isFacilitator; // Solo el facilitador puede cerrar

  const renderEstimationInput = () => {
    switch (estimationMethod) {
      case 'wideband-delphi':
        return (
          <DelphiInput
            value={delphiValue}
            justification={justification}
            unit={unit}
            onChange={(v, j) => { setDelphiValue(v); setJustification(j); }}
            disabled={!canEstimate}
          />
        );
      case 'planning-poker':
        return (
          <PokerCards
            selectedCard={pokerCard}
            justification={justification}
            onChange={(c, j) => { setPokerCard(c); setJustification(j); }}
            disabled={!canEstimate}
          />
        );
      case 'three-point':
        return (
          <ThreePointInput
            values={threePoint}
            justification={justification}
            unit={unit}
            onChange={(v, j) => { setThreePoint(v); setJustification(j); }}
            disabled={!canEstimate}
          />
        );
    }
  };

  const lastClosedRound = [...rounds].reverse().find(r => r.status === 'closed');
  const viewedRound = rounds.find(r => (r.id || (r as any)?._id) === selectedRoundId);
  const currentRoundEstimations = estimations.filter(e => {
    return String(e.roundId) === String(selectedRoundId);
  });

  // RF019: Add anonymous expert labels
  const currentRoundEstimationsWithLabels: EstimationWithExpert[] =
    convergenceService.addAnonymousLabels(currentRoundEstimations);

  // RF020: Calculate convergence when viewing a closed round
  useEffect(() => {
    if (viewedRound?.status === 'closed' && viewedRound.stats && currentRoundEstimations.length > 0) {
      const cv = convergenceService.calculateCV(currentRoundEstimations);
      const convResult = convergenceService.evaluateConvergence(
        cv,
        currentRoundEstimations.length,
        viewedRound.stats.outlierEstimationIds?.length || 0
      );
      setConvergenceResult(convResult);

      const analysisResult = convergenceService.getRecommendation(convResult);
      setAnalysis(analysisResult);
    } else if (viewedRound?.status === 'open') {
      setConvergenceResult(null);
      setAnalysis(null);
    }
  }, [selectedRoundId, currentRoundEstimations.length, viewedRound]);

  const distributionData = currentRoundEstimations
    .reduce((acc: any[], curr) => {
      const existing = acc.find(a => a.name === curr.value);
      if (existing) existing.count += 1;
      else acc.push({ name: curr.value, count: 1 });
      return acc;
    }, [])
    .sort((a, b) => a.name - b.name);

  const evolutionData = rounds
    .filter(r => r.status === 'closed' && r.stats)
    .map(r => ({
      name: `R${r.roundNumber}`,
      media: r.stats?.mean,
      desviacion: r.stats?.stdDev
    }));

  const realTimeStats = useMemo(() => {
    if (!currentRoundEstimations.length) return null;
    const baseStats = calculateRoundStats(currentRoundEstimations);
    
    // Generar metricaResultados según el método
    const metrics: any = {
      mean: baseStats.mean,
      median: baseStats.median,
      standardDeviation: baseStats.stdDev,
      variance: baseStats.variance,
      iqr: baseStats.iqr,
      outliers: baseStats.outlierEstimationIds.length
    };

    if (estimationMethod === 'three-point') {
      const optimisticValues = currentRoundEstimations.map(e => (e as any).threePoint?.optimistic || e.value);
      const likelyValues = currentRoundEstimations.map(e => (e as any).threePoint?.mostLikely || e.value);
      const pessimisticValues = currentRoundEstimations.map(e => (e as any).threePoint?.pessimistic || e.value);
      
      const optAvg = optimisticValues.reduce((a,b)=>a+b,0) / optimisticValues.length;
      const likelyAvg = likelyValues.reduce((a,b)=>a+b,0) / likelyValues.length;
      const pessAvg = pessimisticValues.reduce((a,b)=>a+b,0) / pessimisticValues.length;
      
      metrics.optimisticAvg = Number(optAvg.toFixed(2));
      metrics.mostLikelyAvg = Number(likelyAvg.toFixed(2));
      metrics.pessimisticAvg = Number(pessAvg.toFixed(2));
      metrics.expectedValue = Number(((optAvg + 4 * likelyAvg + pessAvg) / 6).toFixed(2));
    }

    if (estimationMethod === 'planning-poker') {
      const counts: Record<number, number> = {};
      currentRoundEstimations.forEach(e => {
        counts[e.value] = (counts[e.value] || 0) + 1;
      });
      const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]);
      metrics.moda = Number(sorted[0][0]);
      metrics.frecuencia = sorted[0][1];
      metrics.consensoPct = Number(((sorted[0][1] / currentRoundEstimations.length) * 100).toFixed(0));
    }

    return { ...baseStats, metricaResultados: metrics };
  }, [currentRoundEstimations, estimationMethod]);

  const displayedStats = viewedRound?.stats || (viewedRound?.status === 'open' && isFacilitator ? realTimeStats : null);

  const isOutlier = (estimationId: string) => {
    return displayedStats?.outlierEstimationIds?.includes(estimationId) || false;
  };

  if (isLoading) {
    return <div className="h-48 w-full flex items-center justify-center"><LoadingSpinner /></div>;
  }

  return (
    <AppErrorBoundary>
      <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
        {/* Header Responsivo */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-delphi-keppel/10 p-3 rounded-2xl shrink-0">
              <LineChart className="w-6 h-6 md:w-8 md:h-8 text-delphi-keppel" />
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight">{taskTitle}</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-[10px] font-black text-delphi-keppel uppercase tracking-widest">{unit}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Método: {METHOD_LABELS[estimationMethod]}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 overflow-x-auto no-scrollbar w-full sm:w-auto">
              {rounds.map(r => {
                const rId = r.id || (r as any)._id;
                const isSelected = rId === selectedRoundId;
                const isOpen = r.status === 'open';

                return (
                  <button
                    key={rId}
                    onClick={() => setSelectedRoundId(rId)}
                    className={`w-9 h-9 md:w-10 md:h-10 shrink-0 rounded-xl flex items-center justify-center font-black text-[10px] transition-all border-2 ${isSelected
                      ? (isOpen ? 'bg-delphi-keppel text-white border-delphi-keppel' : 'bg-slate-900 text-white border-slate-900 shadow-lg')
                      : 'bg-white border-slate-200 text-slate-400 hover:border-delphi-keppel hover:text-delphi-keppel'
                      }`}
                  >
                    R{r.roundNumber}
                  </button>
                );
              })}
              {!activeRound && (
                <button
                  onClick={handleStartNextRound}
                  aria-label="Nueva ronda"
                  className="w-9 h-9 md:w-10 md:h-10 shrink-0 rounded-xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:text-delphi-keppel transition-all"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-2xl shadow-lg w-full sm:w-auto justify-center">
              <button
                onClick={() => setShowEvolution(!showEvolution)}
                aria-label="Ver evolución"
                className={`p-2 rounded-xl transition-all ${showEvolution ? 'bg-delphi-keppel text-white' : 'text-slate-400'}`}
              >
                <History className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowBoxPlot(!showBoxPlot)}
                aria-label="Ver distribución"
                className={`p-2 rounded-xl transition-all ${showBoxPlot ? 'bg-delphi-keppel text-white' : 'text-slate-400'}`}
              >
                <BarChart2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {(showEvolution || showBoxPlot) && (
          <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
            {showEvolution && (
              <div className="space-y-6">
                <h4 className="text-lg font-black text-slate-900 flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-delphi-keppel" />
                  Evolución
                </h4>
                <div className="h-56 md:h-64 w-full">
                  {evolutionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ReLineChart data={evolutionData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" fontSize={10} />
                        <YAxis fontSize={10} />
                        <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Line type="monotone" dataKey="media" stroke="#2BBAA5" strokeWidth={3} dot={{ r: 4 }} name="Media" />
                        <Line type="monotone" dataKey="desviacion" stroke="#F96635" strokeWidth={2} strokeDasharray="5 5" name="Desv." />
                      </ReLineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-300 italic text-xs">Sin datos aún.</div>
                  )}
                </div>
              </div>
            )}

            {showBoxPlot && (
              <div className={`${showEvolution ? 'mt-8 pt-8 border-t' : ''} space-y-6`}>
                <h4 className="text-lg font-black text-slate-900 flex items-center gap-3">
                  <BarChart2 className="w-5 h-5 text-delphi-giants" />
                  Distribución
                </h4>
                <div className="h-56 md:h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={distributionData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" fontSize={10} />
                      <YAxis fontSize={10} />
                      <Tooltip contentStyle={{ borderRadius: '15px', border: 'none' }} />
                      <Bar dataKey="count" fill="#2BBAA5" radius={[8, 8, 0, 0]} name="Expertos" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Lista de Estimaciones — visible desde la 1ª estimación */}
          <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-black text-slate-900">
                {viewedRound ? `Ronda ${viewedRound.roundNumber}` : 'Resultados'}
              </h4>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {currentRoundEstimations.length}/{totalExperts} Expertos
              </span>
            </div>

            <div className="flex-1 space-y-3 min-h-[200px]">
              {currentRoundEstimationsWithLabels.length === 0 ? (
                <EmptyState
                  icon={<BarChart2 className="w-8 h-8" />}
                  title="Esperando participaciones"
                  description="Aún no hay estimaciones en esta ronda."
                />
              ) : (
                <div className="space-y-3">
                  {currentRoundEstimationsWithLabels.map(est => {
                    const outlier = isOutlier(est.id);
                    // RF019: While round is open, experts only see a placeholder — facilitator sees actual values
                    const roundIsCurrentlyOpen = viewedRound?.status === 'open';
                    const showValue = isFacilitator || !roundIsCurrentlyOpen;
                    return (
                      <div
                        key={est.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          outlier ? 'bg-delphi-giants/5 border-delphi-giants/20' : 'bg-slate-50 border-slate-50 hover:bg-white hover:border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400">{est.expertLabel}</span>
                            {outlier && (
                              <div className="flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-delphi-giants" />
                                <span className="text-[10px] font-black text-delphi-giants uppercase tracking-tighter">Atípico</span>
                              </div>
                            )}
                          </div>
                          {showValue ? (
                            <span className={`text-base font-black ${
                              outlier ? 'text-delphi-giants' : 'text-slate-900'
                            }`}>
                              {est.value} {unit === 'hours' ? 'Horas' : unit === 'storyPoints' ? 'Pts' : 'Días'}
                            </span>
                          ) : (
                            <span className="text-[10px] font-black text-delphi-keppel bg-delphi-keppel/10 px-2 py-1 rounded-lg">Enviada ✓</span>
                          )}
                        </div>
                        {(showValue || est.expertId === currentUserId) && (
                          <p className="text-xs text-slate-500 italic leading-relaxed">"{est.justification || 'Sin comentario'}"</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {canClose && viewedRound?.id === (activeRound?.id || (activeRound as any)?._id) && (
              <div className="mt-6 space-y-2">
                <button
                  onClick={handleCloseRound}
                  disabled={currentRoundEstimations.length < 1 || isAnalyzing}
                  className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-delphi-giants transition-all disabled:opacity-50"
                >
                  {isAnalyzing ? 'Procesando...' : 'Cerrar y Analizar Ronda'}
                </button>
                {errors.submit && <p id="close-error" role="alert" className="text-red-500 text-xs font-bold text-center">{errors.submit}</p>}
                <p className="text-[10px] text-slate-400 text-center font-bold uppercase tracking-widest">
                  Participantes: {currentRoundEstimations.length} de {totalExperts}
                </p>
              </div>
            )}
          </div>

          {/* Panel de Entrada / IA */}
          <div className="space-y-6">
            {activeRound ? (
              <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                <h4 className="text-xl font-black text-slate-900">
                  {isFacilitator ? "Progreso de la Ronda" : "Tu Estimación"}
                </h4>
                <div className="space-y-4">
                  {canEstimate ? (
                    <>
                      {renderEstimationInput()}
                      {errors.value && <p id="value-error" role="alert" className="text-red-500 text-xs mt-1 ml-1">{errors.value}</p>}
                      {errors.justification && <p id="justification-error" role="alert" className="text-red-500 text-xs mt-1 ml-1">{errors.justification}</p>}
                      <button
                        type="button"
                        onClick={handleSubmitEstimate}
                        disabled={!canSubmit()}
                        className="w-full bg-delphi-keppel text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-delphi-keppel/20 hover:scale-[1.02] transition-all disabled:opacity-50"
                      >
                        {hasEstimation ? 'Actualizar Estimación' : 'Enviar Estimación'}
                      </button>
                    </>
                  ) : isFacilitator ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-4">
                      <div className="flex justify-center mb-2">
                        <div className="bg-delphi-keppel/10 p-4 rounded-full">
                          <Users className="w-8 h-8 text-delphi-keppel" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-slate-900 font-black text-sm uppercase tracking-widest">Estado de Participación</p>
                        <p className="text-slate-500 text-xs font-medium leading-relaxed">
                          {estimations.filter(e => e.roundId === activeRound.id).length} de {totalExperts} expertos han estimado en esta ronda.
                          <br />
                          <span className="text-delphi-orange font-bold">
                            Faltan {Math.max(0, totalExperts - estimations.filter(e => e.roundId === activeRound.id).length)} expertos por estimar.
                          </span>
                        </p>
                      </div>
                      <div className="pt-2">
                         <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-delphi-keppel transition-all duration-500" 
                              style={{ width: `${Math.min(100, (estimations.filter(e => e.roundId === activeRound.id).length / (totalExperts || 1)) * 100)}%` }}
                            ></div>
                         </div>
                      </div>
                      {Math.max(0, totalExperts - estimations.filter(e => String(e.roundId) === String(activeRound.id || (activeRound as any)._id)).length) > 0 && (
                        <button
                          onClick={handleSendReminder}
                          className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-delphi-giants/10 text-delphi-giants hover:bg-delphi-giants/20 hover:scale-[1.02] rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                        >
                          <Bell className="w-4 h-4" />
                          Enviar Recordatorio
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
                      <p className="text-slate-500 text-sm font-medium">
                        La ronda está cerrada. Espera a que el facilitador abra una nueva ronda.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : !showBoxPlot ? (
              <div className={`p-6 md:p-8 rounded-[2rem] border transition-all overflow-hidden min-w-0 ${isAnalyzing ? 'bg-slate-50' : 'bg-white shadow-sm'}`}>
                {isAnalyzing ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-4">
                    <Sparkles className="w-10 h-10 text-delphi-keppel animate-pulse" />
                    <p className="font-black text-slate-900 text-sm">Analizando datos...</p>
                  </div>
                ) : analysis ? (
                  <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <BrainCircuit className="w-6 h-6 text-delphi-keppel" />
                        Análisis de Convergencia
                      </h4>
                      {/* RF021: Indicador visual de consenso */}
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${analysis.level === 'Alta' ? 'bg-delphi-keppel text-white' :
                        analysis.level === 'Media' ? 'bg-delphi-vanilla text-delphi-orange' : 'bg-delphi-giants text-white'
                        }`}>
                        {analysis.level === 'Alta' ? 'Convergencia Alta' : analysis.level === 'Media' ? 'Convergencia Media' : 'Convergencia Baja'}
                      </span>
                    </div>
                    {/* RF020: Estadísticas de convergencia */}
                    {/* RF020: Estadísticas de convergencia */}
                    {displayedStats && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100 min-w-0">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">Media</p>
                            <p className="text-base sm:text-lg font-black text-slate-900 truncate">{displayedStats.mean?.toFixed(2) || '-'}</p>
                          </div>
                          <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100 min-w-0">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">Mediana</p>
                            <p className="text-base sm:text-lg font-black text-slate-900 truncate">{displayedStats.median?.toFixed(2) || '-'}</p>
                          </div>
                          <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100 min-w-0">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">Desv. (σ)</p>
                            <p className="text-base sm:text-lg font-black text-slate-900 truncate">{displayedStats.stdDev?.toFixed(2) || '-'}</p>
                          </div>
                          <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100 min-w-0">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">CV</p>
                            <p className={`text-base sm:text-lg font-black truncate ${(displayedStats.coefficientOfVariation || (displayedStats as any).cv || 0) <= 0.15 ? 'text-delphi-keppel' : (displayedStats.coefficientOfVariation || (displayedStats as any).cv || 0) <= 0.30 ? 'text-delphi-orange' : 'text-delphi-giants'}`}>
                              {((displayedStats.coefficientOfVariation || (displayedStats as any).cv || 0) * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100 min-w-0">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">Varianza</p>
                            <p className="text-xs sm:text-sm font-black text-slate-600 truncate">{displayedStats.variance?.toFixed(2) || '-'}</p>
                          </div>
                          <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100 min-w-0">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">Rango</p>
                            <p className="text-xs sm:text-sm font-black text-slate-600 truncate">
                              {displayedStats.range ? `${displayedStats.range[0]} - ${displayedStats.range[1]}` : '-'}
                            </p>
                          </div>
                          <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100 min-w-0">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">IQR</p>
                            <p className="text-xs sm:text-sm font-black text-slate-600 truncate">{displayedStats.iqr?.toFixed(2) || '-'}</p>
                          </div>
                          <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100 min-w-0">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">Atípicos</p>
                            <p className="text-xs sm:text-sm font-black text-slate-600 truncate">{displayedStats.outlierEstimationIds?.length || 0}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className={`p-5 rounded-2xl border-l-4 transition-all ${
                      analysis.level === 'Alta' ? 'bg-delphi-keppel/5 border-delphi-keppel' : 
                      analysis.level === 'Media' ? 'bg-delphi-vanilla border-delphi-orange' : 'bg-delphi-giants/5 border-delphi-giants'
                    }`}>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Recomendación del Jefe de Proyecto</p>
                      <p className="text-xs font-bold text-slate-900 leading-relaxed italic">
                        "{analysis.level === 'Alta' ? 'Excelente alineación técnica. Los expertos están en consenso.' : 
                          analysis.level === 'Media' ? 'Existe una ligera discrepancia. Se recomienda una breve discusión para alinear criterios.' : 
                          'Divergencia significativa detectada. Es imperativo revisar los requisitos y realizar un nuevo debate.'}"
                      </p>
                      <p className="text-[11px] font-medium text-slate-600 mt-3 leading-relaxed">
                        {analysis.recommendation}
                      </p>
                    </div>

                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-100">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-2">AI Implementation Insights</span>
                      {analysis.aiInsights}
                    </p>

                    {/* RF015b/c: Resultados específicos del método */}
                    {displayedStats?.metricaResultados && (
                      <div className="bg-slate-900 text-white p-6 rounded-[2rem] border border-white/5 space-y-4 animate-in slide-in-from-top-4 shadow-xl">
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-delphi-keppel border-b border-white/10 pb-3 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4" />
                          Métricas {estimationMethod === 'planning-poker' ? 'Planning Poker' : estimationMethod === 'three-point' ? 'Three-Point' : 'Delphi'}
                          {viewedRound?.status === 'open' && (
                            <span className="ml-auto text-[8px] bg-delphi-keppel/20 text-delphi-keppel px-2 py-0.5 rounded-full animate-pulse">
                              Tiempo Real
                            </span>
                          )}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                          {Object.entries(displayedStats.metricaResultados)
                            .filter(([key]) => key !== 'distribucion') // RF031 Skip distribution object
                            .map(([key, val]) => (
                              <div key={key} className="flex justify-between items-center text-[10px] md:text-xs py-1.5 border-b border-white/5 min-w-0">
                                <span className="text-slate-400 font-bold uppercase tracking-wider shrink mr-2 truncate max-w-[65%]">
                                  {key === 'moda' ? 'Moda' :
                                    key === 'frecuencia' ? 'Frecuencia' :
                                      key === 'consensoPct' ? 'Consenso' :
                                        key === 'expectedValue' ? 'Valor Esperado' :
                                          key === 'standardDeviation' ? 'Desviación' :
                                            key === 'optimisticAvg' ? 'Promedio Opt.' :
                                              key === 'mostLikelyAvg' ? 'Promedio Prob.' :
                                                key === 'mean' ? 'Media' :
                                                  key === 'median' ? 'Mediana' :
                                                    key === 'pessimisticAvg' ? 'Promedio Pes.' : key}
                                </span>
                                <span className="font-black text-delphi-keppel text-right shrink-0">
                                  {typeof val === 'number' 
                                    ? (key === 'consensoPct' ? `${val.toFixed(0)}%` : val.toFixed(2)) 
                                    : String(val)}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-4 flex flex-col sm:flex-row gap-3">
                      {isFacilitator && rounds.length > 0 && (
                        <button onClick={handleFinalizeTask} className="flex-1 bg-delphi-keppel text-white py-3 rounded-xl font-black text-[9px] uppercase tracking-widest">
                          Finalizar Tarea
                        </button>
                      )}
                      <button onClick={handleStartNextRound} className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-black text-[9px] uppercase tracking-widest">
                        Nueva Ronda
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-300 italic text-xs">
                    Cierra la ronda para el análisis.
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Inline results summary — visible whenever the viewed round has at least 1 estimation */}
      {viewedRound && currentRoundEstimations.length > 0 && (
        <div className="bg-slate-900 text-white p-5 rounded-[2rem] border border-white/10 flex flex-wrap items-center justify-between gap-4 overflow-hidden relative animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-delphi-keppel rounded-l-[2rem]" />
          <div className="flex items-center gap-4 pl-3">
            <div className="bg-delphi-keppel/20 p-3 rounded-2xl shrink-0">
              <Target className="w-5 h-5 text-delphi-keppel" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Resultado Ronda {viewedRound.roundNumber}</p>
              <h5 className="text-base font-black flex items-center gap-2">
                {viewedRound.status === 'closed'
                  ? <>{viewedRound.stats?.mean?.toFixed(1) || '-'} {unit === 'hours' ? 'h' : unit === 'storyPoints' ? 'pts' : 'd'}</>
                  : <span className="text-sm text-slate-300">{currentRoundEstimations.length} estimaciones recibidas…</span>
                }
                {viewedRound.status === 'closed' && analysis?.level && (
                  <span className={`text-[8px] px-2 py-0.5 rounded-md font-black uppercase ${
                    analysis.level === 'Alta' ? 'bg-delphi-keppel' :
                    analysis.level === 'Media' ? 'bg-delphi-orange' : 'bg-delphi-giants'
                  }`}>{analysis.level}</span>
                )}
              </h5>
            </div>
          </div>

          <div className="flex items-center gap-6 border-l border-white/10 pl-6">
            {viewedRound.status === 'closed' && convergenceResult && (
              <>
                <div className="text-center">
                  <p className="text-[8px] font-black uppercase tracking-tighter text-slate-400">CV</p>
                  <p className="text-sm font-black text-delphi-keppel">{(convergenceResult.cv * 100).toFixed(0)}%</p>
                </div>
                <div className="text-center">
                  <p className="text-[8px] font-black uppercase tracking-tighter text-slate-400">Atípicos</p>
                  <p className="text-sm font-black text-delphi-orange">{convergenceResult.outlierCount}</p>
                </div>
              </>
            )}
            {isFacilitator && !activeRound && viewedRound.status === 'closed' && (
              <button
                onClick={handleStartNextRound}
                disabled={isAnalyzing}
                className="bg-white text-slate-900 p-2.5 rounded-xl hover:bg-delphi-keppel hover:text-white transition-all shadow-lg"
                title="Nueva Ronda"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Update Estimation Confirm Modal */}
      {showUpdateConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-300 space-y-6">
            <div className="flex items-center gap-4">
              <div className="bg-delphi-keppel/10 p-4 rounded-2xl shrink-0">
                <Target className="w-8 h-8 text-delphi-keppel" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Actualizar Estimación</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  ¿Estás seguro de que deseas actualizar tu estimación para esta ronda?
                </p>
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-700 leading-relaxed">
                Tu estimación anterior será reemplazada por los nuevos valores proporcionados. El análisis de convergencia se recalculará automáticamente.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUpdateConfirmModal(false)}
                className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSubmitEstimate(true)}
                className="flex-1 py-3 rounded-xl bg-delphi-keppel text-white font-black text-xs uppercase tracking-widest hover:scale-[1.02] shadow-lg shadow-delphi-keppel/20 transition-all"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Double-confirmation modal — close round with missing experts */}
      {showCloseConfirmModal && activeRound && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-300 space-y-6">
            <div className="flex items-center gap-4">
              <div className="bg-delphi-giants/10 p-4 rounded-2xl shrink-0">
                <ShieldAlert className="w-8 h-8 text-delphi-giants" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">¿Cerrar ronda incompleta?</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Ronda {activeRound.roundNumber} — {totalExperts - estimations.filter(e => String(e.roundId) === String(activeRound.id || (activeRound as any)._id)).length} experto(s) aún no han enviado su estimación.
                </p>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-xs font-bold text-amber-700 leading-relaxed">
                ⚠️ Cerrar la ronda ahora eliminará la posibilidad de que los expertos restantes participen. El análisis de convergencia podría ser menos preciso.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCloseConfirmModal(false)}
                className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleCloseRound}
                className="flex-1 py-3 rounded-xl bg-delphi-giants text-white font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg"
              >
                Cerrar de Todas Formas
              </button>
            </div>
          </div>
        </div>
      )}
    </AppErrorBoundary>
  );
};


export default EstimationRounds;
