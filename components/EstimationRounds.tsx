import React, { useState, useEffect } from 'react';
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
  MessageSquare
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
import { LoadingSpinner } from './ui/LoadingSpinner';

import { AppErrorBoundary } from './ui/AppErrorBoundary';

interface EstimationRoundsProps {
  projectId: string;
  taskId: string;
  taskTitle: string;
  unit: string;
  estimationMethod?: EstimationMethod;
  onConsensusReached?: (value: number) => void;
  isFacilitator?: boolean;
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
  isFacilitator = true
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
  const [showEvolution, setShowEvolution] = useState(false);
  const [showBoxPlot, setShowBoxPlot] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;
    const loadRounds = async () => {
      try {
        setIsLoading(true);
        const taskRounds = await roundService.getRoundsByTask(projectId, taskId);

        if (isMounted) {
          setRounds(taskRounds);
          const active = taskRounds.find(r => r.status === 'open') || null;
          setActiveRound(active);

          if (taskRounds.length > 0) {
            const allEsts = await Promise.all(
              taskRounds.map(r => estimationService.getEstimationsByRound(r.id))
            );
            setEstimations(allEsts.flat());
          }
        }
      } catch (err) {
        console.error("Failed to load rounds/estimations", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadRounds();
    return () => { isMounted = false; };
  }, [projectId, taskId]);

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
    const v = getSubmitValue();
    if (v === null || v <= 0) return false;
    if (justification.length < 10) return false;
    return true;
  };

  const handleSubmitEstimate = async () => {
    const value = getSubmitValue();
    if (!activeRound || value === null || value <= 0 || justification.length < 10) return;

    try {
      estimationSchema.parse({ value, justification });
      setErrors({});
      setIsAnalyzing(true);
      const newEst = await estimationService.submitEstimation(activeRound.id, value, justification);
      setEstimations(prev => [...prev, newEst]);
      setDelphiValue('');
      setPokerCard(null);
      setThreePoint({ optimistic: '', mostLikely: '', pessimistic: '' });
      setJustification('');
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

  const handleCloseRound = async () => {
    if (!activeRound) return;

    try {
      setIsAnalyzing(true);
      const { round, analysis } = await roundService.closeRound(activeRound.id);

      setRounds(prev => prev.map(r => r.id === activeRound.id ? round : r));
      setActiveRound(null);
      setAnalysis(analysis);

      // Refresh estimations to get potential unmasked actuals or new outliers depending on server logic
      const updatedEsts = await estimationService.getEstimationsByRound(activeRound.id);
      setEstimations(prev => {
        const others = prev.filter(e => e.roundId !== activeRound.id);
        return [...others, ...updatedEsts];
      });
    } catch (err: any) {
      setErrors({ submit: err.message || "Failed to close round." });
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
      setAnalysis(null);
    } catch (err: any) {
      alert(err.message || 'Failed opening round');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFinalizeTask = () => {
    const lastRound = rounds[rounds.length - 1];
    if (lastRound?.stats && onConsensusReached) {
      onConsensusReached(lastRound.stats.median);
    }
  };

  const roundIsOpen = activeRound?.status === 'open';

  const renderEstimationInput = () => {
    switch (estimationMethod) {
      case 'wideband-delphi':
        return (
          <DelphiInput
            value={delphiValue}
            justification={justification}
            unit={unit}
            onChange={(v, j) => { setDelphiValue(v); setJustification(j); }}
            disabled={!roundIsOpen}
          />
        );
      case 'planning-poker':
        return (
          <PokerCards
            selectedCard={pokerCard}
            justification={justification}
            onChange={(c, j) => { setPokerCard(c); setJustification(j); }}
            disabled={!roundIsOpen}
          />
        );
      case 'three-point':
        return (
          <ThreePointInput
            values={threePoint}
            justification={justification}
            unit={unit}
            onChange={(v, j) => { setThreePoint(v); setJustification(j); }}
            disabled={!roundIsOpen}
          />
        );
    }
  };

  const lastClosedRound = [...rounds].reverse().find(r => r.status === 'closed');
  const currentRoundEstimations = estimations.filter(e =>
    e.roundId === (activeRound ? activeRound.id : lastClosedRound?.id)
  );

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

  const isOutlier = (estimationId: string) => {
    return lastClosedRound?.stats?.outlierEstimationIds?.includes(estimationId) || false;
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
              {rounds.map(r => (
                <div
                  key={r.id}
                  className={`w-9 h-9 md:w-10 md:h-10 shrink-0 rounded-xl flex items-center justify-center font-black text-[10px] transition-all border-2 ${r.status === 'open'
                    ? 'bg-delphi-keppel text-white border-delphi-keppel'
                    : activeRound === null && r.id === lastClosedRound?.id
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white border-slate-200 text-slate-400'
                    }`}
                >
                  R{r.roundNumber}
                </div>
              ))}
              {!activeRound && (
                <button
                  onClick={handleStartNextRound}
                  className="w-9 h-9 md:w-10 md:h-10 shrink-0 rounded-xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:text-delphi-keppel transition-all"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-2xl shadow-lg w-full sm:w-auto justify-center">
              <button
                onClick={() => setShowEvolution(!showEvolution)}
                className={`p-2 rounded-xl transition-all ${showEvolution ? 'bg-delphi-keppel text-white' : 'text-slate-400'}`}
              >
                <History className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowBoxPlot(!showBoxPlot)}
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
          {/* Lista de Estimaciones */}
          <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-black text-slate-900">
                {activeRound ? `Ronda ${activeRound.roundNumber}` : `Resultados`}
              </h4>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {currentRoundEstimations.length} Expertos
              </span>
            </div>

            <div className="flex-1 space-y-3 min-h-[200px]">
              {currentRoundEstimations.length === 0 ? (
                <EmptyState
                  icon={<BarChart2 className="w-8 h-8" />}
                  title="Esperando participaciones"
                  description="Aún no hay estimaciones en esta ronda."
                />
              ) : (
                <div className="space-y-3">
                  {currentRoundEstimations.map(est => {
                    const outlier = isOutlier(est.id);
                    return (
                      <div
                        key={est.id}
                        className={`p-4 rounded-2xl border transition-all ${outlier ? 'bg-delphi-giants/5 border-delphi-giants/20' : 'bg-slate-50 border-slate-50 hover:bg-white hover:border-slate-200'}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400">ID: {est.id.slice(0, 4)}</span>
                            {outlier && <AlertTriangle className="w-3 h-3 text-delphi-giants" />}
                          </div>
                          <span className={`text-base font-black ${outlier ? 'text-delphi-giants' : 'text-slate-900'}`}>{est.value} {unit === 'hours' ? 'Horas' : unit === 'storyPoints' ? 'Puntos de Historia' : unit === 'personDays' ? 'Días Persona' : unit}</span>
                        </div>
                        <p className="text-xs text-slate-500 italic leading-relaxed">"{est.justification || 'Sin comentario'}"</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {activeRound && (
              <div className="mt-6 space-y-2">
                <button
                  onClick={handleCloseRound}
                  disabled={currentRoundEstimations.length < 2}
                  className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-delphi-giants transition-all disabled:opacity-50"
                >
                  Analizar Ronda
                </button>
                {errors.submit && <p role="alert" className="text-red-500 text-xs font-bold text-center">{errors.submit}</p>}
              </div>
            )}
          </div>

          {/* Panel de Entrada / IA */}
          <div className="space-y-6">
            {activeRound ? (
              <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                <h4 className="text-xl font-black text-slate-900">Tu Estimación</h4>
                <div className="space-y-4">
                  {renderEstimationInput()}
                  {errors.value && <p id="value-error" role="alert" className="text-red-500 text-xs mt-1 ml-1">{errors.value}</p>}
                  {errors.justification && <p id="justification-error" role="alert" className="text-red-500 text-xs mt-1 ml-1">{errors.justification}</p>}
                  <button
                    onClick={handleSubmitEstimate}
                    disabled={!canSubmit()}
                    className="w-full bg-delphi-keppel text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-delphi-keppel/20 hover:scale-[1.02] transition-all disabled:opacity-50"
                  >
                    Enviar Estimación
                  </button>
                </div>
              </div>
            ) : (
              <div className={`p-6 md:p-8 rounded-[2rem] border transition-all ${isAnalyzing ? 'bg-slate-50' : 'bg-white shadow-sm'}`}>
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
                        AI Insights
                      </h4>
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${analysis.level === 'Alta' ? 'bg-delphi-keppel text-white' :
                        analysis.level === 'Media' ? 'bg-delphi-vanilla text-delphi-orange' : 'bg-delphi-giants text-white'
                        }`}>
                        {analysis.level}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-2xl border-l-4 border-delphi-keppel">
                      <p className="text-xs font-bold text-slate-900 leading-relaxed">{analysis.recommendation}</p>
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed bg-slate-50 p-5 rounded-2xl">
                      {analysis.aiInsights}
                    </p>
                    <div className="pt-4 flex flex-col sm:flex-row gap-3">
                      {isFacilitator && analysis.level === 'Alta' && (
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
            )}
          </div>
        </div>
      </div>
    </AppErrorBoundary>
  );
};

export default EstimationRounds;
