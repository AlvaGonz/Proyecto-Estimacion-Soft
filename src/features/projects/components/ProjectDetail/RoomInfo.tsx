import React from 'react';
import { Target, Users } from 'lucide-react';

interface RoomInfoProps {
  method: string;
  expertCount: number;
}

export const RoomInfo: React.FC<RoomInfoProps> = ({ method, expertCount }) => {
  return (
    <div className="flex items-center gap-8 pl-0 md:pl-2">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none flex items-center gap-1.5">
          <Target className="w-2.5 h-2.5 text-delphi-orange" />
          Método de Estimación
        </span>
        <span className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          {method === 'wideband-delphi' ? 'Wideband Delphi' : 
           method === 'planning-poker' ? 'Planning Poker' : 
           method === 'three-point' ? 'Three Point' : method}
        </span>
      </div>
      
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none flex items-center gap-1.5">
          <Users className="w-2.5 h-2.5 text-delphi-keppel" />
          Participantes
        </span>
        <div className="flex items-center gap-2">
           <span className="text-xl font-black text-slate-900 leading-none">{expertCount}</span>
           <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter self-end relative -top-1">Expertos</span>
        </div>
      </div>
    </div>
  );
};
