import { z } from 'zod';

// ─── Auth Schemas ──────────────────────────────────────────────────
export const registerSchema = z.object({
    body: z.object({
        name: z.string().min(2, 'Name must be at least 2 characters').max(50),
        email: z.string().email('Invalid email format'),
        password: z.string().min(8, 'Password must be at least 8 characters')
            .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
        role: z.enum(['admin', 'facilitador', 'experto']).optional().default('experto'),
    })
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email format'),
        password: z.string().min(1, 'Password is required'),
    })
});

export type RegisterDTO = z.infer<typeof registerSchema>['body'];
export type LoginDTO = z.infer<typeof loginSchema>['body'];

// ─── Project Schemas ───────────────────────────────────────────────
export const createProjectSchema = z.object({
    body: z.object({
        name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(100),
        description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres').max(1000),
        unit: z.enum(['hours', 'storyPoints', 'personDays'], {
            errorMap: () => ({ message: 'Unidad debe ser hours, storyPoints o personDays' }),
        }),
        estimationMethod: z.enum(['wideband-delphi', 'planning-poker', 'three-point']).optional().default('wideband-delphi'),
        expertIds: z.array(z.string()).optional().default([]),
        convergenceConfig: z.object({
            cvThreshold: z.number().min(0.01).max(1).optional().default(0.25),
            maxOutlierPercent: z.number().min(0.01).max(1).optional().default(0.30),
        }).optional(),
    }),
});

export const updateProjectSchema = z.object({
    body: z.object({
        name: z.string().min(3).max(100).optional(),
        description: z.string().min(10).max(1000).optional(),
        unit: z.enum(['hours', 'storyPoints', 'personDays']).optional(),
        status: z.enum(['active', 'finished', 'archived']).optional(),
        convergenceConfig: z.object({
            cvThreshold: z.number().min(0.01).max(1).optional(),
            maxOutlierPercent: z.number().min(0.01).max(1).optional(),
        }).optional(),
    }),
    params: z.object({
        id: z.string().min(1),
    }),
});

export const manageExpertsSchema = z.object({
    body: z.object({
        action: z.enum(['add', 'remove']),
        expertIds: z.array(z.string()).min(1, 'Debe incluir al menos un experto'),
    }),
    params: z.object({
        id: z.string().min(1),
    }),
});

// ─── Task Schemas ──────────────────────────────────────────────────
export const createTaskSchema = z.object({
    body: z.object({
        title: z.string().min(3, 'El título debe tener al menos 3 caracteres').max(200),
        description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres').max(2000),
    }),
    params: z.object({
        id: z.string().min(1), // projectId
    }),
});

export const updateTaskSchema = z.object({
    body: z.object({
        title: z.string().min(3).max(200).optional(),
        description: z.string().min(10).max(2000).optional(),
    }),
    params: z.object({
        id: z.string().min(1),  // projectId
        tid: z.string().min(1), // taskId
    }),
});

// ─── Round Schemas ─────────────────────────────────────────────────
export const openRoundSchema = z.object({
    body: z.object({
        taskId: z.string().min(1, 'taskId es requerido'),
    }),
    params: z.object({
        pid: z.string().min(1), // projectId — for authorization checks
    }),
});

// ─── Estimation Schemas ────────────────────────────────────────────
export const createEstimationSchema = z.object({
    body: z.object({
        value: z.number().min(0, 'El valor debe ser mayor o igual a 0'),
        justification: z.string().min(5, 'La justificación debe tener al menos 5 caracteres').max(2000),
        metodoData: z.record(z.any()).optional(),
    }),
    params: z.object({
        id: z.string().min(1), // roundId
    }),
});

export const updateEstimationSchema = z.object({
    body: z.object({
        value: z.number().min(0).optional(),
        justification: z.string().min(5).max(2000).optional(),
    }),
    params: z.object({
        id: z.string().min(1), // estimationId
    }),
});

// ─── Comment Schemas ───────────────────────────────────────────────
export const createCommentSchema = z.object({
    body: z.object({
        content: z.string().min(1, 'El comentario no puede estar vacío').max(2000),
        isAnonymous: z.boolean().optional().default(true),
    }),
    params: z.object({
        id: z.string().min(1), // roundId
    }),
});

// u2500u2500u2500 Admin Schemas u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500
const _adminSchemasSentinel = true; // placeholder - replaced by schema definitions

// --- Admin Schemas ---
export const updateUserByAdminSchema = z.object({
    body: z.object({
        name: z.string().min(2).max(50).optional(),
        role: z.enum(['admin', 'facilitador', 'experto']).optional(),
        isActive: z.boolean().optional(),
    }),
    params: z.object({
        id: z.string().min(1),
    }),
});

export const createUserByAdminSchema = z.object({
    body: z.object({
        name: z.string().min(2, 'Name must be at least 2 characters').max(50),
        email: z.string().email('Invalid email format'),
        password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password requires upper, lower, and digit'),
        role: z.enum(['admin', 'facilitador', 'experto']),
    }),
});

export type UpdateUserByAdminDTO = z.infer<typeof updateUserByAdminSchema>['body'];
export type CreateUserByAdminDTO = z.infer<typeof createUserByAdminSchema>['body'];
