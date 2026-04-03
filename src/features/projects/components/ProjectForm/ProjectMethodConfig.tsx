import React from 'react';
import { Target, Info, Sparkles, BrainCircuit, BarChart3, Layers, Clock, Zap } from 'lucide-react';
import { EstimationMethod } from '../../../../types';
import { TimeLimitOption } from './useProjectForm';

interface ProjectMethodConfigProps {
  estimationMethod: EstimationMethod;
  maxRounds: number;
  setMaxRounds: (val: number) => void;
  cvThreshold: number;
  setCvThreshold: (val: number) => void;
  sprints: number;
  setSprints: (val: number) => void;
  timeLimit: TimeLimitOption;
  setTimeLimit: (val: TimeLimitOption) => void;
  useFibonacci: boolean;
  setUseFibonacci: (val: boolean) => void;
  customCards: string;
  setCustomCards: (val: string) => void;
  showFormula: boolean;
  setShowFormula: (val: boolean) => void;
  errors: Record<string, string>;
}

const TIME_LIMIT_OPTIONS: { val: TimeLimitOption; label: string }[] = [
  { val: 'none', label: 'Sin límite' },
  { val: '24h', label: '24 horas' },
  { val: '48h', label: '48 horas' },
  { val: '72h', label: '72 horas' },
  { val: '1w', label: '1 semana' },
];

export const ProjectMethodConfig: React.FC<ProjectMethodConfigProps> = ({
  estimationMethod, maxRounds, setMaxRounds, cvThreshold, setCvThreshold,
  sprints, setSprints, timeLimit, setTimeLimit, useFibonacci, setUseFibonacci,
  customCards, setCustomCards, showFormula, setShowFormula, errors
}) => {
  const inputBase = (hasError: boolean) =>
    `w-full bg-slate-50 border-2 ${hasError ? 'border-red-400' : 'border-slate-100'} rounded-2xl px-5 py-4 text-sm md:text-base font-bold focus:ring-2 focus:ring-delphi-keppel/30 focus:border-delphi-keppel transition-all outline-none`;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        
        {/* Rounds Control */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-delphi-keppel/10 rounded-2xl flex items-center justify-center border border-delphi-keppel/10">
               <Zap className="w-6 h-6 text-delphi-keppel" />
            </div>
            <div>
               <h4 className="font-black text-xs uppercase tracking-widest text-slate-400">Rondas e Iteraciones</h4>
               <p className="text-[10px] font-bold text-slate-300">Límites de sesión</p>
            </div>
          </div>
          <div className="space-y-6 bg-slate-50/50 p-6 rounded-[2.2rem] border border-slate-100">
             <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Máximo de Rondas</label>
               <div className="flex items-center gap-4">
                  <button type="button" onClick={() => setMaxRounds(Math.max(1, maxRounds - 1))} className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black hover:bg-slate-50 active:scale-95 transition-all text-xl">-</button>
                  <span className="flex-1 text-center font-black text-2xl tracking-tighter">{maxRounds}</span>
                  <button type="button" onClick={() => setMaxRounds(Math.min(10, maxRounds + 1))} className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black hover:bg-slate-50 active:scale-95 transition-all text-xl">+</button>
               </div>
               {errors.maxRounds && <p className="text-red-500 text-[10px] font-black uppercase text-center mt-2">{errors.maxRounds}</p>}
             </div>
             <div className="space-y-4 pt-2 border-t border-slate-100">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tiempo Límite por Ronda</label>
                <div className="grid grid-cols-2 gap-2">
                   {TIME_LIMIT_OPTIONS.slice(0, 4).map(opt => (
                     <button
                       key={opt.val}
                       type="button"
                       onClick={() => setTimeLimit(opt.val)}
                       className={`p-3 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${timeLimit === opt.val ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}
                     >
                       {opt.label}
                     </button>
                   ))}
                </div>
             </div>
          </div>
        </div>

        {/* Convergence Control */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-delphi-keppel/10 rounded-2xl flex items-center justify-center border border-delphi-keppel/10">
               <Target className="w-6 h-6 text-delphi-keppel" />
            </div>
            <div>
               <h4 className="font-black text-xs uppercase tracking-widest text-slate-400">Umbral de Convergencia</h4>
               <p className="text-[10px] font-bold text-slate-300">Sensibilidad del consenso</p>
            </div>
          </div>
          <div className="space-y-8 bg-slate-50/50 p-6 rounded-[2.2rem] border border-slate-100">
              <div className="space-y-4">
                 <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Coef. Variación (CV)</span>
                    <span className="text-xl font-black text-delphi-keppel">{cvThreshold / 100}</span>
                 </div>
                 <input 
                   type="range" 
                   min="10" 
                   max="50" 
                   step="5"
                   value={cvThreshold}
                   onChange={(e) => setCvThreshold(parseInt(e.target.value))}
                   className="w-full accent-delphi-keppel h-2 bg-slate-200 rounded-full appearance-none cursor-pointer"
                 />
                 <div className="flex justify-between text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">
                    <span>Sensible (0.1)</span>
                    <span>Relajado (0.5)</span>
                 </div>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-slate-100 flex items-start gap-3">
                 <Info className="w-4 h-4 text-delphi-keppel shrink-0 mt-0.5" />
                 <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                   Un CV de <span className="text-slate-900">{cvThreshold / 100}</span> significa que la desviación debe ser menor al {cvThreshold}% de la media para cerrar.
                 </p>
              </div>
          </div>
        </div>

        {/* Method Specific Config */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-delphi-keppel/10 rounded-2xl flex items-center justify-center border border-delphi-keppel/10">
               <Sparkles className="w-6 h-6 text-delphi-keppel" />
            </div>
            <div>
               <h4 className="font-black text-xs uppercase tracking-widest text-slate-400">Personalización del Método</h4>
               <p className="text-[10px] font-bold text-slate-300">Reglas específicas</p>
            </div>
          </div>
          <div className="bg-slate-900 rounded-[2.2rem] p-6 text-white h-[260px] relative overflow-hidden flex flex-col justify-center gap-6">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16" />
             
             {estimationMethod === 'planning-poker' ? (
                <div className="space-y-4 animate-in zoom-in-95 duration-500">
                   <p className="text-[10px] font-black uppercase tracking-widest text-delphi-keppel">Baraja de Votación</p>
                   <div className="flex items-center gap-3">
                      <div className={`flex-1 p-4 rounded-2xl border-2 transition-all cursor-pointer ${useFibonacci ? 'border-delphi-keppel bg-delphi-keppel/10' : 'border-white/10'}`} onClick={() => setUseFibonacci(true)}>
                         <Layers className="w-6 h-6 mb-2" />
                         <span className="text-[10px] font-black block">Fibonacci</span>
                      </div>
                      <div className={`flex-1 p-4 rounded-2xl border-2 transition-all cursor-pointer ${!useFibonacci ? 'border-delphi-keppel bg-delphi-keppel/10' : 'border-white/10'}`} onClick={() => setUseFibonacci(false)}>
                         <Sparkles className="w-6 h-6 mb-2" />
                         <span className="text-[10px] font-black block">Personalizada</span>
                      </div>
                   </div>
                </div>
             ) : estimationMethod === 'three-point' ? (
                <div className="space-y-4 animate-in zoom-in-95 duration-500">
                   <p className="text-[10px] font-black uppercase tracking-widest text-delphi-keppel">Algoritmo PERT</p>
                   <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                         <BarChart3 className="w-5 h-5" />
                      </div>
                      <div className="text-[10px] font-bold text-slate-300 leading-tight">
                         Formula: (O + 4M + P) / 6
                         <div className="mt-1 text-[8px] text-delphi-keppel tracking-widest uppercase">Muestreo probabilístico activo</div>
                      </div>
                   </div>
                </div>
             ) : (
                <div className="space-y-4 animate-in zoom-in-95 duration-500 text-center">
                   <BrainCircuit className="w-12 h-12 text-delphi-keppel mx-auto mb-2 opacity-50" />
                   <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Wideband Delphi</p>
                   <p className="text-[10px] font-bold text-slate-500 leading-relaxed px-4">Se utilizarán rondas abiertas y recálculos automáticos de estadísticas de grupo.</p>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
