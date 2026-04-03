
import React, { useEffect, useRef } from 'react';
import { X, AlertCircle, HelpCircle, Info, ShieldAlert } from 'lucide-react';

export type ModalType = 'info' | 'warning' | 'error' | 'success' | 'confirm' | 'danger';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string | React.ReactNode;
  type?: ModalType;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export const PremiumModal: React.FC<PremiumModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info',
  confirmText = 'Continuar',
  cancelText = 'Cancelar',
  isLoading = false
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
      case 'error': return <ShieldAlert className="w-8 h-8 text-red-500" />;
      case 'warning': return <AlertCircle className="w-8 h-8 text-amber-500" />;
      case 'confirm': return <HelpCircle className="w-8 h-8 text-delphi-keppel" />;
      case 'success': return <Info className="w-8 h-8 text-emerald-500" />;
      default: return <Info className="w-8 h-8 text-slate-400" />;
    }
  };

  const getButtonStyles = () => {
    switch (type) {
      case 'danger': return 'bg-red-600 hover:bg-red-700 shadow-red-200';
      case 'warning': return 'bg-amber-500 hover:bg-amber-600 shadow-amber-100';
      default: return 'bg-delphi-keppel hover:bg-delphi-keppel/90 shadow-delphi-keppel/20';
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div 
        ref={modalRef}
        className="relative bg-white/95 backdrop-blur-xl w-full max-w-md rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border border-white/40 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500"
      >
        {/* Header decoration */}
        <div className={`h-1.5 w-full ${
          type === 'danger' || type === 'error' ? 'bg-red-500' : 
          type === 'warning' ? 'bg-amber-500' : 'bg-delphi-keppel'
        }`} />

        <div className="p-8 pb-10">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-slate-50 rounded-2xl shadow-inner border border-slate-100">
              {getIcon()}
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">
            {title}
          </h3>
          
          <div className="text-slate-500 font-bold text-sm leading-relaxed mb-8">
            {typeof message === 'string' ? <p>{message}</p> : message}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-4 px-6 rounded-2xl border border-slate-200 text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
            >
              {cancelText}
            </button>
            {onConfirm && (
              <button 
                onClick={onConfirm}
                disabled={isLoading}
                className={`flex-[1.5] py-4 px-6 rounded-2xl text-white text-xs font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-50 ${getButtonStyles()}`}
              >
                {isLoading ? 'Procesando...' : confirmText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
