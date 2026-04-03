import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', label = 'Cargando...' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
    xl: 'w-24 h-24 border-4'
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 gap-4 animate-in fade-in zoom-in-95 duration-500">
      <div className="relative group">
        {/* Outer pulse ring */}
        <div className={`absolute inset-0 rounded-full bg-delphi-keppel/10 animate-ping duration-[2000ms] ${sizeClasses[size]}`} />
        
        {/* Secondary ring */}
        <div className={`absolute inset-0 rounded-full border-slate-100 border-t-delphi-celadon/40 animate-spin-slow ${sizeClasses[size]}`} />
        
        {/* Main active ring */}
        <div className={`relative rounded-full border-slate-100/50 border-t-delphi-keppel border-r-delphi-keppel/30 shadow-[0_0_15px_-3px_rgba(20,184,166,0.3)] animate-spin-fast ${sizeClasses[size]}`} />
      </div>
      
      {label && (
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] animate-pulse">
            {label}
          </span>
          <div className="flex gap-1">
            <span className="w-1 h-1 rounded-full bg-delphi-keppel animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1 h-1 rounded-full bg-delphi-keppel animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1 h-1 rounded-full bg-delphi-keppel animate-bounce" />
          </div>
        </div>
      )}
      <span aria-live="polite" className="sr-only">{label}</span>
    </div>
  );
};

