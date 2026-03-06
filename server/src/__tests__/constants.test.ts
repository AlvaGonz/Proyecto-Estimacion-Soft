import { describe, it, expect } from 'vitest';
import { ROLES, PERMISSIONS, ROLE_PERMISSIONS } from '../config/constants.js';

describe('RBAC Constants', () => {
    describe('ROLES', () => {
        it('should define all three roles', () => {
            expect(ROLES.ADMIN).toBe('admin');
            expect(ROLES.FACILITADOR).toBe('facilitador');
            expect(ROLES.EXPERTO).toBe('experto');
        });
    });

    describe('ROLE_PERMISSIONS', () => {
        it('should give admin ALL permissions', () => {
            const allPermissions = Object.values(PERMISSIONS);
            const adminPermissions = ROLE_PERMISSIONS[ROLES.ADMIN];

            allPermissions.forEach((permission) => {
                expect(adminPermissions).toContain(permission);
            });
        });

        it('should give facilitador project and round management permissions', () => {
            const facilitadorPerms = ROLE_PERMISSIONS[ROLES.FACILITADOR];

            expect(facilitadorPerms).toContain(PERMISSIONS.CREATE_PROJECT);
            expect(facilitadorPerms).toContain(PERMISSIONS.EDIT_PROJECT);
            expect(facilitadorPerms).toContain(PERMISSIONS.MANAGE_ROUNDS);
            expect(facilitadorPerms).toContain(PERMISSIONS.GENERATE_REPORT);
            expect(facilitadorPerms).toContain(PERMISSIONS.MODERATE_DISCUSSION);
        });

        it('should NOT give facilitador user management permissions', () => {
            const facilitadorPerms = ROLE_PERMISSIONS[ROLES.FACILITADOR];

            expect(facilitadorPerms).not.toContain(PERMISSIONS.MANAGE_USERS);
        });

        it('should give experto ONLY submit:estimation permission', () => {
            const expertoPerms = ROLE_PERMISSIONS[ROLES.EXPERTO];

            expect(expertoPerms).toHaveLength(1);
            expect(expertoPerms).toContain(PERMISSIONS.SUBMIT_ESTIMATION);
        });

        it('should NOT give experto any admin or facilitador permissions', () => {
            const expertoPerms = ROLE_PERMISSIONS[ROLES.EXPERTO];

            expect(expertoPerms).not.toContain(PERMISSIONS.MANAGE_USERS);
            expect(expertoPerms).not.toContain(PERMISSIONS.CREATE_PROJECT);
            expect(expertoPerms).not.toContain(PERMISSIONS.MANAGE_ROUNDS);
        });
    });
});
