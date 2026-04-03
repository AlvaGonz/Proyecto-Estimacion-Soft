import React from 'react';
import { FileText, BrainCircuit, Sparkles, ListChecks, ClipboardCheck } from 'lucide-react';

export const TOTAL_STEPS = 5;

export const STEP_META = [
  { n: 1, label: 'General', sub: 'Info del Proyecto', icon: FileText },
  { n: 2, label: 'Método', sub: 'Estimación', icon: BrainCircuit },
  { n: 3, label: 'Config', sub: 'Parámetros', icon: Sparkles },
  { n: 4, label: 'Tareas', sub: 'Elementos', icon: ListChecks },
  { n: 5, label: 'Resumen', sub: 'Confirmación', icon: ClipboardCheck },
];

interface ProjectFormHeaderProps {
  currentStep: number;
  onStepClick: (step: number) => void;
  maxReachedStep: number;
}

export const ProjectFormHeader: React.FC<ProjectFormHeaderProps> = ({ 
  currentStep, 
  onStepClick,
  maxReachedStep 
}) => {
  return (
    <div className="flex justify-between items-center mb-12 sm:mb-16 relative px-2 sm:px-4">
      <div className="absolute top-1/2 left-0 w-full h-1.5 bg-slate-100 -translate-y-1/2 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-delphi-keppel/10 via-delphi-keppel to-delphi-keppel/10 transition-all duration-1000 shadow-[0_0_20px_rgba(43,186,165,0.3)]" 
          style={{ width: `${((currentStep - 1) / (TOTAL_STEPS - 1)) * 100}%` }} 
        />
      </div>
      
      {STEP_META.map((s, idx) => {
        const Icon = s.icon;
        const isActive = currentStep === s.n;
        const isPast = currentStep > s.n;
        const isLocked = s.n > maxReachedStep + 1 && s.n > currentStep;

        return (
          <button
            key={s.n}
            type="button"
            disabled={isLocked}
            onClick={() => !isLocked && onStepClick(s.n)}
            className={`relative flex flex-col items-center group transition-all duration-500 ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
          >
            <div className={`w-10 h-10 sm:w-16 sm:h-16 rounded-[1.2rem] sm:rounded-[1.8rem] flex items-center justify-center transition-all duration-700 relative z-10 border-4 ${
              isActive 
                ? 'bg-slate-900 border-white shadow-2xl shadow-slate-900/40' 
                : isPast 
                  ? 'bg-delphi-keppel border-white shadow-xl shadow-delphi-keppel/20' 
                  : 'bg-white border-slate-100 text-slate-300'
            }`}>
              <Icon className={`w-5 h-5 sm:w-7 sm:h-7 ${isActive || isPast ? 'text-white' : 'text-slate-300'} transition-colors`} />
              {isPast && (
                <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-md">
                   <div className="w-4 h-4 bg-delphi-keppel rounded-full flex items-center justify-center">
                     <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                     </svg>
                   </div>
                </div>
              )}
            </div>
            <div className="mt-4 sm:mt-6 text-center hidden md:block">
              <p className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] transition-colors leading-none ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                {s.label}
              </p>
              <p className="text-[10px] font-bold text-slate-300 mt-1 cursor-default">{s.sub}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
};
