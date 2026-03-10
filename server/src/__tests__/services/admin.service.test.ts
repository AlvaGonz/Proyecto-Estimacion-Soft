import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../../services/admin.service.js';
import { User } from '../../models/index.js';
import { auditService } from '../../services/audit.service.js';

vi.mock('../../models/index.js');
vi.mock('../../services/audit.service.js');

describe('Admin Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('listUsers', () => {
        it('should return paginated users without password or refreshToken', async () => {
            const mockUsers = [{ id: 'u1', name: 'Test', email: 'test@uce.edu.do', role: 'experto' }];
            const mockQuery: any = {
                select: vi.fn().mockReturnThis(),
                sort: vi.fn().mockReturnThis(),
                skip: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue(mockUsers),
            };
            vi.spyOn(User, 'find').mockReturnValue(mockQuery);
            vi.spyOn(User, 'countDocuments').mockResolvedValue(1);

            const result = await adminService.listUsers({ page: 1, limit: 20 });

            expect(User.find).toHaveBeenCalledWith({});
            expect(mockQuery.select).toHaveBeenCalledWith('-password -refreshToken');
            expect(result.total).toBe(1);
            expect(result.pages).toBe(1);
            expect(result.users).toEqual(mockUsers);
        });

        it('should filter by role when provided', async () => {
            const mockQuery: any = {
                select: vi.fn().mockReturnThis(),
                sort: vi.fn().mockReturnThis(),
                skip: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue([]),
            };
            vi.spyOn(User, 'find').mockReturnValue(mockQuery);
            vi.spyOn(User, 'countDocuments').mockResolvedValue(0);

            await adminService.listUsers({ role: 'admin', page: 1, limit: 20 });

            expect(User.find).toHaveBeenCalledWith({ role: 'admin' });
        });
    });

    describe('createUser', () => {
        it('should throw 409 if email already exists', async () => {
            vi.spyOn(User, 'findOne').mockResolvedValue({ id: 'existing' } as any);
            await expect(adminService.createUser({
                name: 'Test', email: 'dup@uce.edu.do', password: 'Passw0rd', role: 'experto'
            }, 'admin1')).rejects.toThrow('Ya existe un usuario con ese email');
        });

        it('should create user and log audit', async () => {
            vi.spyOn(User, 'findOne').mockResolvedValue(null);
            const mockUser = { _id: 'u2', name: 'New', email: 'new@uce.edu.do', role: 'experto', toJSON: vi.fn().mockReturnValue({ id: 'u2' }) };
            vi.spyOn(User, 'create').mockResolvedValue(mockUser as any);

            await adminService.createUser({
                name: 'New', email: 'new@uce.edu.do', password: 'Passw0rd', role: 'experto'
            }, 'admin1');

            expect(User.create).toHaveBeenCalled();
            expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'ADMIN_CREATE_USER' }));
        });
    });

    describe('deactivateUser', () => {
        it('should throw if userId === adminId (self-deactivation guard)', async () => {
            await expect(adminService.deactivateUser('same-id', 'same-id'))
                .rejects.toThrow('No puedes desactivarte a ti mismo');
        });

        it('should throw 404 if user not found', async () => {
            vi.spyOn(User, 'findById').mockResolvedValue(null);
            await expect(adminService.deactivateUser('u1', 'admin1'))
                .rejects.toThrow('Usuario no encontrado');
        });

        it('should deactivate user and log audit', async () => {
            const mockUser = { _id: 'u1', email: 'user@uce.edu.do' };
            vi.spyOn(User, 'findById').mockResolvedValue(mockUser as any);
            vi.spyOn(User, 'findByIdAndUpdate').mockResolvedValue({} as any);

            await adminService.deactivateUser('u1', 'admin1');

            expect(User.findByIdAndUpdate).toHaveBeenCalledWith('u1', { isActive: false, refreshToken: null });
            expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'ADMIN_DEACTIVATE_USER' }));
        });
    });
});
