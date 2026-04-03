import React, { useState } from 'react';
import { HelpCircle, ChevronRight, Book, PlayCircle, X } from 'lucide-react';

interface FloatingHelpButtonProps {
  onOpenTour?: () => void;
}

export const FloatingHelpButton: React.FC<FloatingHelpButtonProps> = ({ onOpenTour }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-4">
      {/* Menu Options */}
      {isOpen && (
        <div className="flex flex-col items-end gap-3 mb-2 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <button 
            onClick={() => {
              window.open('https://github.com/AlvaGonz/Proyecto-Estimacion-Soft/wiki', '_blank');
              setIsOpen(false);
            }}
            className="flex items-center gap-3 px-5 py-3 bg-white text-slate-700 rounded-2xl shadow-xl border border-slate-100 hover:bg-slate-50 transition-all group"
          >
            <span className="text-xs font-black uppercase tracking-widest">Guía de Uso</span>
            <Book className="w-4 h-4 text-delphi-keppel group-hover:scale-110 transition-transform" />
          </button>
          
          {onOpenTour && (
            <button 
              onClick={() => {
                onOpenTour();
                setIsOpen(false);
              }}
              className="flex items-center gap-3 px-5 py-3 bg-white text-slate-700 rounded-2xl shadow-xl border border-slate-100 hover:bg-slate-50 transition-all group"
            >
              <span className="text-xs font-black uppercase tracking-widest">Tutorial Interactivo</span>
              <PlayCircle className="w-4 h-4 text-delphi-celadon group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>
      )}

      {/* Main Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 hover:scale-110 active:scale-95 ${
          isOpen 
            ? 'bg-slate-900 text-white rotate-90' 
            : 'bg-delphi-keppel text-white shadow-delphi-keppel/30'
        }`}
        aria-label="Ayuda y Soporte"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <HelpCircle className="w-7 h-7" />
        )}
      </button>
    </div>
  );
};
