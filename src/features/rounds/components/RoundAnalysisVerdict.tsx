import React from 'react';
import { Round, ConvergenceAnalysis } from '../../../types';
import { 
  ShieldAlert, Sparkles, Target, Calculator, BrainCircuit, BarChart3 
} from 'lucide-react';

interface RoundAnalysisVerdictProps {
  isAnalyzing: boolean;
  analysis: ConvergenceAnalysis | null;
  displayedStats: any;
  isFacilitator: boolean;
  rounds: Round[];
  onFinalizeTask: () => void;
  onStartNextRound: () => void;
}

export const RoundAnalysisVerdict: React.FC<RoundAnalysisVerdictProps> = ({
  isAnalyzing,
  analysis,
  displayedStats,
  isFacilitator,
  rounds,
  onFinalizeTask,
  onStartNextRound
}) => {
  return (
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
              { label: 'Media', val: displayedStats?.mean?.toFixed(2), icon: Target },
              { label: 'Mediana', val: displayedStats?.median?.toFixed(2), icon: Target },
              { label: 'Desv. (σ)', val: displayedStats?.stdDev?.toFixed(2), icon: Calculator },
              { label: 'CV %', val: `${((displayedStats?.coefficientOfVariation || (displayedStats as any)?.cv || 0) * 100).toFixed(1)}%`, highlight: true }
            ].map((item, i) => (
              <div key={i} className="bg-slate-50/50 p-5 rounded-2xl text-center border border-slate-100/50 hover:bg-white hover:shadow-lg transition-all">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                <p className={`text-lg font-black ${item.highlight ? ((displayedStats?.coefficientOfVariation || (displayedStats as any)?.cv || 0) <= 0.15 ? 'text-delphi-keppel' : 'text-delphi-orange') : 'text-slate-900'}`}>
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
              {Object.entries(displayedStats?.metricaResultados || {})
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
              <button onClick={onFinalizeTask} className="flex-1 bg-white border-2 border-delphi-keppel text-delphi-keppel py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-delphi-keppel hover:text-white transition-all shadow-lg active:scale-95">
                Finalizar Consenso
              </button>
            )}
            <button onClick={onStartNextRound} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl active:scale-95">
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
  );
};
