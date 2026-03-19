import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Formato de correo inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Formato de correo inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string().min(8, 'Confirma tu contraseña'),
  role: z.enum(['admin', 'facilitador', 'experto'], {
    message: 'Rol inválido'
  }).optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export const projectSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(100, 'El nombre no puede exceder 100 caracteres'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  unit: z.string().min(1, 'La unidad es requerida'),
  convergenceThreshold: z.number().min(0.01, 'El valor mínimo es 0.01').max(1.0, 'El valor máximo es 1.0'),
  maxOutlierPercent: z.number().min(0, 'El valor mínimo es 0').max(100, 'El valor máximo es 100'),
});

export const taskSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres').max(200, 'El título no puede exceder 200 caracteres'),
  description: z.string().optional(),
});

export const estimationSchema = z.object({
  value: z.number().positive('El valor debe ser positivo'),
  justification: z.string().min(10, 'La justificación debe tener al menos 10 caracteres'),
});

export const discussionCommentSchema = z.object({
  content: z.string().min(5, 'El comentario debe tener al menos 5 caracteres').max(1000, 'El comentario no puede exceder 1000 caracteres'),
});

// RF031/032/034 — Estimation methods
export const estimationMethodSchema = z.enum(
  ['wideband-delphi', 'planning-poker', 'three-point'],
  { message: 'Selecciona un método de estimación válido' }
);

export const projectSchemaV2 = z.object({
  name: z.string().min(3, 'Mínimo 3 caracteres').max(100),
  description: z.string().min(10, 'Mínimo 10 caracteres').max(1000),
  unit: z.enum(['hours', 'storyPoints', 'personDays']),
  estimationMethod: estimationMethodSchema,
  convergenceConfig: z.object({
    cvThreshold: z.number().min(0.01).max(1).default(0.25),
    maxOutlierPercent: z.number().min(0.01).max(1).default(0.30),
  }).optional(),
});

export type ProjectFormDataV2 = z.infer<typeof projectSchemaV2>;

export const threePointSchema = z.object({
  optimistic: z.number().min(0, 'O debe ser >= 0'),
  mostLikely: z.number().min(0, 'M debe ser >= 0'),
  pessimistic: z.number().min(0, 'P debe ser >= 0'),
}).refine(d => d.optimistic <= d.mostLikely, {
  message: 'O debe ser ≤ M',
  path: ['optimistic'],
}).refine(d => d.mostLikely <= d.pessimistic, {
  message: 'M debe ser ≤ P',
  path: ['mostLikely'],
});
