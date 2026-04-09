import React from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

const ErrorFallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-red-50/50 rounded-3xl border border-red-100 animate-in fade-in duration-500">
      <div className="bg-red-100 p-4 rounded-2xl mb-6">
        <AlertCircle className="w-12 h-12 text-red-500" />
      </div>
      <h2 className="text-xl font-black text-slate-900 mb-2">Algo salió mal</h2>
      <p className="text-sm text-slate-600 max-w-md mb-8">{error.message}</p>
      
      <div className="flex gap-4">
        <button 
          onClick={resetErrorBoundary}
          className="gap-2 bg-red-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-all btn-base"
        >
          <RefreshCw className="w-4 h-4" />
          Reintentar
        </button>
        <button 
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 bg-white text-slate-700 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest border border-slate-200 hover:bg-slate-50 transition-all"
        >
          <Home className="w-4 h-4" />
          Volver al inicio
        </button>
      </div>
    </div>
  );
};

export const AppErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      {children}
    </ErrorBoundary>
  );
};
