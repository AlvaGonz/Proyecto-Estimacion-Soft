import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';
import { ROLE_PERMISSIONS, Role, Permission } from '../config/constants.js';

export const requireRole = (...allowedRoles: Role[]) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        // TODO: Verify req.user exists (set by authenticate middleware)
        // if (!req.user) {
        //   throw ApiError.unauthorized('Autenticación requerida');
        // }

        // TODO: Check if user.role is in allowedRoles
        // if (!allowedRoles.includes(req.user.role as Role)) {
        //   throw ApiError.forbidden('No tiene permisos para esta acción');
        // }

        // STUB: Always pass for scaffolding
        next();
    };
};

export const requirePermission = (permission: Permission) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        // TODO: Get user role from req.user
        // if (!req.user) throw ApiError.unauthorized();

        // TODO: Check ROLE_PERMISSIONS[role].includes(permission)
        // const userRole = req.user.role as Role;
        // const permissions = ROLE_PERMISSIONS[userRole];
        // if (!permissions.includes(permission)) {
        //   throw ApiError.forbidden('Permiso insuficiente');
        // }

        // STUB: Always pass for scaffolding
        next();
    };
};
