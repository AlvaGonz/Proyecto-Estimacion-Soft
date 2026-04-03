import React from 'react';
import { Send, ArrowLeft, Info, FileText, BrainCircuit, Sparkles, ListChecks, Users, Shield, Target } from 'lucide-react';
import { Project, EstimationMethod, User } from '../../../../types';
import { WizardTask } from './useProjectForm';
import { LoadingSpinner } from '../../../../shared/components/LoadingSpinner';

interface ProjectFormSummaryProps {
  name: string;
  description: string;
  unit: string;
  estimationMethod: EstimationMethod;
  maxRounds: number;
  cvThreshold: number;
  sprints: number;
  tasks: WizardTask[];
  expertIds: string[];
  facilitatorId: string;
  allFacilitators: User[];
  allExperts: User[];
  isSubmitting: boolean;
  onPrev: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

const METHOD_LABELS: Record<string, string> = {
  'wideband-delphi': 'Wideband Delphi',
  'planning-poker': 'Planning Poker',
  'three-point': 'Tres Puntos (PERT)'
};

const UNIT_LABELS: Record<string, string> = {
  hours: 'Horas',
  storyPoints: 'Story Points',
  personDays: 'Días Persona',
};

export const ProjectFormSummary: React.FC<ProjectFormSummaryProps> = ({
  name, description, unit, estimationMethod, maxRounds, cvThreshold,
  sprints, tasks, expertIds, facilitatorId, allFacilitators, allExperts,
  isSubmitting, onPrev, onSubmit
}) => {
  const validTaskCount = tasks.filter(t => t.title.trim().length > 0).length;
  const facilitatorName = allFacilitators.find(f => f.id === facilitatorId)?.name || 'Sin asignar';
  const selectedExpertsCount = expertIds.length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="bg-delphi-keppel rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden group shadow-2xl shadow-delphi-keppel/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-20 h-20 bg-white/20 rounded-[2rem] flex items-center justify-center border border-white/30 shrink-0 transform group-hover:rotate-12 transition-transform duration-500">
             <Target className="w-10 h-10 text-white" />
          </div>
          <div>
            <h3 className="text-3xl font-black mb-2 tracking-tight">Resumen Final</h3>
            <p className="text-white/80 font-bold text-sm leading-relaxed max-w-xl">
              Verifica la configuración antes de iniciar la sesión de estimación. Una vez creado, algunos parámetros como la metodología quedarán bloqueados tras la primera ronda.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Project Details */}
        <div className="space-y-6">
           <div className="glass-card p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                 <FileText className="w-5 h-5 text-delphi-keppel" />
                 <h4 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400">Detalles de Identidad</h4>
              </div>
              
              <div className="space-y-4">
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-1">Nombre</p>
                    <p className="text-xl font-black text-slate-900 tracking-tight">{name}</p>
                 </div>
                 {description && (
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-1">Objetivo</p>
                      <p className="text-xs font-bold text-slate-500 leading-relaxed line-clamp-3">{description}</p>
                   </div>
                 )}
                 <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-1">Facilitador</p>
                       <p className="text-xs font-black text-slate-900 truncate">{facilitatorName}</p>
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-1">Unidad</p>
                       <p className="text-xs font-black text-slate-900">{UNIT_LABELS[unit] || unit}</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-delphi-keppel/5 rounded-full blur-2xl" />
              <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                 <BrainCircuit className="w-5 h-5 text-delphi-keppel" />
                 <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">Protocolo de Cálculo</h4>
              </div>
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Método</p>
                    <p className="text-sm font-black text-white">{METHOD_LABELS[estimationMethod]}</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Umbral CV</p>
                    <p className="text-sm font-black text-delphi-keppel">{cvThreshold / 100}</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Máx. Rondas</p>
                    <p className="text-sm font-black text-white">{maxRounds}</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Configuración</p>
                    <p className="text-sm font-black text-white">{sprints} Sprint{sprints !== 1 ? 's' : ''}</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Right Column: Tasks & Team */}
        <div className="space-y-6">
           <div className="glass-card p-8 rounded-[2.5rem] border border-slate-100 flex flex-col h-full space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                 <div className="flex items-center gap-3">
                   <ListChecks className="w-5 h-5 text-delphi-keppel" />
                   <h4 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400">Alcance & Equipo</h4>
                 </div>
                 <div className="flex gap-2">
                    <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest">{validTaskCount} Tareas</span>
                    <span className="px-2 py-0.5 rounded-lg bg-delphi-keppel text-white text-[8px] font-black uppercase tracking-widest">{selectedExpertsCount} Expertos</span>
                 </div>
              </div>
              
              <div className="flex-1 space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                 {tasks.slice(0, 5).map((t, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                       <span className="text-[10px] font-black text-slate-300">0{idx + 1}</span>
                       <span className="text-xs font-bold text-slate-700 truncate">{t.title}</span>
                    </div>
                 ))}
                 {tasks.length > 5 && (
                    <p className="text-[10px] text-center font-black text-slate-300 uppercase tracking-widest py-2">+ {tasks.length - 5} tareas adicionales</p>
                 )}
              </div>

              <div className="pt-6 border-t border-slate-100">
                 <div className="p-5 bg-delphi-celadon/10 rounded-2xl border border-delphi-celadon/30 flex items-start gap-4">
                    <Shield className="w-5 h-5 text-delphi-keppel shrink-0 mt-0.5" />
                    <p className="text-[10px] text-slate-600 font-bold leading-relaxed">
                      Al crear el proyecto, se notificará a los expertos seleccionados y el estado pasará a <strong>Preparación</strong>. Podrás cargar el LDR y otros documentos técnicos de inmediato.
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Final Actions */}
      <div className="flex flex-col sm:flex-row gap-4 pt-6">
        <button 
          type="button" 
          onClick={onPrev} 
          className="px-10 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
        >
          <ArrowLeft className="w-4 h-4" /> 
          Volver y Corregir
        </button>
        <button 
          onClick={onSubmit}
          disabled={isSubmitting || selectedExpertsCount < 1 || validTaskCount < 1}
          className="flex-1 bg-slate-900 text-white px-10 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 hover:bg-black hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:scale-100"
        >
          {isSubmitting ? <LoadingSpinner /> : (
            <>
              <Send className="w-4 h-4" /> 
              Lanzar Sesión de Estimación
            </>
          )}
        </button>
      </div>
    </div>
  );
};
