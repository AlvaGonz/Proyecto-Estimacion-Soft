import React from 'react';
import { Target, Sparkles, AlertTriangle } from 'lucide-react';

interface ConvergenceIndicatorProps {
  cv: number; // Coefficient of Variation (0-100)
  level: 'Alta' | 'Media' | 'Baja';
}

export const ConvergenceIndicator: React.FC<ConvergenceIndicatorProps> = ({ cv, level }) => {
  const isConvergent = level === 'Alta';
  const isModerate = level === 'Media';
  
  // Color configuration
  const config = {
    Alta: { bg: 'bg-delphi-keppel', text: 'text-delphi-keppel', icon: Sparkles, msg: 'Consenso Alcanzado' },
    Media: { bg: 'bg-delphi-vanilla', text: 'text-delphi-orange', icon: Target, msg: 'Convergencia Parcial' },
    Baja: { bg: 'bg-delphi-giants', text: 'text-delphi-giants', icon: AlertTriangle, msg: 'Divergencia Crítica' }
  }[level];

  const Icon = config.icon;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${config.text}`} />
          <span className={`text-[10px] font-black uppercase tracking-widest ${config.text}`}>
            {config.msg}
          </span>
        </div>
        <span className="text-xs font-black text-slate-400">
          CV: {cv.toFixed(1)}%
        </span>
      </div>
      
      {/* Visual Meter */}
      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 flex">
        <div 
          className={`h-full ${config.bg} transition-all duration-1000 ease-out shadow-sm`}
          style={{ width: `${Math.min(100, Math.max(5, 100 - cv))}%` }} // Simplified meter: 100 - CV%
        />
      </div>
    </div>
  );
};
