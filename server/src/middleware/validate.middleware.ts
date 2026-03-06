import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validate = (schema: AnyZodObject) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors: Record<string, string[]> = {};
                error.errors.forEach((err) => {
                    const path = err.path.join('.');
                    if (!errors[path]) errors[path] = [];
                    errors[path].push(err.message);
                });

                res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors,
                });
                return;
            }
            next(error);
        }
    };
};
