
import React, { useState } from 'react';
import { ArrowLeft, Target, Plus, Users, Shield, Send, Check } from 'lucide-react';
import { Project, UserRole } from '../types';

interface ProjectFormProps {
  onSubmit: (project: Project) => void;
  onCancel: () => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ onSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState<'Horas' | 'Puntos de Historia' | 'Días Persona'>('Horas');
  const [step, setStep] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProject: Project = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      description,
      unit,
      facilitatorId: 'u1',
      expertIds: ['u2', 'u3'], // Mock experts
      status: 'Activo',
      createdAt: Date.now()
    };
    onSubmit(newProject);
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex items-center gap-6">
        <button onClick={onCancel} className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-delphi-keppel transition-all">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Nuevo Proyecto</h2>
          <p className="text-slate-400 font-bold mt-2">Configura los parámetros iniciales de la sesión Delphi.</p>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden flex flex-col md:flex-row">
        {/* Progress Sidebar */}
        <div className="w-full md:w-64 bg-slate-900 p-10 space-y-8">
           {[
             { n: 1, label: 'Identidad', sub: 'Nombre y detalle' },
             { n: 2, label: 'Métrica', sub: 'Unidades de medida' },
             { n: 3, label: 'Kickoff', sub: 'Asignar expertos' },
           ].map(s => (
             <div key={s.n} className="flex gap-4 items-center group cursor-default">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all ${step === s.n ? 'bg-delphi-keppel text-white scale-110 shadow-lg shadow-delphi-keppel/30' : step > s.n ? 'bg-delphi-celadon text-slate-900' : 'bg-slate-800 text-slate-600'}`}>
                   {step > s.n ? <Check className="w-5 h-5" /> : s.n}
                </div>
                <div>
                   <p className={`text-xs font-black uppercase tracking-widest ${step === s.n ? 'text-white' : 'text-slate-500'}`}>{s.label}</p>
                   <p className="text-[10px] text-slate-600 font-bold">{s.sub}</p>
                </div>
             </div>
           ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 p-10 md:p-16 space-y-10">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Nombre del Proyecto</label>
                  <div className="relative group">
                     <Target className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-delphi-keppel transition-colors" />
                     <input 
                        required
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej: Migración Cloud UCE"
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold focus:ring-2 focus:ring-delphi-keppel/30 focus:border-delphi-keppel/30 transition-all outline-none"
                     />
                  </div>
               </div>
               <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Descripción del Objetivo</label>
                  <textarea 
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe el alcance técnico a estimar..."
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] px-6 py-4 text-sm font-medium focus:ring-2 focus:ring-delphi-keppel/30 focus:border-delphi-keppel/30 transition-all outline-none"
                  />
               </div>
               <button type="button" onClick={() => setStep(2)} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all">Siguiente</button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Unidad de Estimación (RF006)</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['Horas', 'Puntos de Historia', 'Días Persona'].map(u => (
                      <button 
                        key={u}
                        type="button"
                        onClick={() => setUnit(u as any)}
                        className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-4 ${unit === u ? 'border-delphi-keppel bg-delphi-keppel/5 text-delphi-keppel shadow-xl shadow-delphi-keppel/5' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'}`}
                      >
                        <div className={`p-3 rounded-2xl ${unit === u ? 'bg-delphi-keppel text-white' : 'bg-slate-50 text-slate-400'}`}>
                          <Plus className="w-6 h-6" />
                        </div>
                        <span className="font-black text-[10px] uppercase tracking-widest">{u}</span>
                      </button>
                    ))}
                  </div>
               </div>
               <div className="flex gap-4">
                 <button type="button" onClick={() => setStep(1)} className="px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">Atrás</button>
                 <button type="button" onClick={() => setStep(3)} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all">Siguiente</button>
               </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="bg-delphi-vanilla/40 p-8 rounded-[2rem] border-2 border-dashed border-delphi-vanilla flex flex-col items-center text-center gap-6">
                  <div className="bg-white p-4 rounded-full shadow-lg">
                    <Users className="w-10 h-10 text-delphi-orange" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900">Asignar Panel de Expertos</h4>
                    <p className="text-sm text-slate-500 font-medium">Se enviará una invitación automática a los 5 expertos preconfigurados para este equipo.</p>
                  </div>
                  <div className="flex -space-x-3">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-slate-200 flex items-center justify-center text-xs font-black text-slate-400">EX</div>
                    ))}
                  </div>
               </div>
               <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-start gap-4">
                  <Shield className="w-6 h-6 text-delphi-keppel shrink-0 mt-1" />
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Al confirmar, el proyecto pasará a estado <strong>Kickoff</strong> y se habilitará la subida de documentación técnica.
                  </p>
               </div>
               <div className="flex gap-4">
                 <button type="button" onClick={() => setStep(2)} className="px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">Atrás</button>
                 <button type="submit" className="bg-delphi-keppel text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-delphi-keppel/20 hover:scale-105 transition-all flex items-center gap-2">
                   <Send className="w-4 h-4" /> Finalizar y Abrir Sesión
                 </button>
               </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ProjectForm;
