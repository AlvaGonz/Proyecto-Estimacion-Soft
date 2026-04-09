import React from 'react';
import { Project } from '../../../../types';

interface SessionHeaderProps {
  status: Project['status'];
  name: string;
}

export const SessionHeader: React.FC<SessionHeaderProps> = ({ status, name }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-6 bg-delphi-keppel rounded-full shadow-sm" />
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] font-primary">
          Proyecto / {status === 'preparation' ? 'Preparación' : 
                     status === 'kickoff' ? 'Kickoff' : 
                     status === 'active' ? 'Activo' : 
                     status === 'finished' ? 'Finalizado' : status}
        </span>
      </div>
      <h1 
        className="font-black text-slate-900 tracking-tight leading-[0.9] italic uppercase" 
        style={{ fontSize: 'clamp(2rem, 5vw + 1rem, 4.5rem)' }}
      >
        {name}
      </h1>
    </div>
  );
};
