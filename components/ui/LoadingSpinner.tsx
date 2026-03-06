import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', label = 'Cargando...' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 gap-3 animate-in fade-in duration-300">
      <div className={`rounded-full border-slate-200 border-t-delphi-keppel animate-spin ${sizeClasses[size]}`} />
      {label && (
        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
          {label}
        </span>
      )}
      <span aria-live="polite" className="sr-only">{label}</span>
    </div>
  );
};
