import React from 'react';
import { BrainCircuit, Layers, BarChart3, Info, Check } from 'lucide-react';
import { EstimationMethod } from '../../../../types';

export const METHOD_OPTIONS = [
  {
    value: 'wideband-delphi' as const,
    label: 'Wideband Delphi',
    icon: BrainCircuit,
    badge: 'Recomendado',
    desc: 'Estimación numérica libre por expertos anónimos, iterativa.',
    when: 'Equipos con experiencia que necesitan consenso riguroso.',
  },
  {
    value: 'planning-poker' as const,
    label: 'Planning Poker',
    icon: Layers,
    badge: null,
    desc: 'Votación con baraja Fibonacci, consenso por selección de carta.',
    when: 'Equipos ágiles que prefieren comparación relativa.',
  },
  {
    value: 'three-point' as const,
    label: 'Tres Puntos (PERT)',
    icon: BarChart3,
    badge: null,
    desc: 'Valores Optimista, Más Probable y Pesimista. Fórmula PERT.',
    when: 'Tareas con alta incertidumbre que requieren rangos.',
  },
] as const;

interface ProjectMethodSelectionProps {
  estimationMethod: EstimationMethod;
  setEstimationMethod: (val: EstimationMethod) => void;
}

export const ProjectMethodSelection: React.FC<ProjectMethodSelectionProps> = ({
  estimationMethod, setEstimationMethod
}) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-delphi-keppel/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-20 h-20 bg-delphi-keppel/20 rounded-[2rem] flex items-center justify-center border border-delphi-keppel/30 shrink-0">
             <BrainCircuit className="w-10 h-10 text-delphi-keppel" />
          </div>
          <div>
            <h3 className="text-2xl font-black mb-2 tracking-tight">Metodología de Estimación</h3>
            <p className="text-slate-400 font-bold text-sm leading-relaxed max-w-xl">
              Elige el motor de cálculo y flujos de trabajo. El método <span className="text-delphi-keppel">Wideband Delphi</span> es el estándar para proyectos de alta criticidad en la UCE.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {METHOD_OPTIONS.map(opt => {
          const Icon = opt.icon;
          const isSelected = estimationMethod === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setEstimationMethod(opt.value)}
              className={`text-left p-6 flex flex-col rounded-[2.2rem] border-2 transition-all duration-300 relative group overflow-hidden ${
                isSelected 
                  ? 'border-delphi-keppel bg-white shadow-2xl shadow-delphi-keppel/10' 
                  : 'border-slate-100 bg-slate-50/50 opacity-70 hover:opacity-100 hover:border-slate-200'
              }`}
            >
              {isSelected && (
                 <div className="absolute top-4 right-4 bg-delphi-keppel text-white p-1 rounded-full shadow-lg">
                   <Check className="w-3 h-3 stroke-[4]" />
                 </div>
              )}
              
              {opt.badge && (
                <span className="mb-4 inline-flex px-2.5 py-1 rounded-lg bg-delphi-keppel/10 text-delphi-keppel text-[8px] font-black uppercase tracking-widest self-start">
                   {opt.badge}
                </span>
              )}

              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 scale-100 group-hover:scale-110 ${isSelected ? 'bg-delphi-keppel text-white shadow-xl shadow-delphi-keppel/20' : 'bg-white text-slate-400 group-hover:bg-slate-900 group-hover:text-white shadow-sm'}`}>
                <Icon className="w-6 h-6" />
              </div>

              <h4 className={`font-black text-lg tracking-tight mb-2 ${isSelected ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>{opt.label}</h4>
              <p className="text-xs font-bold text-slate-500 mb-4 leading-relaxed line-clamp-2">{opt.desc}</p>
              
              <div className={`mt-auto pt-4 border-t ${isSelected ? 'border-delphi-keppel/10' : 'border-slate-100'}`}>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-1">Cuándo Usar</p>
                <p className="text-[10px] font-bold text-slate-400 leading-snug">{opt.when}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
