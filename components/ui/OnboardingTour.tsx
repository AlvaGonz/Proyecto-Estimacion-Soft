import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';

interface TourStep {
  title: string;
  description: string;
  target?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Bienvenido a Delphi UCE',
    description: 'Como facilitador, tienes el control de los proyectos de estimación. Te mostraremos las funciones clave.',
  },
  {
    title: 'Crear Proyectos',
    description: 'Puedes crear nuevos proyectos, definir tareas y asignar expertos desde el panel principal.',
  },
  {
    title: 'Gestionar Rondas',
    description: 'Inicia y cierra rondas de estimación. El sistema calculará automáticamente la convergencia.',
  },
  {
    title: 'Generar Reportes',
    description: 'Al finalizar, genera reportes en PDF o Excel con toda la trazabilidad y justificaciones.',
  }
];

export const OnboardingTour: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('onboarding_complete');
    // Only show if not completed (we assume the parent component checks if role is FACILITATOR)
    if (!hasCompletedOnboarding) {
      setIsOpen(true);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowRight' && currentStep < TOUR_STEPS.length - 1) setCurrentStep(c => c + 1);
      if (e.key === 'ArrowLeft' && currentStep > 0) setCurrentStep(c => c - 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('onboarding_complete', 'true');
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(c => c + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(c => c - 1);
    }
  };

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      aria-describedby="onboarding-desc"
    >
      <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-1.5">
              {TOUR_STEPS.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-6 bg-delphi-keppel' : 'w-1.5 bg-slate-200'}`} 
                />
              ))}
            </div>
            <button 
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              aria-label="Cerrar tour"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <h3 id="onboarding-title" className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
            {step.title}
          </h3>
          <p id="onboarding-desc" className="text-slate-500 leading-relaxed mb-8">
            {step.description}
          </p>
          
          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
            <button 
              onClick={handleClose}
              className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
            >
              Saltar
            </button>
            
            <div className="flex gap-3">
              {currentStep > 0 && (
                <button 
                  onClick={handlePrev}
                  className="p-3 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
                  aria-label="Paso anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <button 
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-delphi-keppel text-white font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-delphi-keppel/20"
              >
                {currentStep === TOUR_STEPS.length - 1 ? (
                  <>Finalizar <Check className="w-4 h-4" /></>
                ) : (
                  <>Siguiente <ChevronRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
