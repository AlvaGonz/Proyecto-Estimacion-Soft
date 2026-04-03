import React, { useState, useEffect } from 'react';
import { Project, type EstimationMethod, UserRole, User } from '../../../types';
import { projectSchemaV2, wizardStep1Schema, wizardStep2Schema, wizardTaskSchema } from '../../../shared/utils/schemas';
import { userService } from '../../../features/users/services/userService';
import { z } from 'zod';
import { useModal } from '../../../shared/components/ModalProvider';

export interface WizardTask {
  id: string;
  title: string;
  description: string;
  touched: boolean;
}

export type TimeLimitOption = 'none' | '24h' | '48h' | '72h' | '1w';

export const TOTAL_STEPS = 5;

export const useProjectForm = (
  onSubmit: (project: Project, tasks: WizardTask[]) => void,
  currentUser: User,
  editingProject?: Project
) => {
  const { confirm } = useModal();
  
  // Step 1 state
  const [name, setName] = useState(editingProject?.name ?? '');
  const [description, setDescription] = useState(editingProject?.description ?? '');
  const [unit, setUnit] = useState<'hours' | 'storyPoints' | 'personDays'>(editingProject?.unit ?? 'hours');

  // Step 2 state
  const [estimationMethod, setEstimationMethod] = useState<EstimationMethod>(editingProject?.estimationMethod ?? 'wideband-delphi');
  const [hasStartedRounds] = useState(editingProject?.hasStartedRounds ?? false);

  // Step 3 state
  const [maxRounds, setMaxRounds] = useState(editingProject?.maxRounds ?? 3);
  const [cvThreshold, setCvThreshold] = useState((editingProject?.convergenceConfig?.cvThreshold ?? 0.25) * 100);
  const [timeLimit, setTimeLimit] = useState<TimeLimitOption>('none');
  const [useFibonacci, setUseFibonacci] = useState(true);
  const [customCards, setCustomCards] = useState('');
  const [showFormula, setShowFormula] = useState(true);
  const [sprints, setSprints] = useState(editingProject?.sprints ?? 1);

  // Step 4 state
  const [wizardTasks, setWizardTasks] = useState<WizardTask[]>(
    editingProject ? [] : [{ id: crypto.randomUUID(), title: '', description: '', touched: false }]
  );

  // Step 5 / Expert assignment state
  const [facilitatorId, setFacilitatorId] = useState(
    editingProject?.facilitatorId ?? (currentUser.role === UserRole.FACILITATOR ? currentUser.id : '')
  );
  const [expertIds, setExpertIds] = useState<string[]>(editingProject?.expertIds ?? []);
  const [allExperts, setAllExperts] = useState<User[]>([]);
  const [allFacilitators, setAllFacilitators] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Wizard state
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const users = await userService.getAllUsers();
        setAllExperts(users.filter(u => u.role === UserRole.EXPERT));
        setAllFacilitators(users.filter(u => u.role === UserRole.FACILITATOR || u.role === UserRole.ADMIN));
      } catch (err) {
        console.error('Error fetching users', err);
      } finally {
        setIsLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  const validateStep = (targetStep: number): boolean => {
    setErrors({});
    try {
      switch (targetStep) {
        case 1:
          wizardStep1Schema.parse({ name, description, unit });
          if (currentUser.role === UserRole.ADMIN && !facilitatorId) {
            setErrors(prev => ({ ...prev, facilitatorId: 'Debes asignar un facilitador' }));
            return false;
          }
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
          if (validTasks.length === 0 && !editingProject) {
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

  const addTask = () => {
    setWizardTasks(prev => [...prev, { id: crypto.randomUUID(), title: '', description: '', touched: false }]);
  };

  const removeTask = async (id: string) => {
    const task = wizardTasks.find(t => t.id === id);
    if (task?.touched) {
      const isConfirmed = await confirm(
        '¿Eliminar tarea?',
        '¿Estás seguro de que deseas eliminar esta tarea? Todos los datos ingresados para este elemento se perderán permanentemente.',
        { type: 'danger', confirmText: 'Eliminar' }
      );
      if (!isConfirmed) return;
    }
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

  const handleFormSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
        facilitatorId,
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

  return {
    state: {
      name, description, unit, estimationMethod, maxRounds, cvThreshold,
      timeLimit, useFibonacci, customCards, showFormula, sprints,
      wizardTasks, facilitatorId, expertIds, allExperts, allFacilitators,
      isLoadingUsers, step, errors, isSubmitting
    },
    actions: {
      setName, setDescription, setUnit, setEstimationMethod, setMaxRounds,
      setCvThreshold, setTimeLimit, setUseFibonacci, setCustomCards,
      setShowFormula, setSprints, setWizardTasks, setFacilitatorId,
      setExpertIds, handleNext, handlePrev, addTask, removeTask,
      updateTask, moveTask, handleFormSubmit, setStep
    }
  };
};
