import React from 'react';
import { Clock, BarChart3, Users } from 'lucide-react';

interface EstimationUnitProps {
  unit: string;
}

export const EstimationUnit: React.FC<EstimationUnitProps> = ({ unit }) => {
  const getUnitIcon = () => {
    switch (unit) {
      case 'hours': return Clock;
      case 'storyPoints': return BarChart3;
      case 'personDays': return Users;
      default: return Clock;
    }
  };

  const getUnitLabel = () => {
    switch (unit) {
      case 'hours': return 'Horas';
      case 'storyPoints': return 'Puntos de Historia';
      case 'personDays': return 'Días Persona';
      default: return unit;
    }
  };

  const Icon = getUnitIcon();

  return (
    <div className="flex flex-col gap-1 pr-8 md:border-r border-slate-200/60">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Unidad de Medida</span>
      <div className="flex items-center gap-2 mt-1">
        <div className="p-1 px-1.5 rounded-md bg-delphi-keppel/10 text-delphi-keppel">
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span className="text-sm font-bold text-slate-900 uppercase tracking-wider">{getUnitLabel()}</span>
      </div>
    </div>
  );
};
