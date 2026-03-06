import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().transform(Number).default('4000'),
    MONGODB_URI: z.string().url(),
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_ACCESS_EXPIRY: z.string().default('15m'),
    JWT_REFRESH_EXPIRY: z.string().default('7d'),
    ALLOWED_ORIGINS: z.string().transform((s) => s.split(',')),
    RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
    RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
});

export type EnvConfig = z.infer<typeof envSchema>;

// TODO: Uncomment when ready to validate against real env vars
// export const env = envSchema.parse(process.env);

// Temporary stub for scaffolding phase
export const env: EnvConfig = {
    NODE_ENV: 'development',
    PORT: 4000,
    MONGODB_URI: 'mongodb://localhost:27017/estimacion-dev',
    JWT_ACCESS_SECRET: 'stub-secret-must-be-at-least-32-chars-long',
    JWT_REFRESH_SECRET: 'stub-refresh-secret-at-least-32-chars',
    JWT_ACCESS_EXPIRY: '15m',
    JWT_REFRESH_EXPIRY: '7d',
    ALLOWED_ORIGINS: ['http://localhost:5173'],
    RATE_LIMIT_WINDOW_MS: 900000,
    RATE_LIMIT_MAX_REQUESTS: 100,
};
