import React from 'react';
import { Target, Info, Shield, Clock, BarChart3, Users } from 'lucide-react';
import { User, UserRole } from '../../../../types';

interface ProjectBasicInfoProps {
  name: string;
  setName: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  unit: 'hours' | 'storyPoints' | 'personDays';
  setUnit: (val: 'hours' | 'storyPoints' | 'personDays') => void;
  facilitatorId: string;
  setFacilitatorId: (val: string) => void;
  allFacilitators: User[];
  currentUser: User;
  errors: Record<string, string>;
}

export const UNIT_OPTIONS = [
  { val: 'hours' as const, label: 'Horas', icon: Clock, desc: 'Estimación en horas de trabajo' },
  { val: 'storyPoints' as const, label: 'Story Points', icon: BarChart3, desc: 'Puntos de complejidad relativa' },
  { val: 'personDays' as const, label: 'Días Persona', icon: Users, desc: 'Esfuerzo en días-persona' },
] as const;

export const ProjectBasicInfo: React.FC<ProjectBasicInfoProps> = ({
  name, setName, description, setDescription, unit, setUnit,
  facilitatorId, setFacilitatorId, allFacilitators, currentUser, errors
}) => {
  const inputBase = (hasError: boolean) =>
    `w-full bg-slate-50 border-2 ${hasError ? 'border-red-400' : 'border-slate-100'} rounded-2xl px-5 py-4 text-sm md:text-base font-bold focus:ring-2 focus:ring-delphi-keppel/30 focus:border-delphi-keppel transition-all outline-none`;

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="bg-delphi-celadon/10 border border-delphi-celadon/30 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-delphi-keppel shrink-0 mt-0.5" />
        <p className="text-xs md:text-sm text-slate-600 font-medium leading-relaxed">
          Estás creando una sesión de estimación colaborativa. Define primero la información del proyecto.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <label htmlFor="projectName" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
            Nombre del Proyecto
          </label>
          <div className="relative group">
            <Target className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-delphi-keppel transition-colors" />
            <input
              id="projectName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              placeholder="Ej: Migración Cloud UCE"
              className={`${inputBase(!!errors.name)} pl-14`}
            />
          </div>
          <div className="flex justify-between items-center">
            {errors.name && <p className="text-red-500 text-xs ml-1">{errors.name}</p>}
            <span className="text-[10px] text-slate-300 font-bold ml-auto">{name.length}/120</span>
          </div>
        </div>

        {currentUser.role === UserRole.ADMIN && (
          <div className="space-y-3">
            <label htmlFor="facilitator" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
              Asignar Facilitador
            </label>
            <div className="relative group">
              <Shield className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-delphi-keppel transition-colors" />
              <select
                id="facilitator"
                value={facilitatorId}
                onChange={(e) => setFacilitatorId(e.target.value)}
                className={`${inputBase(!!errors.facilitatorId)} pl-14 appearance-none cursor-pointer`}
              >
                <option value="">Seleccionar facilitador...</option>
                {allFacilitators.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            {errors.facilitatorId && <p className="text-red-500 text-xs ml-1">{errors.facilitatorId}</p>}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <label htmlFor="projectDesc" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
          Descripción del Objetivo
        </label>
        <textarea
          id="projectDesc"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          placeholder="Describe el alcance técnico del proyecto..."
          className={`${inputBase(!!errors.description)} rounded-[1.5rem] resize-none`}
        />
        <div className="flex justify-between items-center">
          {errors.description && <p className="text-red-500 text-xs ml-1">{errors.description}</p>}
          <span className="text-[10px] text-slate-300 font-bold ml-auto">{description.length}/500</span>
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
          Unidad de Medida
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          {UNIT_OPTIONS.map(item => {
            const Icon = item.icon;
            const isSelected = unit === item.val;
            return (
              <button
                key={item.val}
                type="button"
                onClick={() => setUnit(item.val)}
                className={`p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center gap-2 sm:gap-3 cursor-pointer ${
                  isSelected
                    ? 'border-delphi-keppel bg-delphi-keppel/5 text-delphi-keppel shadow-lg shadow-delphi-keppel/5'
                    : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200 opacity-60'
                }`}
              >
                <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-delphi-keppel text-white shadow-md' : 'bg-slate-50 text-slate-400'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-black text-[10px] uppercase tracking-widest">{item.label}</span>
                <p className="text-[10px] text-slate-500 font-medium leading-tight text-center hidden sm:block">{item.desc}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
