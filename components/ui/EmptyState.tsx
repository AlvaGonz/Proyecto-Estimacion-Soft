import React, { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 animate-in fade-in duration-500">
      <div className="bg-white p-5 rounded-2xl mb-6 shadow-sm border border-slate-100 text-slate-400">
        {icon}
      </div>
      <h3 className="text-xl font-black text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 max-w-md mb-8 leading-relaxed">{description}</p>
      
      {action && (
        <button 
          onClick={action.onClick}
          className="bg-delphi-keppel text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-delphi-keppel/20 hover:scale-105 active:scale-95 transition-all"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
