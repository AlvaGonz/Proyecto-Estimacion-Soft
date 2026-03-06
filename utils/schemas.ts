import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Formato de correo inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Formato de correo inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  role: z.enum(['admin', 'facilitador', 'experto'], {
    message: 'Rol inválido'
  }),
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
