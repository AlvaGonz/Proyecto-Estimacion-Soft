import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { auditService } from './audit.service.js';
import type { CreateUserByAdminDTO, UpdateUserByAdminDTO } from '../types/api.types.js';

const BCRYPT_ROUNDS = 12;

interface ListUsersFilters {
    role?: string;
    isActive?: boolean;
    page: number;
    limit: number;
}

interface ListUsersResult {
    users: object[];
    total: number;
    page: number;
    pages: number;
}

class AdminService {
    async listUsers({ role, isActive, page, limit }: ListUsersFilters): Promise<ListUsersResult> {
        const query: Record<string, unknown> = {};

        if (role) query.role = role;
        if (isActive !== undefined) query.isActive = isActive;

        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            User.find(query)
                .select('-password -refreshToken')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            User.countDocuments(query)
        ]);

        return {
            users,
            total,
            page,
            pages: Math.ceil(total / limit)
        };
    }

    async createUser(data: CreateUserByAdminDTO, adminId: string): Promise<object> {
        const existing = await User.findOne({ email: data.email });
        if (existing) {
            throw ApiError.conflict('Ya existe un usuario con ese email');
        }

        // Create with plain password — User pre-save hook handles hashing
        const user = await User.create({ ...data });

        await auditService.log({
            userId: adminId,
            action: 'ADMIN_CREATE_USER',
            resource: 'User',
            resourceId: String(user._id),
            details: { name: user.name, email: user.email, role: user.role }
        });

        return user.toJSON();
    }

    async updateUser(userId: string, data: UpdateUserByAdminDTO, adminId: string): Promise<object> {
        const user = await User.findById(userId);
        if (!user) {
            throw ApiError.notFound('Usuario no encontrado');
        }

        // Guard: cannot deactivate self
        if (data.isActive === false && userId === adminId) {
            throw ApiError.badRequest('No puedes desactivarte a ti mismo');
        }

        Object.assign(user, data);
        await user.save();

        await auditService.log({
            userId: adminId,
            action: 'ADMIN_UPDATE_USER',
            resource: 'User',
            resourceId: userId,
            details: { updatedFields: Object.keys(data) }
        });

        return user.toJSON();
    }

    async deactivateUser(userId: string, adminId: string): Promise<void> {
        if (userId === adminId) {
            throw ApiError.badRequest('No puedes desactivarte a ti mismo');
        }

        const user = await User.findById(userId);
        if (!user) {
            throw ApiError.notFound('Usuario no encontrado');
        }

        await User.findByIdAndUpdate(userId, { isActive: false, refreshToken: null });

        await auditService.log({
            userId: adminId,
            action: 'ADMIN_DEACTIVATE_USER',
            resource: 'User',
            resourceId: userId,
            details: { email: user.email }
        });
    }
}

export const adminService = new AdminService();
