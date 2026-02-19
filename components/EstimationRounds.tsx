
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

  useEffect(() => {
    // Inicializar primera ronda al cambiar de tarea
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
  }, [taskId]);

  const handleSubmitEstimate = () => {
    if (!activeRound || !inputValue) return;
    
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
  };

  const handleCloseRound = async () => {
    if (!activeRound) return;

    const roundEstimations = estimations.filter(e => e.roundId === activeRound.id);
    if (roundEstimations.length < 2) {
      alert("Se requieren al menos 2 estimaciones para cerrar la ronda y calcular estadísticas.");
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
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header de Tarea y Rondas */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="bg-delphi-keppel/10 p-4 rounded-2xl">
             <LineChart className="w-8 h-8 text-delphi-keppel" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{taskTitle}</h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Wideband Delphi Iterativo</span>
              <div className="w-1 h-1 bg-slate-200 rounded-full" />
              <span className="text-[10px] font-black text-delphi-keppel uppercase tracking-widest">Unidad: {unit}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
            {rounds.map(r => (
              <div 
                key={r.id} 
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-all border-2 ${
                  r.status === 'Abierta' 
                    ? 'bg-delphi-keppel text-white border-delphi-keppel shadow-lg shadow-delphi-keppel/20' 
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
                className="w-10 h-10 rounded-xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:text-delphi-keppel hover:border-delphi-keppel hover:bg-delphi-keppel/5 transition-all"
                title="Nueva Ronda"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl shadow-xl">
            <button 
              onClick={() => setShowEvolution(!showEvolution)}
              className={`p-2.5 rounded-xl transition-all ${showEvolution ? 'bg-delphi-keppel text-white shadow-lg shadow-delphi-keppel/20' : 'text-slate-400 hover:text-white'}`}
              title="Evolución Histórica"
            >
              <History className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setShowBoxPlot(!showBoxPlot)}
              className={`p-2.5 rounded-xl transition-all ${showBoxPlot ? 'bg-delphi-keppel text-white shadow-lg shadow-delphi-keppel/20' : 'text-slate-400 hover:text-white'}`}
              title="Distribución de Datos"
            >
              <BarChart2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {(showEvolution || showBoxPlot) && (
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl animate-in zoom-in-95 duration-500">
           {showEvolution && (
             <div className="space-y-10">
                <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xl font-black text-slate-900 flex items-center gap-3">
                        <TrendingUp className="w-6 h-6 text-delphi-keppel" />
                        Convergencia Progresiva (RF018)
                      </h4>
                      <p className="text-xs font-bold text-slate-400 mt-1">Análisis de Media vs Desviación Estándar por ronda.</p>
                    </div>
                </div>
                <div className="h-64 w-full">
                    {evolutionData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <ReLineChart data={evolutionData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" stroke="#cbd5e1" fontSize={12} fontWeight="bold" />
                          <YAxis stroke="#cbd5e1" fontSize={12} fontWeight="bold" />
                          <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                          <Line type="monotone" dataKey="media" stroke="#2BBAA5" strokeWidth={4} dot={{ r: 6, fill: '#2BBAA5', strokeWidth: 0 }} name="Media" />
                          <Line type="monotone" dataKey="desviacion" stroke="#F96635" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4, fill: '#F96635', strokeWidth: 0 }} name="Desviación" />
                        </ReLineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-300 italic text-sm">
                        Cierra rondas para generar datos de evolución.
                      </div>
                    )}
                </div>
             </div>
           )}

           {showBoxPlot && (
             <div className={`${showEvolution ? 'mt-12 pt-12 border-t border-slate-100' : ''} space-y-8`}>
                <div className="flex items-center justify-between">
                    <h4 className="text-xl font-black text-slate-900 flex items-center gap-3">
                      <BarChart2 className="w-6 h-6 text-delphi-giants" />
                      Histograma de Frecuencias (RF017)
                    </h4>
                </div>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={distributionData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#cbd5e1" fontSize={12} fontWeight="bold" />
                        <YAxis stroke="#cbd5e1" fontSize={12} fontWeight="bold" />
                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="count" fill="#2BBAA5" radius={[12, 12, 0, 0]} name="Expertos" />
                      </BarChart>
                    </ResponsiveContainer>
                </div>
             </div>
           )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Panel de Estimaciones Recibidas */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-8 flex flex-col">
          <div className="flex items-center justify-between">
            <h4 className="text-xl font-black text-slate-900">
              {activeRound ? `Estimaciones Recibidas R${activeRound.roundNumber}` : `Resultados R${lastClosedRound?.roundNumber}`}
            </h4>
            <div className="flex items-center gap-3">
               {activeRound && <div className="w-2 h-2 rounded-full bg-delphi-keppel animate-ping" />}
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                 {currentRoundEstimations.length} Participantes
               </span>
            </div>
          </div>
          
          <div className="flex-1 space-y-4">
            {currentRoundEstimations.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-20 text-slate-300 italic text-sm border-2 border-dashed border-slate-50 rounded-[2.5rem] bg-slate-50/20">
                <Lock className="w-12 h-12 mb-4 opacity-10" />
                Esperando primera estimación...
              </div>
            ) : (
              <div className="space-y-4">
                {currentRoundEstimations.map(est => {
                  const outlier = isOutlier(est.id);
                  return (
                    <div 
                      key={est.id} 
                      className={`p-6 rounded-[2rem] border-2 transition-all relative overflow-hidden group ${
                        outlier 
                          ? 'bg-delphi-giants/5 border-delphi-giants/30 shadow-lg shadow-delphi-giants/5' 
                          : 'bg-slate-50 border-slate-50 hover:bg-white hover:border-slate-200'
                      }`}
                    >
                      {outlier && (
                        <div className="absolute top-0 right-0 bg-delphi-giants text-white px-4 py-1 rounded-bl-2xl flex items-center gap-2">
                           <AlertTriangle className="w-3 h-3" />
                           <span className="text-[8px] font-black uppercase tracking-widest">Outlier (RF016)</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${outlier ? 'bg-delphi-giants text-white' : 'bg-delphi-keppel text-white'}`}>
                            EX
                          </div>
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">ID: {est.id.slice(0, 4)}</span>
                        </div>
                        <span className={`text-xl font-black ${outlier ? 'text-delphi-giants' : 'text-slate-900'}`}>
                          {est.value} <span className="text-xs font-bold text-slate-400">{unit}</span>
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 font-medium leading-relaxed italic group-hover:text-slate-700 transition-colors">
                        "{est.justification || 'Sin justificación técnica proporcionada.'}"
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {activeRound && (
            <button 
              onClick={handleCloseRound}
              disabled={currentRoundEstimations.length < 2}
              className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 hover:bg-delphi-giants hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cerrar Ronda y Auditar
            </button>
          )}
        </div>

        {/* Panel Lateral: Entrada de Datos / IA */}
        <div className="space-y-8">
          {activeRound ? (
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8 animate-in slide-in-from-right-6 duration-500">
              <div className="flex items-center gap-4">
                <div className="bg-delphi-keppel p-3 rounded-2xl text-white">
                  <Plus className="w-6 h-6" />
                </div>
                <h4 className="text-2xl font-black text-slate-900 tracking-tight">Tu Estimación</h4>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Valor Estimado ({unit})</label>
                  <input 
                    type="number"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-8 py-4 text-xl font-black focus:ring-4 focus:ring-delphi-keppel/10 focus:border-delphi-keppel outline-none transition-all"
                    placeholder="0.0"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Justificación Técnica (RF014)</label>
                  <textarea 
                    rows={5}
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] px-8 py-6 text-sm font-medium focus:ring-4 focus:ring-delphi-keppel/10 focus:border-delphi-keppel outline-none transition-all resize-none"
                    placeholder="Baso mi estimación en la complejidad del esquema de base de datos y..."
                  />
                </div>
                <button 
                  onClick={handleSubmitEstimate}
                  disabled={!inputValue}
                  className="w-full bg-delphi-keppel text-white py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-delphi-keppel/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  Enviar a Ronda {activeRound.roundNumber}
                </button>
              </div>
            </div>
          ) : (
            <div className={`p-10 rounded-[3rem] border transition-all duration-500 ${isAnalyzing ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-100 shadow-sm'}`}>
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-20 gap-8">
                   <div className="relative">
                      <Sparkles className="w-16 h-16 text-delphi-keppel animate-pulse" />
                      <div className="absolute inset-0 bg-delphi-keppel/20 blur-2xl rounded-full" />
                   </div>
                   <div className="text-center space-y-2">
                      <p className="font-black text-slate-900 text-xl tracking-tight">Analizando Consenso...</p>
                      <p className="text-xs text-slate-400 font-black uppercase tracking-widest animate-bounce">Gemini Pro 3 processing stats</p>
                   </div>
                </div>
              ) : analysis ? (
                <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                   <div className="flex items-center justify-between">
                      <h4 className="text-2xl font-black text-slate-900 flex items-center gap-4">
                        <BrainCircuit className="w-8 h-8 text-delphi-keppel" />
                        AI Insights
                      </h4>
                      <span className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${
                        analysis.level === 'Alta' ? 'bg-delphi-keppel text-white' :
                        analysis.level === 'Media' ? 'bg-delphi-vanilla text-delphi-orange border border-delphi-orange/20' : 'bg-delphi-giants text-white'
                      }`}>
                        Convergencia {analysis.level}
                      </span>
                   </div>

                   <div className="bg-slate-50 p-8 rounded-[2.5rem] border-l-8 border-delphi-keppel relative overflow-hidden group">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                         <Sparkles className="w-3 h-3" /> Recomendación DelphiPro
                      </p>
                      <p className="text-lg font-black text-slate-900 leading-tight group-hover:translate-x-1 transition-transform">{analysis.recommendation}</p>
                   </div>

                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Análisis de Dispersión Técnica</label>
                      <div className="text-sm text-slate-600 leading-relaxed font-medium bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 shadow-inner">
                        {analysis.aiInsights}
                      </div>
                   </div>

                   <div className="pt-6 border-t border-slate-100 flex gap-4">
                      {isFacilitator && analysis.level === 'Alta' && (
                        <button 
                          onClick={handleFinalizeTask}
                          className="flex-1 bg-delphi-keppel text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-delphi-keppel/20 hover:scale-[1.05] transition-all flex items-center justify-center gap-3"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Consolidar Tarea
                        </button>
                      )}
                      <button 
                        onClick={handleStartNextRound}
                        className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-delphi-giants transition-all flex items-center justify-center gap-3"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Nueva Ronda
                      </button>
                   </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                   <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-8 h-8 text-slate-200" />
                   </div>
                   <p className="text-slate-400 font-bold italic max-w-xs">
                      Cierra la ronda activa para habilitar el motor de análisis estadístico asistido por IA.
                   </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EstimationRounds;
