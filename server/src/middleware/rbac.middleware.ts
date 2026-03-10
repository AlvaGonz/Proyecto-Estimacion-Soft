import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';
import { ROLE_PERMISSIONS, Role, Permission } from '../config/constants.js';

export const requireRole = (...allowedRoles: Role[]) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        if (!req.user) {
            throw ApiError.unauthorized('Autenticación requerida');
        }

        if (!allowedRoles.includes(req.user.role as Role)) {
            throw ApiError.forbidden('No tiene permisos para esta acción');
        }

        next();
    };
};

export const requirePermission = (permission: Permission) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        if (!req.user) {
            throw ApiError.unauthorized('Autenticación requerida');
        }

        const userRole = req.user.role as Role;
        const permissions = ROLE_PERMISSIONS[userRole] as readonly string[];

        if (!permissions.includes(permission)) {
            throw ApiError.forbidden('Permiso insuficiente para esta operación');
        }

        next();
    };
};
