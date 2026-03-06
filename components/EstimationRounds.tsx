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
import { Estimation, Round, ConvergenceAnalysis } from '../types';
import { calculateRoundStats } from '../utils/statistics';
import { analyzeConsensus } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart as ReLineChart, Line } from 'recharts';
import { EmptyState } from './ui/EmptyState';
import { estimationSchema } from '../utils/schemas';
import { z } from 'zod';

import { AppErrorBoundary } from './ui/AppErrorBoundary';

interface EstimationRoundsProps {
  taskId: string;
  taskTitle: string;
  unit: string;
  onConsensusReached?: (value: number) => void;
  isFacilitator?: boolean;
}

const EstimationRounds: React.FC<EstimationRoundsProps> = ({ 
  taskId, 
  taskTitle, 
  unit, 
  onConsensusReached,
  isFacilitator = true 
}) => {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [activeRound, setActiveRound] = useState<Round | null>(null);
  const [estimations, setEstimations] = useState<Estimation[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [justification, setJustification] = useState('');
  const [analysis, setAnalysis] = useState<ConvergenceAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showEvolution, setShowEvolution] = useState(false);
  const [showBoxPlot, setShowBoxPlot] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const r1: Round = {
      id: `r1-${taskId}`,
      taskId,
      roundNumber: 1,
      status: 'Abierta',
      startTime: Date.now()
    };
    setRounds([r1]);
    setActiveRound(r1);
    setAnalysis(null);

    // Mock estimations for the first round
    const mockEstimations: Estimation[] = [
      { id: 'est1', roundId: r1.id, taskId, expertId: 'expert-1', value: 8, justification: 'Complejidad en la integración con el sistema heredado.', timestamp: Date.now() - 3600000 },
      { id: 'est2', roundId: r1.id, taskId, expertId: 'expert-2', value: 13, justification: 'Riesgos de seguridad y necesidad de refactorización extensa.', timestamp: Date.now() - 1800000 },
      { id: 'est3', roundId: r1.id, taskId, expertId: 'expert-3', value: 8, justification: 'Basado en proyectos similares anteriores, 8 puntos parece adecuado.', timestamp: Date.now() - 900000 },
    ];
    setEstimations(mockEstimations);
  }, [taskId]);

  const handleSubmitEstimate = () => {
    if (!activeRound || !inputValue) return;
    
    try {
      estimationSchema.parse({ value: Number(inputValue), justification });
      setErrors({});
      
      const newEst: Estimation = {
        id: Math.random().toString(36).substr(2, 9),
        roundId: activeRound.id,
        taskId,
        expertId: `expert-${Math.floor(Math.random() * 1000)}`,
        value: Number(inputValue),
        justification,
        timestamp: Date.now()
      };
      setEstimations(prev => [...prev, newEst]);
      setInputValue('');
      setJustification('');
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((err: any) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
    }
  };

  const handleCloseRound = async () => {
    if (!activeRound) return;
    const roundEstimations = estimations.filter(e => e.roundId === activeRound.id);
    if (roundEstimations.length < 2) {
      setErrors({ submit: "Se requieren al menos 2 estimaciones para cerrar la ronda." });
      return;
    }
    const stats = calculateRoundStats(roundEstimations);
    const updatedRound: Round = {
      ...activeRound,
      status: 'Cerrada',
      endTime: Date.now(),
      stats
    };
    setRounds(prev => prev.map(r => r.id === activeRound.id ? updatedRound : r));
    setActiveRound(null);
    setIsAnalyzing(true);
    const aiResult = await analyzeConsensus(roundEstimations, stats, unit);
    setAnalysis(aiResult);
    setIsAnalyzing(false);
  };

  const handleStartNextRound = () => {
    const nextRoundNumber = rounds.length + 1;
    const nextRound: Round = {
      id: `r${nextRoundNumber}-${taskId}`,
      taskId,
      roundNumber: nextRoundNumber,
      status: 'Abierta',
      startTime: Date.now()
    };
    setRounds(prev => [...prev, nextRound]);
    setActiveRound(nextRound);
    setAnalysis(null);
  };

  const handleFinalizeTask = () => {
    const lastRound = rounds[rounds.length - 1];
    if (lastRound?.stats && onConsensusReached) {
      onConsensusReached(lastRound.stats.median);
    }
  };

  const lastClosedRound = [...rounds].reverse().find(r => r.status === 'Cerrada');
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
    .filter(r => r.status === 'Cerrada' && r.stats)
    .map(r => ({
      name: `R${r.roundNumber}`,
      media: r.stats?.mean,
      desviacion: r.stats?.stdDev
    }));

  const isOutlier = (estimationId: string) => {
    return lastClosedRound?.stats?.outliers.includes(estimationId);
  };

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
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black text-delphi-keppel uppercase tracking-widest">{unit}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 overflow-x-auto no-scrollbar w-full sm:w-auto">
            {rounds.map(r => (
              <div 
                key={r.id} 
                className={`w-9 h-9 md:w-10 md:h-10 shrink-0 rounded-xl flex items-center justify-center font-black text-[10px] transition-all border-2 ${
                  r.status === 'Abierta' 
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
                        <span className={`text-base font-black ${outlier ? 'text-delphi-giants' : 'text-slate-900'}`}>{est.value} {unit}</span>
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
                <div className="space-y-2">
                  <label htmlFor="estimationValue" className="text-[10px] font-black uppercase text-slate-400 ml-1">Valor ({unit})</label>
                  <input 
                    id="estimationValue"
                    type="number"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    aria-describedby="value-error"
                    className={`w-full bg-slate-50 border ${errors.value ? 'border-red-500' : 'border-slate-100'} rounded-xl px-4 py-3 text-lg font-black focus:border-delphi-keppel outline-none transition-all`}
                    placeholder="0"
                  />
                  {errors.value && <p id="value-error" role="alert" className="text-red-500 text-xs mt-1 ml-1">{errors.value}</p>}
                </div>
                <div className="space-y-2">
                  <label htmlFor="estimationJustification" className="text-[10px] font-black uppercase text-slate-400 ml-1">Justificación</label>
                  <textarea 
                    id="estimationJustification"
                    rows={4}
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    aria-describedby="justification-error"
                    className={`w-full bg-slate-50 border ${errors.justification ? 'border-red-500' : 'border-slate-100'} rounded-xl px-4 py-3 text-xs font-medium focus:border-delphi-keppel outline-none resize-none`}
                    placeholder="Escribe tu razonamiento..."
                  />
                  {errors.justification && <p id="justification-error" role="alert" className="text-red-500 text-xs mt-1 ml-1">{errors.justification}</p>}
                </div>
                <button 
                  onClick={handleSubmitEstimate}
                  disabled={!inputValue}
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
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                        analysis.level === 'Alta' ? 'bg-delphi-keppel text-white' :
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
