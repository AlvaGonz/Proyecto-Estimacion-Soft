import { z } from 'zod';

// Auth DTOs — Zod v3 schemas
export const registerSchema = z.object({
    body: z.object({
        name: z.string().min(2).max(100),
        email: z.string().email(),
        password: z.string().min(8).max(100),
        role: z.enum(['admin', 'facilitador', 'experto']),
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(1),
    }),
});

export type RegisterDTO = z.infer<typeof registerSchema>['body'];
export type LoginDTO = z.infer<typeof loginSchema>['body'];

// API Response wrapper
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: Record<string, string[]>;
}
