import React, { useState } from 'react';
import {
  ArrowLeft, ArrowRight, Target, Plus, Users, Shield, Send, Check,
  BrainCircuit, Layers, BarChart3, Clock, Trash2, ChevronUp, ChevronDown,
  FileText, Info, Sparkles, ListChecks, ClipboardCheck
} from 'lucide-react';
import { Project, type EstimationMethod, UserRole, User, METHOD_LABELS } from '../types';
import { projectSchemaV2, wizardStep1Schema, wizardStep2Schema, wizardTaskSchema } from '../utils/schemas';
import { userService } from '../services/userService';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { z } from 'zod';

// ─── Types ─────────────────────────────────────────────────────
interface ProjectFormProps {
  onSubmit: (project: Project, tasks: WizardTask[]) => void;
  onCancel: () => void;
  editingProject?: Project;
}

interface WizardTask {
  id: string;
  title: string;
  description: string;
  touched: boolean;
}

type TimeLimitOption = 'none' | '24h' | '48h' | '72h' | '1w';

// ─── Constants ─────────────────────────────────────────────────
const TOTAL_STEPS = 5;

const UNIT_OPTIONS = [
  { val: 'hours' as const, label: 'Horas', icon: Clock, desc: 'Estimación en horas de trabajo' },
  { val: 'storyPoints' as const, label: 'Story Points', icon: BarChart3, desc: 'Puntos de complejidad relativa' },
  { val: 'personDays' as const, label: 'Días Persona', icon: Users, desc: 'Esfuerzo en días-persona' },
] as const;

const METHOD_OPTIONS = [
  {
    value: 'wideband-delphi' as const,
    label: 'Wideband Delphi',
    icon: BrainCircuit,
    badge: 'Recomendado',
    desc: 'Estimación numérica libre por expertos anónimos, iterativa.',
    when: 'Equipos con experiencia que necesitan consenso riguroso.',
  },
  {
    value: 'planning-poker' as const,
    label: 'Planning Poker',
    icon: Layers,
    badge: null,
    desc: 'Votación con baraja Fibonacci, consenso por selección de carta.',
    when: 'Equipos ágiles que prefieren comparación relativa.',
  },
  {
    value: 'three-point' as const,
    label: 'Tres Puntos (PERT)',
    icon: BarChart3,
    badge: null,
    desc: 'Valores Optimista, Más Probable y Pesimista. Fórmula PERT.',
    when: 'Tareas con alta incertidumbre que requieren rangos.',
  },
] as const;

const TIME_LIMIT_OPTIONS: { val: TimeLimitOption; label: string }[] = [
  { val: 'none', label: 'Sin límite' },
  { val: '24h', label: '24 horas' },
  { val: '48h', label: '48 horas' },
  { val: '72h', label: '72 horas' },
  { val: '1w', label: '1 semana' },
];

const STEP_META = [
  { n: 1, label: 'General', sub: 'Info del Proyecto', icon: FileText },
  { n: 2, label: 'Método', sub: 'Estimación', icon: BrainCircuit },
  { n: 3, label: 'Config', sub: 'Parámetros', icon: Sparkles },
  { n: 4, label: 'Tareas', sub: 'Elementos', icon: ListChecks },
  { n: 5, label: 'Resumen', sub: 'Confirmación', icon: ClipboardCheck },
];

const UNIT_LABELS: Record<string, string> = {
  hours: 'Horas',
  storyPoints: 'Story Points',
  personDays: 'Días Persona',
};

// ─── Component ─────────────────────────────────────────────────
const ProjectForm: React.FC<ProjectFormProps> = ({ onSubmit, onCancel, editingProject }) => {
  // Step 1 state
  const [name, setName] = useState(editingProject?.name ?? '');
  const [description, setDescription] = useState(editingProject?.description ?? '');
  const [unit, setUnit] = useState<'hours' | 'storyPoints' | 'personDays'>(editingProject?.unit ?? 'hours');

  // Step 2 state
  const [estimationMethod, setEstimationMethod] = useState<EstimationMethod>(editingProject?.estimationMethod ?? 'wideband-delphi');
  const [hasStartedRounds] = useState(editingProject?.hasStartedRounds ?? false);

  // Step 3 state — Method-specific config (local only, not persisted to Project type)
  const [maxRounds, setMaxRounds] = useState(editingProject?.maxRounds ?? 3);
  const [cvThreshold, setCvThreshold] = useState((editingProject?.convergenceConfig?.cvThreshold ?? 0.25) * 100);
  const [timeLimit, setTimeLimit] = useState<TimeLimitOption>('none');
  const [useFibonacci, setUseFibonacci] = useState(true);
  const [customCards, setCustomCards] = useState('');
  const [showFormula, setShowFormula] = useState(true);
  const [sprints, setSprints] = useState(editingProject?.sprints ?? 1);

  // Step 4 state
  const [wizardTasks, setWizardTasks] = useState<WizardTask[]>([
    { id: crypto.randomUUID(), title: '', description: '', touched: false },
  ]);

  // Step 5 / Expert assignment state
  const [expertIds, setExpertIds] = useState<string[]>(editingProject?.expertIds ?? []);
  const [allExperts, setAllExperts] = useState<User[]>([]);
  const [isLoadingExperts, setIsLoadingExperts] = useState(false);

  // Wizard state
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Fetch experts when reaching step 5 ────────────────────
  React.useEffect(() => {
    if (step === 5) {
      const fetchExperts = async () => {
        setIsLoadingExperts(true);
        try {
          const users = await userService.getAllUsers();
          setAllExperts(users.filter(u => u.role === UserRole.EXPERT));
        } catch (err) {
          console.error('Error fetching experts', err);
        } finally {
          setIsLoadingExperts(false);
        }
      };
      fetchExperts();
    }
  }, [step]);

  // ─── Per-step validation ──────────────────────────────────
  const validateStep = (targetStep: number): boolean => {
    setErrors({});
    try {
      switch (targetStep) {
        case 1:
          wizardStep1Schema.parse({ name, description, unit });
          return true;
        case 2:
          wizardStep2Schema.parse({ estimationMethod });
          return true;
        case 3:
          if (maxRounds < 1 || maxRounds > 10) {
            setErrors({ maxRounds: 'Las rondas deben ser entre 1 y 10' });
            return false;
          }
          return true;
        case 4: {
          const validTasks = wizardTasks.filter(t => t.title.trim().length > 0);
          if (validTasks.length === 0) {
            setErrors({ tasks: 'Debes agregar al menos una tarea con título' });
            return false;
          }
          for (const t of validTasks) {
            const result = wizardTaskSchema.safeParse({ title: t.title, description: t.description || undefined });
            if (!result.success) {
              setErrors({ tasks: result.error.issues[0]?.message ?? 'Tarea inválida' });
              return false;
            }
          }
          return true;
        }
        default:
          return true;
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.issues.forEach(issue => {
          newErrors[issue.path[0] as string] = issue.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(Math.min(step + 1, TOTAL_STEPS));
    }
  };

  const handlePrev = () => {
    setErrors({});
    setStep(Math.max(step - 1, 1));
  };

  // ─── Task management ─────────────────────────────────────
  const addTask = () => {
    setWizardTasks(prev => [...prev, { id: crypto.randomUUID(), title: '', description: '', touched: false }]);
  };

  const removeTask = (id: string) => {
    const task = wizardTasks.find(t => t.id === id);
    if (task?.touched && !window.confirm('¿Eliminar esta tarea? Los datos se perderán.')) return;
    setWizardTasks(prev => prev.filter(t => t.id !== id));
  };

  const updateTask = (id: string, field: 'title' | 'description', value: string) => {
    setWizardTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, [field]: value, touched: true } : t))
    );
  };

  const moveTask = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= wizardTasks.length) return;
    const next = [...wizardTasks];
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    setWizardTasks(next);
  };

  // ─── Submit ───────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      projectSchemaV2.parse({ name, description, unit, estimationMethod, maxRounds, sprints });
      setErrors({});
      setIsSubmitting(true);

      const projectData: Project = {
        ...(editingProject ?? {} as Partial<Project>),
        id: editingProject?.id ?? '',
        name,
        description,
        unit,
        facilitatorId: editingProject?.facilitatorId ?? '',
        expertIds,
        status: editingProject?.status ?? 'preparation',
        estimationMethod,
        maxRounds,
        sprints,
        convergenceConfig: { cvThreshold: cvThreshold / 100, maxOutlierPercent: 0.30 },
        hasStartedRounds,
        createdAt: editingProject?.createdAt ?? Date.now(),
      } as Project;

      const validTasks = wizardTasks
        .filter(t => t.title.trim().length > 0)
        .map(t => ({ id: t.id, title: t.title.trim(), description: t.description.trim(), touched: t.touched }));

      onSubmit(projectData, validTasks);
    } catch (error: unknown) {
      setIsSubmitting(false);
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach(err => {
          const path = err.path[0];
          if (path && typeof path === 'string') newErrors[path] = err.message;
        });
        setErrors(newErrors);
        if (newErrors.name || newErrors.description || newErrors.unit) setStep(1);
        else if (newErrors.estimationMethod) setStep(2);
      }
    }
  };

  // ─── Render helpers ───────────────────────────────────────
  const inputBase = (hasError: boolean) =>
    `w-full bg-slate-50 border-2 ${hasError ? 'border-red-400' : 'border-slate-100'} rounded-2xl px-5 py-4 text-sm md:text-base font-bold focus:ring-2 focus:ring-delphi-keppel/30 focus:border-delphi-keppel transition-all outline-none`;

  const btnPrimary = 'bg-slate-900 text-white px-8 py-3.5 sm:px-10 sm:py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2';
  const btnSecondary = 'px-8 py-3.5 sm:px-10 sm:py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all inline-flex items-center gap-2';

  // ─── Step 1: General Info ─────────────────────────────────
  const renderStep1 = () => (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Context banner */}
      <div className="bg-delphi-celadon/10 border border-delphi-celadon/30 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-delphi-keppel shrink-0 mt-0.5" />
        <p className="text-xs md:text-sm text-slate-600 font-medium leading-relaxed">
          Estás creando una sesión de estimación colaborativa. Define primero la información del proyecto.
        </p>
      </div>

      {/* Name */}
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
            aria-describedby="name-error"
            className={`${inputBase(!!errors.name)} pl-14`}
          />
        </div>
        <div className="flex justify-between items-center">
          {errors.name && <p id="name-error" role="alert" className="text-red-500 text-xs ml-1">{errors.name}</p>}
          <span className="text-[10px] text-slate-300 font-bold ml-auto">{name.length}/120</span>
        </div>
      </div>

      {/* Description */}
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
          aria-describedby="description-error"
          className={`${inputBase(!!errors.description)} rounded-[1.5rem] resize-none`}
        />
        <div className="flex justify-between items-center">
          {errors.description && <p id="description-error" role="alert" className="text-red-500 text-xs ml-1">{errors.description}</p>}
          <span className="text-[10px] text-slate-300 font-bold ml-auto">{description.length}/500</span>
        </div>
      </div>

      {/* Unit selection (card-based) */}
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
                aria-pressed={isSelected}
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
        {errors.unit && <p role="alert" className="text-red-500 text-xs ml-1">{errors.unit}</p>}
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button type="button" onClick={handleNext} disabled={!name.trim() || !description.trim()} className={`${btnPrimary} w-full sm:w-auto justify-center`}>
          Siguiente <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  // ─── Step 2: Method Selection ─────────────────────────────
  const renderStep2 = () => (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      {hasStartedRounds && (
        <div className="bg-delphi-vanilla/60 border-2 border-delphi-orange/40 rounded-2xl p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-delphi-giants shrink-0" />
          <p className="text-sm font-bold text-slate-800">
            No se puede cambiar el método después de iniciar rondas (RF034)
          </p>
        </div>
      )}

      <div className="space-y-4" role="group" aria-labelledby="method-label">
        <label id="method-label" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 block">
          Método de Estimación
        </label>
        <p className="text-xs md:text-sm text-slate-500 font-medium -mt-2">Selecciona cómo el equipo estimará cada tarea</p>

        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${hasStartedRounds ? 'opacity-50 pointer-events-none' : ''}`}>
          {METHOD_OPTIONS.map((m) => {
            const Icon = m.icon;
            const isSelected = estimationMethod === m.value;
            return (
              <button
                key={m.value}
                type="button"
                aria-pressed={isSelected}
                onClick={() => !hasStartedRounds && setEstimationMethod(m.value)}
                className={`p-5 sm:p-6 rounded-3xl border-2 transition-all duration-200 flex flex-col gap-3 text-left cursor-pointer ${
                  isSelected
                    ? 'border-delphi-keppel bg-delphi-keppel/5 text-delphi-keppel shadow-xl shadow-delphi-keppel/5'
                    : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200 opacity-50'
                }`}
              >
                <div className="flex items-center gap-2 w-full justify-between">
                  <div className={`p-3 rounded-2xl ${isSelected ? 'bg-delphi-keppel text-white' : 'bg-slate-50 text-slate-400'}`}>
                    <Icon className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  {isSelected && <Check className="w-5 h-5 text-delphi-keppel" />}
                  {m.badge && (
                    <span className="px-2 py-1 rounded-lg bg-delphi-celadon/50 text-delphi-keppel text-[9px] font-black uppercase">
                      {m.badge}
                    </span>
                  )}
                </div>
                <span className="font-black text-xs uppercase tracking-widest">{m.label}</span>
                <p className="text-[11px] text-slate-500 font-medium leading-snug">{m.desc}</p>
                <p className="text-[10px] text-slate-400 font-bold italic leading-snug">
                  📌 {m.when}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button type="button" onClick={handlePrev} className={btnSecondary}>
          <ArrowLeft className="w-4 h-4" /> Anterior
        </button>
        <button type="button" onClick={handleNext} className={`${btnPrimary} w-full sm:w-auto justify-center`}>
          Siguiente <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  // ─── Step 3: Dynamic Method Config (RF031) ─────────────────
  const renderMethodConfig = () => {
    switch (estimationMethod) {
      case 'wideband-delphi':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
              <BrainCircuit className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs md:text-sm text-blue-700 font-medium leading-relaxed">
                <strong>Wideband Delphi:</strong> cada experto ingresa un valor numérico libre. Las estimaciones se revelan al cierre de la ronda.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="maxRounds" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                  Número máximo de rondas
                </label>
                <input id="maxRounds" type="number" min={1} max={10} value={maxRounds}
                  onChange={(e) => setMaxRounds(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                  className={inputBase(!!errors.maxRounds)} />
                {errors.maxRounds && <p className="text-red-500 text-xs">{errors.maxRounds}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="cvThreshold" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                  Umbral de convergencia (CV%)
                </label>
                <div className="flex items-center gap-3">
                  <input id="cvThreshold" type="range" min={5} max={50} value={cvThreshold}
                    onChange={(e) => setCvThreshold(parseInt(e.target.value))}
                    className="flex-1 accent-delphi-keppel h-2" />
                  <span className="text-sm font-black text-delphi-keppel min-w-[3rem] text-right">{cvThreshold}%</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">El proceso termina cuando el CV baje de este valor.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="timeLimit" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                  Tiempo límite por ronda
                </label>
                <select id="timeLimit" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value as TimeLimitOption)}
                  className={`${inputBase(false)} cursor-pointer`}>
                  {TIME_LIMIT_OPTIONS.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="sprints" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                  Número de Sprints
                </label>
                <input id="sprints" type="number" min={1} max={50} value={sprints}
                  onChange={(e) => setSprints(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                  className={inputBase(false)} />
              </div>
            </div>
          </div>
        );

      case 'planning-poker':
        return (
          <div className="space-y-6">
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex items-start gap-3">
              <Layers className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
              <p className="text-xs md:text-sm text-purple-700 font-medium leading-relaxed">
                <strong>Planning Poker:</strong> cada experto selecciona una carta de la baraja. El facilitador revela todas las cartas al mismo tiempo.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div>
                  <p className="text-xs font-black text-slate-700">Usar escala Fibonacci estándar</p>
                  <p className="text-[10px] text-slate-400 font-medium">0, 1, 2, 3, 5, 8, 13, 21, ?</p>
                </div>
                <button type="button" onClick={() => setUseFibonacci(!useFibonacci)}
                  className={`w-12 h-7 rounded-full transition-all duration-200 ${useFibonacci ? 'bg-delphi-keppel' : 'bg-slate-300'} relative`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-1 transition-all duration-200 ${useFibonacci ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              {!useFibonacci && (
                <div className="space-y-2 animate-in fade-in duration-300">
                  <label htmlFor="customCards" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                    Valores personalizados (separados por coma)
                  </label>
                  <input id="customCards" type="text" value={customCards}
                    onChange={(e) => setCustomCards(e.target.value)}
                    placeholder="Ej: 1, 2, 4, 8, 16, 32"
                    className={inputBase(false)} />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="maxRoundsPoker" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                  Número máximo de rondas
                </label>
                <input id="maxRoundsPoker" type="number" min={1} max={10} value={maxRounds}
                  onChange={(e) => setMaxRounds(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                  className={inputBase(false)} />
              </div>

              <div className="space-y-2">
                <label htmlFor="timeLimitPoker" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                  Tiempo límite por ronda
                </label>
                <select id="timeLimitPoker" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value as TimeLimitOption)}
                  className={`${inputBase(false)} cursor-pointer`}>
                  {TIME_LIMIT_OPTIONS.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="sprintsPoker" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                Número de Sprints
              </label>
              <input id="sprintsPoker" type="number" min={1} max={50} value={sprints}
                onChange={(e) => setSprints(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                className={`${inputBase(false)} max-w-xs`} />
            </div>
          </div>
        );

      case 'three-point':
        return (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <BarChart3 className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs md:text-sm text-amber-700 font-medium leading-relaxed">
                <strong>Tres Puntos (PERT):</strong> cada experto ingresa valor Optimista (O), Más Probable (M) y Pesimista (P). El sistema calcula E = (O + 4M + P) / 6.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="maxRoundsThreeP" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                  Número máximo de rondas
                </label>
                <input id="maxRoundsThreeP" type="number" min={1} max={10} value={maxRounds}
                  onChange={(e) => setMaxRounds(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                  className={inputBase(false)} />
              </div>

              <div className="space-y-2">
                <label htmlFor="cvThresholdThreeP" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                  Umbral de convergencia (CV%)
                </label>
                <div className="flex items-center gap-3">
                  <input id="cvThresholdThreeP" type="range" min={5} max={50} value={cvThreshold}
                    onChange={(e) => setCvThreshold(parseInt(e.target.value))}
                    className="flex-1 accent-delphi-keppel h-2" />
                  <span className="text-sm font-black text-delphi-keppel min-w-[3rem] text-right">{cvThreshold}%</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <div>
                <p className="text-xs font-black text-slate-700">Mostrar fórmula PERT a expertos</p>
                <p className="text-[10px] text-slate-400 font-medium">E = (O + 4M + P) / 6</p>
              </div>
              <button type="button" onClick={() => setShowFormula(!showFormula)}
                className={`w-12 h-7 rounded-full transition-all duration-200 ${showFormula ? 'bg-delphi-keppel' : 'bg-slate-300'} relative`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-1 transition-all duration-200 ${showFormula ? 'left-6' : 'left-1'}`} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="timeLimitThreeP" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                  Tiempo límite por ronda
                </label>
                <select id="timeLimitThreeP" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value as TimeLimitOption)}
                  className={`${inputBase(false)} cursor-pointer`}>
                  {TIME_LIMIT_OPTIONS.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="sprintsThreeP" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                  Número de Sprints
                </label>
                <input id="sprintsThreeP" type="number" min={1} max={50} value={sprints}
                  onChange={(e) => setSprints(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                  className={inputBase(false)} />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderStep3 = () => (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div>
        <h3 className="font-black text-base md:text-lg text-slate-900">
          Configuración: {METHOD_LABELS[estimationMethod]}
        </h3>
        <p className="text-xs text-slate-500 font-medium mt-1">Ajusta los parámetros del método seleccionado</p>
      </div>

      {renderMethodConfig()}

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button type="button" onClick={handlePrev} className={btnSecondary}>
          <ArrowLeft className="w-4 h-4" /> Anterior
        </button>
        <button type="button" onClick={handleNext} className={`${btnPrimary} w-full sm:w-auto justify-center`}>
          Siguiente <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  // ─── Step 4: Task Definition (RF008) ──────────────────────
  const renderStep4 = () => (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div>
        <h3 className="font-black text-base md:text-lg text-slate-900">Tareas a Estimar</h3>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Define las tareas que el equipo estimará. Mínimo 1 tarea requerida.
        </p>
      </div>

      <div className="space-y-4">
        {wizardTasks.map((task, idx) => (
          <div key={task.id} className="bg-white p-4 md:p-5 rounded-2xl border-2 border-slate-100 space-y-3 group hover:border-slate-200 transition-colors">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest shrink-0">
                Tarea {idx + 1}
              </span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => moveTask(idx, 'up')} disabled={idx === 0}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all" aria-label="Mover arriba">
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => moveTask(idx, 'down')} disabled={idx === wizardTasks.length - 1}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all" aria-label="Mover abajo">
                  <ChevronDown className="w-4 h-4" />
                </button>
                {wizardTasks.length > 1 && (
                  <button type="button" onClick={() => removeTask(task.id)}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all" aria-label="Eliminar tarea">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <input type="text" value={task.title}
              onChange={(e) => updateTask(task.id, 'title', e.target.value)}
              maxLength={200}
              placeholder="Título de la tarea (requerido)"
              className={`${inputBase(!task.title.trim() && task.touched)} text-sm`} />

            <textarea value={task.description}
              onChange={(e) => updateTask(task.id, 'description', e.target.value)}
              maxLength={300}
              rows={2}
              placeholder="Descripción breve (opcional, max 300 chars)"
              className={`${inputBase(false)} text-sm resize-none`} />
          </div>
        ))}

        <button type="button" onClick={addTask}
          className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-delphi-keppel hover:text-delphi-keppel transition-all font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer">
          <Plus className="w-4 h-4" /> Agregar tarea
        </button>
      </div>

      {errors.tasks && <p role="alert" className="text-red-500 text-xs font-bold">{errors.tasks}</p>}

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button type="button" onClick={handlePrev} className={btnSecondary}>
          <ArrowLeft className="w-4 h-4" /> Anterior
        </button>
        <button type="button" onClick={handleNext}
          disabled={wizardTasks.filter(t => t.title.trim()).length === 0}
          className={`${btnPrimary} w-full sm:w-auto justify-center`}>
          Siguiente <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  // ─── Step 5: Summary + Expert Assignment + Confirm ────────
  const validTaskCount = wizardTasks.filter(t => t.title.trim().length > 0).length;

  const renderStep5 = () => (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Read-only summary */}
      <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 md:p-6 space-y-4">
        <h3 className="font-black text-sm uppercase tracking-widest text-slate-500">Resumen del Proyecto</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre</p>
            <p className="text-sm font-bold text-slate-900">{name}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Método</p>
            <span className="inline-block px-3 py-1 rounded-lg bg-delphi-keppel/10 text-delphi-keppel text-xs font-black">
              {METHOD_LABELS[estimationMethod]}
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Unidad</p>
            <p className="text-sm font-bold text-slate-900">{UNIT_LABELS[unit]}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Máx. Rondas</p>
            <p className="text-sm font-bold text-slate-900">{maxRounds}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">CV Threshold</p>
            <p className="text-sm font-bold text-slate-900">{cvThreshold}%</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tareas</p>
            <p className="text-sm font-bold text-slate-900">{validTaskCount} tarea{validTaskCount !== 1 ? 's' : ''} definida{validTaskCount !== 1 ? 's' : ''}</p>
          </div>
        </div>
        {description && (
          <div className="space-y-1 pt-2 border-t border-slate-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Descripción</p>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">{description}</p>
          </div>
        )}
      </div>

      {/* Expert assignment */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border-2 border-slate-100 space-y-4">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 p-2.5 rounded-xl">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs">Asignar Expertos</h4>
            <p className="text-[10px] text-slate-500 font-bold">Selecciona el panel de expertos</p>
          </div>
        </div>

        {isLoadingExperts ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : allExperts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
            {allExperts.map(expert => {
              const isSelected = expertIds.includes(expert.id);
              return (
                <button key={expert.id} type="button"
                  onClick={() => {
                    if (isSelected) setExpertIds(expertIds.filter(id => id !== expert.id));
                    else setExpertIds([...expertIds, expert.id]);
                  }}
                  aria-label={`${expert.name} — ${expert.expertiseArea || 'Sin especialidad'}`}
                  className={`p-3 rounded-xl border-2 transition-all flex items-center gap-3 text-left cursor-pointer ${
                    isSelected
                      ? 'border-delphi-keppel bg-delphi-keppel/5 text-delphi-keppel'
                      : 'border-slate-50 bg-slate-50/50 text-slate-500 hover:border-slate-200'
                  }`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[10px] shrink-0 ${
                    isSelected ? 'bg-delphi-keppel text-white' : 'bg-slate-200 text-slate-400'
                  }`}>
                    {isSelected ? <Check className="w-4 h-4" /> : expert.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black truncate">{expert.name}</p>
                    <p className="text-[8px] text-slate-400 font-bold truncate">{expert.email}</p>
                    {expert.expertiseArea && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded-md bg-delphi-celadon/20 text-delphi-keppel text-[7px] font-black uppercase tracking-wider truncate max-w-full">
                        {expert.expertiseArea}
                      </span>
                    )}
                    {!expert.expertiseArea && (
                      <span className="inline-block mt-1 text-[7px] text-slate-300 font-bold italic truncate">
                        Sin especialidad
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 opacity-50 gap-2">
            <Users className="w-8 h-8 text-slate-300" />
            <p className="text-xs font-bold text-slate-400">No hay expertos registrados</p>
          </div>
        )}

        <div className="flex justify-between items-center pt-2 border-t border-slate-50 px-1">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            Seleccionados: <span className="text-delphi-keppel">{expertIds.length}</span>
          </p>
          {expertIds.length === 0 && <p className="text-[8px] text-red-400 font-bold italic">Se requiere al menos uno</p>}
        </div>
      </div>

      {/* Info */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
        <Shield className="w-5 h-5 text-delphi-keppel shrink-0 mt-0.5" />
        <p className="text-[10px] md:text-xs text-slate-500 font-medium leading-relaxed">
          Al confirmar, el proyecto pasará a estado <strong>Kickoff</strong> y se habilitará la subida de documentación técnica.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button type="button" onClick={handlePrev} className={btnSecondary}>
          <ArrowLeft className="w-4 h-4" /> Revisar
        </button>
        <button type="submit" disabled={expertIds.length === 0 || isSubmitting}
          className={`w-full sm:w-auto bg-delphi-keppel text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-delphi-keppel/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed`}>
          {isSubmitting ? <LoadingSpinner /> : <><Send className="w-4 h-4" /> Crear Proyecto</>}
        </button>
      </div>
    </div>
  );

  // ─── Main render ──────────────────────────────────────────
  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex items-center gap-4 md:gap-6">
        <button onClick={onCancel} aria-label="Cancelar y volver"
          className="w-10 h-10 md:w-12 md:h-12 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-delphi-keppel hover:border-delphi-keppel/30 transition-all outline-none cursor-pointer">
          <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight">
            {editingProject ? 'Editar Proyecto' : 'Nueva Sesión de Estimación'}
          </h2>
          <p className="text-slate-400 font-bold mt-1 text-xs md:text-sm">
            Paso {step} de {TOTAL_STEPS} — {STEP_META[step - 1].label}
          </p>
        </div>
      </div>

      <div className="glass-card rounded-[2rem] md:rounded-[3rem] border border-white/40 shadow-2xl overflow-hidden flex flex-col lg:flex-row">
        {/* Progress Sidebar */}
        <div className="w-full lg:w-72 bg-slate-900/95 backdrop-blur-xl p-4 sm:p-6 lg:p-8 flex flex-row lg:flex-col justify-between lg:justify-start gap-2 sm:gap-3 lg:gap-0 overflow-x-auto no-scrollbar">
          {STEP_META.map((s, idx, arr) => (
            <div key={s.n} className="flex lg:flex-col gap-0 shrink-0">
              <div className="flex gap-3 items-center group cursor-default">
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-black text-xs transition-all duration-300 ${
                  step === s.n
                    ? 'bg-delphi-keppel text-white scale-110 shadow-lg shadow-delphi-keppel/30'
                    : step > s.n
                    ? 'bg-delphi-celadon text-slate-900'
                    : 'bg-slate-800 text-slate-600'
                }`}>
                  {step > s.n ? <Check className="w-4 h-4" /> : s.n}
                </div>
                <div className="hidden sm:block">
                  <p className={`text-[10px] font-black uppercase tracking-widest ${step === s.n ? 'text-white' : 'text-slate-500'}`}>{s.label}</p>
                  <p className="text-[8px] text-slate-600 font-bold">{s.sub}</p>
                </div>
              </div>
              {idx < arr.length - 1 && (
                <div className="hidden lg:flex justify-center py-0.5">
                  <div className={`w-0.5 h-5 rounded-full transition-colors duration-300 ${step > s.n ? 'bg-delphi-celadon/50' : 'bg-slate-800'}`} />
                </div>
              )}
            </div>
          ))}
          {/* Step progress indicator */}
          <div className="hidden lg:flex items-center gap-3 mt-auto pt-6 border-t border-white/10">
            <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full bg-delphi-keppel rounded-full transition-all duration-500" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
            </div>
            <span className="text-[10px] font-black text-slate-500">{step}/{TOTAL_STEPS}</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 p-5 md:p-8 lg:p-12 space-y-6 md:space-y-8">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
        </form>
      </div>
    </div>
  );
};

export default ProjectForm;
