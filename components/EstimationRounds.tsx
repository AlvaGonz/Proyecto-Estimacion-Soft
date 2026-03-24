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
  BarChart3,
  Calculator
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
  const [userActiveEstimation, setUserActiveEstimation] = useState<Estimation | null>(null);
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

  // RF: Implement safe edit flow - handle active round estimation independently of viewed results
  useEffect(() => {
    const fetchActiveUserEst = async () => {
      if (!activeRound || isFacilitator) {
        setUserActiveEstimation(null);
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
          if (estimationMethod === 'wideband-delphi') {
            setDelphiValue(myEst.value);
          } else if (estimationMethod === 'planning-poker') {
            setPokerCard((myEst.metodoData?.card ?? myEst.value) as any);
          } else if (estimationMethod === 'three-point') {
            if (myEst.metodoData) {
              setThreePoint({
                optimistic: myEst.metodoData.optimistic ?? '',
                mostLikely: myEst.metodoData.mostLikely ?? '',
                pessimistic: myEst.metodoData.pessimistic ?? ''
              });
            }
          }
        } else if (isMounted.current) {
          setUserActiveEstimation(null);
          setJustification('');
          setDelphiValue('');
          setPokerCard(null);
          setThreePoint({ optimistic: '', mostLikely: '', pessimistic: '' });
        }
      } catch (err) {
        console.error("Error fetching user active estimation", err);
      }
    };
    
    fetchActiveUserEst();
  }, [activeRound, currentUserId, estimationMethod, isFacilitator]);

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
          const activeId = active.id || (active as any)._id;
          // If we're polling and looking at the active round, refresh the estimations list
          if (String(selectedRoundId) === String(activeId)) {
            const roundEstimations = await estimationService.getEstimationsByRound(activeId);
            setEstimations(prev => {
              if (JSON.stringify(prev) === JSON.stringify(roundEstimations)) return prev;
              return roundEstimations;
            });
          }
        } else if (taskRounds.length > 0 && !selectedRoundId) { 
          // Default to last closed round if no active round and no selection
          const lastClosed = taskRounds[taskRounds.length - 1];
          const roundId = lastClosed.id || (lastClosed as any)._id;
          setSelectedRoundId(roundId);
        }
      }
    } catch (err) {
      console.error("Error loading rounds", err);
    } finally {
      if (isMounted.current && showSpinner) setIsLoading(false);
    }
  }, [projectId, taskId, selectedRoundId]); 

  useEffect(() => {
    isMounted.current = true;
    loadRounds(true);
  }, [loadRounds]);

  // Load estimations for ANY selected round
  useEffect(() => {
    const fetchRoundEsts = async () => {
      if (!selectedRoundId) return;
      try {
        const ests = await estimationService.getEstimationsByRound(selectedRoundId);
        if (isMounted.current) setEstimations(ests);
      } catch (err) {
        console.error("Error fetching round estimations", err);
      }
    };
    fetchRoundEsts();
  }, [selectedRoundId]);

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

  const hasEstimation = !!userActiveEstimation;

  const handleSubmitEstimate = async (forceUpdate?: boolean | React.MouseEvent) => {
    const isForceUpdate = forceUpdate === true;
    const value = getSubmitValue();
    if (!activeRound || value === null || value <= 0 || justification.length < 10) return;

    try {
      estimationSchema.parse({ value, justification });
      setErrors({});

      const activeId = activeRound.id || (activeRound as any)._id;

      const existingEst = userActiveEstimation;

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
        setUserActiveEstimation(newEst);
        // Refresh visible list if viewing active round
        if (String(selectedRoundId) === String(activeId)) {
          setEstimations(prev => prev.map(e => e.id === existingEst.id ? newEst : e));
        }
      } else {
        newEst = await estimationService.submitEstimation(activeId, value, justification, metodoData);
        setUserActiveEstimation(newEst);
        // Refresh visible list if viewing active round
        if (String(selectedRoundId) === String(activeId)) {
          setEstimations(prev => [...prev, newEst]);
        }
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
      
      const missingExperts = (projectData.expertIds || []).filter(expert => {
        const expertId = typeof expert === 'string' ? expert : (expert as any).id || (expert as any)._id;
        
        // Use currentUserId to exclude self if expert
        if (String(expertId) === String(currentUserId)) return false;

        // Strict check to ensure the expert hasn't estimated for this specific round
        const hasEstimatedThisRound = roundEstimations.some(e => {
          const eId = typeof e.expertId === 'object' && e.expertId !== null ? (e.expertId as any)._id || (e.expertId as any).id : e.expertId || (e as any).userId;
          return String(eId) === String(expertId);
        });
        
        return !hasEstimatedThisRound;
      });

      if (missingExperts.length === 0) {
        alert("Todos los expertos han enviado sus estimaciones.");
        return;
      }

      missingExperts.forEach(expert => {
        const expertId = typeof expert === 'string' ? expert : (expert as any).id || (expert as any)._id;
        
        notificationService.addNotification({
          type: 'reminder',
          message: `⏰ Recordatorio: Falta tu estimación para "${taskTitle}" en la Ronda ${activeRound.roundNumber}.`,
          projectId,
          taskId,
          targetUserId: String(expertId)
        });
      });

      alert(`✅ Recordatorio enviado a ${missingExperts.length} experto(s) faltantes.`);
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
            unit={unit}
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

  const displayedStats = viewedRound?.stats || (viewedRound?.status === 'open' ? realTimeStats : null);

  const isOutlier = (estimationId: string) => {
    return displayedStats?.outlierEstimationIds?.includes(estimationId) || false;
  };

  if (isLoading) {
    return <div className="h-48 w-full flex items-center justify-center"><LoadingSpinner /></div>;
  }

  return (
    <AppErrorBoundary>
      <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
        {/* Header Responsivo Premium */}
        <div className="bg-white/95 backdrop-blur-xl p-6 md:p-8 rounded-[2.5rem] border border-white/40 shadow-xl flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-2 h-full bg-delphi-keppel opacity-80" />
          <div className="flex items-center gap-5">
            <div className="bg-delphi-keppel/10 p-4 rounded-2xl shrink-0 group-hover:scale-110 transition-transform">
              <LineChart className="w-6 h-6 md:w-8 md:h-8 text-delphi-keppel" />
            </div>
            <div>
              <h3 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">{taskTitle}</h3>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="px-3 py-1 bg-delphi-keppel/10 text-delphi-keppel text-[10px] font-black uppercase tracking-widest rounded-lg border border-delphi-keppel/20">
                  Unidad: {(unit?.toLowerCase() === 'hours' || unit?.toLowerCase() === 'horas') ? 'Horas' : (unit?.toLowerCase() === 'storypoints' || unit?.toLowerCase() === 'pts') ? 'Story Points' : unit}
                </span>
                <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-slate-200">
                  Método: {METHOD_LABELS[estimationMethod]}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="flex items-center gap-2 bg-slate-50/50 backdrop-blur-md p-2 rounded-2xl border border-slate-200/50 overflow-x-auto no-scrollbar w-full sm:w-auto">
              {rounds.map(r => {
                const rId = r.id || (r as any)._id;
                const isSelected = rId === selectedRoundId;
                const isOpen = r.status === 'open';

                return (
                  <button
                    key={rId}
                    onClick={() => setSelectedRoundId(rId)}
                    className={`w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-xl flex items-center justify-center font-black text-xs transition-all border-2 ${isSelected
                      ? (isOpen ? 'bg-delphi-keppel text-white border-delphi-keppel shadow-lg shadow-delphi-keppel/30 scale-105' : 'bg-slate-900 text-white border-slate-900 shadow-xl scale-105')
                      : 'bg-white border-white text-slate-400 hover:border-delphi-keppel hover:text-delphi-keppel hover:scale-105'
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
                  className="w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-xl bg-white/50 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:text-delphi-keppel hover:border-delphi-keppel transition-all group/new"
                >
                  <Plus className="w-6 h-6 group-hover/new:rotate-90 transition-transform" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl shadow-2xl w-full sm:w-auto justify-center">
              <button
                onClick={() => setShowEvolution(!showEvolution)}
                aria-label="Ver evolución"
                className={`p-2.5 rounded-xl transition-all ${showEvolution ? 'bg-delphi-keppel text-white scale-110' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <History className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowBoxPlot(!showBoxPlot)}
                aria-label="Ver distribución"
                className={`p-2.5 rounded-xl transition-all ${showBoxPlot ? 'bg-delphi-keppel text-white scale-110' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <BarChart2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {(showEvolution || showBoxPlot) && (
          <div className="bg-white/80 backdrop-blur-xl p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] border border-white/40 shadow-2xl overflow-hidden relative group">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-delphi-keppel/10 rounded-full blur-3xl" />
            
            {showEvolution && (
              <div className="space-y-8 relative z-10">
                <div className="flex items-center justify-between">
                  <h4 className="text-xl font-black text-slate-900 flex items-center gap-3">
                    <History className="w-6 h-6 text-delphi-keppel" />
                    Evolución de Estimaciones
                  </h4>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full bg-delphi-keppel" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Media</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full border-2 border-delphi-orange border-dashed" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Desv. Estándar</span>
                    </div>
                  </div>
                </div>
                <div className="h-64 md:h-80 w-full">
                  {evolutionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ReLineChart data={evolutionData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                        <YAxis fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip 
                           contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }} 
                           itemStyle={{ fontWeight: '900', fontSize: '12px' }}
                        />
                        <Line type="monotone" dataKey="media" stroke="#2BBAA5" strokeWidth={4} dot={{ r: 6, fill: '#2BBAA5', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 8 }} name="Media" />
                        <Line type="monotone" dataKey="desviacion" stroke="#F96635" strokeWidth={2} strokeDasharray="8 8" dot={false} name="Desv. Estándar" />
                      </ReLineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 italic gap-4">
                      <History className="w-12 h-12 opacity-10" />
                      <span className="text-xs font-black uppercase tracking-[0.2em]">Esperando datos históricos...</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {showBoxPlot && (
              <div className={`${showEvolution ? 'mt-12 pt-12 border-t border-slate-100' : ''} space-y-8 relative z-10`}>
                <h4 className="text-xl font-black text-slate-900 flex items-center gap-3">
                  <BarChart2 className="w-6 h-6 text-delphi-giants" />
                  Distribución de Frecuencia
                </h4>
                <div className="h-64 md:h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={distributionData}>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2BBAA5" stopOpacity={1} />
                          <stop offset="100%" stopColor="#2BBAA5" stopOpacity={0.6} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis fontSize={10} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}
                        cursor={{ fill: 'rgba(43, 186, 165, 0.05)', radius: [10, 10, 0, 0] }}
                      />
                      <Bar dataKey="count" fill="url(#barGradient)" radius={[10, 10, 0, 0]} name="Expertos" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Lista de Estimaciones Glassmorphism */}
          <div className="bg-white/95 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-white/40 shadow-xl flex flex-col h-full group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-delphi-keppel/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-delphi-keppel/10 transition-colors" />
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="space-y-1">
                <h4 className="text-2xl font-black text-slate-900 tracking-tight">
                  {viewedRound ? `Ronda ${viewedRound.roundNumber}` : 'Resultados'}
                </h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Estimaciones Recibidas</p>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-2xl font-black text-delphi-keppel leading-none">
                  {currentRoundEstimations.length}<span className="text-slate-200 ml-1">/</span><span className="text-slate-300 text-lg">{totalExperts}</span>
                </span>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Participantes</span>
              </div>
            </div>

            <div className="flex-1 space-y-4 min-h-[300px] relative z-10 custom-scrollbar overflow-y-auto pr-2">
              {currentRoundEstimationsWithLabels.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-10 gap-6 opacity-40">
                  <div className="bg-slate-100 p-8 rounded-[2.5rem]">
                    <BarChart2 className="w-16 h-16 text-slate-400" />
                  </div>
                  <div className="space-y-2">
                    <h5 className="text-lg font-black text-slate-900 uppercase tracking-widest">Esperando Datos</h5>
                    <p className="text-sm font-medium text-slate-500 max-w-[200px]">Aún no se han registrado estimaciones en esta ronda estratégica.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {currentRoundEstimationsWithLabels.map((est, idx) => {
                    const outlier = isOutlier(est.id);
                    const roundIsCurrentlyOpen = viewedRound?.status === 'open';
                    const showValue = isFacilitator || !roundIsCurrentlyOpen;
                    
                    return (
                      <div
                        key={est.id}
                        className={`expert-card p-6 rounded-[2rem] border transition-all relative overflow-hidden group/item ${
                          outlier 
                            ? 'bg-delphi-giants/5 border-delphi-giants/20 hover:bg-delphi-giants/10' 
                            : 'bg-slate-50 border-slate-100 hover:bg-white hover:border-delphi-keppel/30 hover:shadow-lg hover:shadow-slate-200/50'
                        }`}
                        data-testid={`expert-card-${est.id}`}
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                        {outlier && (
                          <div className="absolute top-0 right-0 py-1.5 px-4 bg-delphi-giants text-white text-[8px] font-black uppercase tracking-widest rounded-bl-2xl flex items-center gap-1.5 z-20">
                            <ShieldAlert className="w-3 h-3" />
                            Atípico Detectado
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mb-4 relative z-10">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                               outlier ? 'bg-delphi-giants/20 text-delphi-giants' : 'bg-slate-900 text-white'
                            }`}>
                               {est.expertLabel.substring(0, 2)}
                            </div>
                            <div>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Experto</p>
                               <p className="text-xs font-black text-slate-900">{est.expertLabel}</p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                             {showValue ? (
                               <div className="flex flex-col items-end">
                                 <span className={`text-2xl font-black leading-none ${outlier ? 'text-delphi-giants' : 'text-delphi-keppel'}`}>
                                   {est.value} {(unit?.toLowerCase() === 'hours' || unit?.toLowerCase() === 'horas') ? 'Horas' : (unit?.toLowerCase() === 'storypoints' || unit?.toLowerCase() === 'pts') ? 'SP' : (unit?.toLowerCase() === 'persondays') ? 'DP' : unit}
                                 </span>
                               </div>
                             ) : (
                               <div className="flex items-center gap-2 bg-delphi-keppel/10 px-4 py-2 rounded-xl border border-delphi-keppel/20">
                                 <CheckCircle2 className="w-4 h-4 text-delphi-keppel" />
                                 <span className="text-[9px] font-black text-delphi-keppel uppercase tracking-widest">Enviada</span>
                               </div>
                             )}
                          </div>
                        </div>

                        {(showValue || est.expertId === currentUserId) && (
                          <div className="mt-4 pt-4 border-t border-slate-200/50 relative z-10">
                            <p className="text-xs text-slate-600 font-medium leading-relaxed italic bg-white/50 p-3 rounded-xl border border-slate-100">
                               "{est.justification || 'Sin comentario técnico proporcionado.'}"
                            </p>
                          </div>
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

          {/* Panel de Entrada / IA — Glassmorphism */}
          <div className="space-y-6">
            {activeRound ? (
              <div className="bg-white/95 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-white/40 shadow-xl space-y-8 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-2 h-full bg-delphi-keppel" />
                <div className="flex items-center justify-between">
                  <h4 className="text-2xl font-black text-slate-900 tracking-tight">
                    {isFacilitator ? "Control de Ronda" : (hasEstimation ? "Modificar Estimación" : "Tu Estimación")}
                  </h4>
                  {hasEstimation && !isFacilitator && (
                    <span className="px-3 py-1 bg-delphi-keppel/10 text-delphi-keppel text-[8px] font-black uppercase tracking-widest rounded-lg border border-delphi-keppel/20">
                      Modo Edición
                    </span>
                  )}
                </div>

                <div className="space-y-6">
                  {canEstimate ? (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                      <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                        {renderEstimationInput()}
                        {errors.value && <p id="value-error" role="alert" className="text-delphi-giants text-[10px] font-black uppercase tracking-tighter mt-3 ml-1">Error: {errors.value}</p>}
                        {errors.justification && <p id="justification-error" role="alert" className="text-delphi-giants text-[10px] font-black uppercase tracking-tighter mt-3 ml-1">Error: {errors.justification}</p>}
                      </div>
                      
                      <button
                        type="button"
                        onClick={handleSubmitEstimate}
                        disabled={!canSubmit()}
                        className="w-full bg-delphi-keppel text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-delphi-keppel/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                      >
                        {hasEstimation ? 'Guardar Cambios de Estimación' : 'Enviar Estimación Oficial'}
                      </button>
                      <p className="text-[9px] text-slate-400 text-center font-bold uppercase tracking-widest">
                        {hasEstimation ? 'Puedes actualizar tu postura hasta que se cierre la ronda.' : 'Tu estimación será anónima durante la fase de votación.'}
                      </p>
                    </div>
                  ) : isFacilitator ? (
                    <div className="bg-slate-900/5 backdrop-blur-sm border-2 border-dashed border-slate-200 rounded-[2.5rem] p-8 text-center space-y-6 group-hover:border-delphi-keppel/30 transition-colors">
                      <div className="flex justify-center">
                        <div className="bg-delphi-keppel/10 p-6 rounded-[2rem] relative">
                          <Users className="w-10 h-10 text-delphi-keppel" />
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-delphi-orange rounded-full border-4 border-white animate-ping" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <p className="text-slate-900 font-black text-sm uppercase tracking-[0.2em]">Monitoreo de Participación</p>
                        <p className="text-slate-500 text-xs font-semibold leading-relaxed max-w-[250px] mx-auto">
                          <span className="text-delphi-keppel font-black text-lg">{estimations.filter(e => String(e.roundId) === String(activeRound.id || (activeRound as any)._id)).length}</span> de <span className="text-slate-900 font-black text-lg">{totalExperts}</span> especialistas han participado.
                        </p>
                      </div>

                      <div className="px-4">
                        <div className="h-3 w-full bg-slate-200/50 rounded-full overflow-hidden border border-slate-100 p-0.5">
                           <div 
                             className="h-full bg-gradient-to-r from-delphi-keppel to-delphi-keppel/60 rounded-full transition-all duration-1000 shadow-sm" 
                             style={{ width: `${Math.min(100, (estimations.filter(e => String(e.roundId) === String(activeRound.id || (activeRound as any)._id)).length / (totalExperts || 1)) * 100)}%` }}
                           />
                        </div>
                      </div>

                      {Math.max(0, totalExperts - estimations.filter(e => String(e.roundId) === String(activeRound.id || (activeRound as any)._id)).length) > 0 && (
                        <button
                          onClick={handleSendReminder}
                          className="flex items-center justify-center gap-3 w-full py-4 bg-white text-delphi-giants border-2 border-delphi-giants/10 hover:border-delphi-giants/40 hover:bg-delphi-giants/5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md active:scale-95"
                        >
                          <Bell className="w-4 h-4 animate-bounce" />
                          Notificar a Expertos Faltantes
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-100 rounded-3xl p-10 text-center space-y-4">
                      <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto" />
                      <p className="text-slate-500 text-sm font-black uppercase tracking-widest">
                        Ronda Estacionaria
                      </p>
                      <p className="text-xs text-slate-400 font-medium">
                        Esta ronda ya no acepta más participaciones. Por favor, aguarda el análisis del facilitador.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : !showBoxPlot ? (
              <div className={`p-8 md:p-10 rounded-[2.5rem] border transition-all overflow-hidden min-w-0 ${isAnalyzing ? 'bg-slate-50/50 backdrop-blur-md' : 'bg-white shadow-xl border-white/40'}`}>
                {isAnalyzing ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-6">
                    <div className="relative">
                       <div className="w-16 h-16 border-4 border-delphi-keppel/20 border-t-delphi-keppel rounded-full animate-spin" />
                       <BrainCircuit className="w-8 h-8 text-delphi-keppel absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                    </div>
                    <p className="font-black text-slate-900 text-sm uppercase tracking-[0.3em]">IA: Sincronizando Estimaciones...</p>
                  </div>
                ) : (analysis || (isFacilitator && displayedStats)) ? (
                  <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                      <h4 className="text-xl font-black text-slate-900 flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-delphi-keppel" />
                        {analysis ? 'Veredicto de Convergencia' : 'Estadísticas en Tiempo Real'}
                      </h4>
                      {analysis ? (
                        <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm ${analysis.level === 'Alta' ? 'bg-delphi-keppel text-white' :
                          analysis.level === 'Media' ? 'bg-delphi-vanilla text-delphi-orange border border-delphi-orange/20' : 'bg-delphi-giants text-white shadow-lg shadow-delphi-giants/20'
                          }`}>
                          {analysis.level === 'Alta' ? 'Convergencia Máxima' : analysis.level === 'Media' ? 'Convergencia Parcial' : 'Baja Coherencia'}
                        </span>
                      ) : (
                        <span className="px-4 py-1.5 rounded-xl bg-delphi-keppel/10 text-delphi-keppel text-[9px] font-black uppercase tracking-widest border border-delphi-keppel/20">
                          Monitoreo en Vivo
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: 'Media', val: displayedStats.mean?.toFixed(2), icon: Target },
                        { label: 'Mediana', val: displayedStats.median?.toFixed(2), icon: Target },
                        { label: 'Desv. (σ)', val: displayedStats.stdDev?.toFixed(2), icon: Calculator },
                        { label: 'CV %', val: `${((displayedStats.coefficientOfVariation || (displayedStats as any).cv || 0) * 100).toFixed(1)}%`, highlight: true }
                      ].map((item, i) => (
                        <div key={i} className="bg-slate-50/50 p-5 rounded-2xl text-center border border-slate-100/50 hover:bg-white hover:shadow-lg transition-all">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                          <p className={`text-lg font-black ${item.highlight ? ((displayedStats.coefficientOfVariation || (displayedStats as any).cv || 0) <= 0.15 ? 'text-delphi-keppel' : 'text-delphi-orange') : 'text-slate-900'}`}>
                            {item.val || '-'}
                          </p>
                        </div>
                      ))}
                    </div>

                    {analysis && (
                      <div className={`p-6 rounded-[2rem] border-l-[6px] transition-all shadow-md group/card relative overflow-hidden ${
                        analysis.level === 'Alta' ? 'bg-delphi-keppel/5 border-delphi-keppel' : 
                        analysis.level === 'Media' ? 'bg-delphi-vanilla border-delphi-orange' : 'bg-delphi-giants/5 border-delphi-giants'
                      }`}>
                        <div className="absolute -right-8 -bottom-8 opacity-5 group-hover:scale-110 transition-transform">
                          <BrainCircuit className="w-32 h-32" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
                           <Target className="w-3 h-3" /> Recomendación Estratégica
                        </p>
                        <p className="text-sm font-bold text-slate-900 leading-relaxed italic mb-4">
                          "{analysis.level === 'Alta' ? 'El grupo ha alcanzado un consenso robusto. Listo para consolidación.' : 
                            analysis.level === 'Media' ? 'Alineación moderada. Los extremos deben justificar sus posturas.' : 
                            'Disparidad crítica detectada. Requiere re-evaluación profunda de requisitos.'}"
                        </p>
                        <p className="text-[12px] font-medium text-slate-700 leading-relaxed relative z-10">
                          {analysis.recommendation}
                        </p>
                      </div>
                    )}
                    
                    <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] mt-8 shadow-2xl relative overflow-hidden group/stats">
                      <div className="absolute top-0 right-0 w-32 h-full bg-delphi-keppel/10 -skew-x-12 translate-x-16" />
                      <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-delphi-keppel mb-6 flex items-center gap-3">
                         <BarChart3 className="w-4 h-4" /> Desglose Analítico por Método
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
                        {Object.entries(displayedStats.metricaResultados || {})
                          .filter(([key]) => !['distribucion', 'mean', 'median', 'standardDeviation', 'variance', 'iqr', 'outliers'].includes(key))
                          .map(([key, val]) => (
                            <div key={key} className="flex justify-between items-center py-2 border-b border-white/10">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                {key === 'moda' ? 'Moda' :
                                  key === 'frecuencia' ? 'Frecuencia' :
                                  key === 'consensoPct' ? 'Consenso' :
                                  key === 'expectedValue' ? 'Valor Esperado' :
                                  key === 'optimisticAvg' ? 'Promedio Opt.' :
                                  key === 'mostLikelyAvg' ? 'Promedio Prob.' :
                                  key === 'pessimisticAvg' ? 'Promedio Pes.' : key}
                              </span>
                              <span className="font-black text-white text-xs">
                                {typeof val === 'number' ? (key === 'consensoPct' ? `${val.toFixed(0)}%` : val.toFixed(2)) : String(val)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>

                    <div className="pt-6 flex flex-col sm:flex-row gap-4">
                      {isFacilitator && rounds.length > 0 && (
                        <button onClick={handleFinalizeTask} className="flex-1 bg-white border-2 border-delphi-keppel text-delphi-keppel py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-delphi-keppel hover:text-white transition-all shadow-lg active:scale-95">
                          Finalizar Consenso
                        </button>
                      )}
                      <button onClick={handleStartNextRound} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl active:scale-95">
                        Iniciar Nueva Ronda
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-300 gap-4 opacity-50">
                    <ShieldAlert className="w-16 h-16" />
                    <p className="font-black text-[10px] uppercase tracking-[0.3em] text-center max-w-[200px]">Cierra la ronda táctica para habilitar el análisis de IA.</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Inline results summary — Premium Floating Summary */}
      {viewedRound && currentRoundEstimations.length > 0 && (
        <div className="bg-slate-900/95 backdrop-blur-xl text-white p-6 rounded-[2.5rem] border border-white/10 flex flex-wrap items-center justify-between gap-6 overflow-hidden relative shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-700">
          <div className="absolute top-0 left-0 w-2 h-full bg-delphi-keppel shadow-[0_0_20px_rgba(43,186,165,0.5)]" />
          
          <div className="flex items-center gap-6 pl-4">
            <div className="bg-delphi-keppel/20 p-4 rounded-2xl shrink-0 border border-delphi-keppel/20">
              <Target className="w-6 h-6 text-delphi-keppel" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Métricas de Ronda {viewedRound.roundNumber}</p>
              <h5 className="text-xl font-black flex items-center gap-3">
                {viewedRound.status === 'closed'
                  ? <span className="flex items-center gap-2">
                      {viewedRound.stats?.mean?.toFixed(1) || '-'} 
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">
                        {(unit?.toLowerCase() === 'hours' || unit?.toLowerCase() === 'horas') ? 'h' : (unit?.toLowerCase() === 'storypoints' || unit?.toLowerCase() === 'pts') ? 'sp' : (unit?.toLowerCase() === 'persondays') ? 'dp' : unit}
                      </span>
                    </span>
                  : <span className="text-sm font-black text-slate-300 flex items-center gap-2 italic">
                      <div className="w-2 h-2 bg-delphi-keppel rounded-full animate-pulse" />
                      {currentRoundEstimations.length} Estimaciones Recibidas
                    </span>
                }
                {viewedRound.status === 'closed' && analysis?.level && (
                  <span className={`text-[9px] px-3 py-1 rounded-lg font-black uppercase tracking-widest shadow-lg ${
                    analysis.level === 'Alta' ? 'bg-delphi-keppel text-white' :
                    analysis.level === 'Media' ? 'bg-delphi-orange text-white' : 'bg-delphi-giants text-white'
                  }`}>{analysis.level}</span>
                )}
              </h5>
            </div>
          </div>

          <div className="flex items-center gap-8 border-l border-white/5 pl-8">
            {displayedStats && (
              <>
                <div className="text-center group/metric transition-transform hover:scale-110">
                  <p className="text-[10px] font-black uppercase tracking-tighter text-slate-500 mb-1">CV Actual</p>
                  <p className={`text-xl font-black ${((displayedStats.coefficientOfVariation || (displayedStats as any).cv || 0) <= 0.15) ? 'text-delphi-keppel' : 'text-delphi-orange'}`}>
                    {((displayedStats.coefficientOfVariation || (displayedStats as any).cv || 0) * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="text-center group/metric transition-transform hover:scale-110">
                  <p className="text-[10px] font-black uppercase tracking-tighter text-slate-500 mb-1">Atípicos</p>
                  <p className="text-xl font-black text-delphi-orange">{displayedStats.outlierEstimationIds?.length || 0}</p>
                </div>
              </>
            )}
            
            {isFacilitator && viewedRound.status === 'closed' && (
              <div className="flex gap-2">
                 <button
                  onClick={handleStartNextRound}
                  className="bg-white text-slate-900 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-delphi-keppel hover:text-white transition-all shadow-xl active:scale-95"
                >
                  Nueva Ronda
                </button>
              </div>
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
