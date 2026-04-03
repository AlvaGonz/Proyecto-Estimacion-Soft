import { RegisterDTO, LoginDTO } from '../../types/api.types.js';
import { User } from '../users/user.model.js';
import { tokenService } from './token.service.js';
import { auditService } from '../audit-log/audit.service.js';
import { ApiError } from '../../utils/ApiError.js';
import { IUser } from '../../types/models.types.js';

interface AuthResult {
    user: Record<string, unknown>;
    accessToken: string;
    refreshToken: string;
}

interface RefreshResult {
    accessToken: string;
}

export class AuthService {
    async register(data: RegisterDTO): Promise<AuthResult> {
        // Guard: check if email is already taken
        const existingUser = await User.findOne({ email: data.email });
        if (existingUser) {
            throw ApiError.conflict('El correo electrónico ya está registrado');
        }

        // Create user — password gets auto-hashed by pre-save hook
        const user = await User.create({
            name: data.name,
            email: data.email,
            password: data.password,
            role: data.role,
        });

        // Generate tokens
        const accessToken = tokenService.generateAccessToken({
            id: user.id as string,
            email: user.email,
            role: user.role,
        });
        const refreshToken = tokenService.generateRefreshToken({
            id: user.id as string,
        });

        // Store refresh token in DB for invalidation support
        user.refreshToken = refreshToken;
        await user.save();

        // Audit: fire-and-forget
        auditService.log({
            userId: user.id as string,
            action: 'USER_REGISTER',
            resource: 'user',
            resourceId: user.id as string,
        });

        return {
            user: user.toJSON(),
            accessToken,
            refreshToken,
        };
    }

    async login(data: LoginDTO): Promise<AuthResult> {
        // Find user with password field included (select: false by default)
        const user = await User.findOne({ email: data.email }).select('+password');

        // Same error message for both "not found" and "wrong password" — prevents email enumeration
        if (!user) {
            throw ApiError.unauthorized('Credenciales inválidas');
        }

        const isPasswordValid = await user.comparePassword(data.password);
        if (!isPasswordValid) {
            throw ApiError.unauthorized('Credenciales inválidas');
        }

        // Guard: check if account is active
        if (!user.isActive) {
            throw ApiError.forbidden('Cuenta desactivada. Contacte al administrador.');
        }

        // Generate tokens
        const accessToken = tokenService.generateAccessToken({
            id: user.id as string,
            email: user.email,
            role: user.role,
        });
        const refreshToken = tokenService.generateRefreshToken({
            id: user.id as string,
        });

        // Update user: store refresh token + last login
        user.refreshToken = refreshToken;
        user.lastLogin = new Date();
        await user.save();

        // Audit: fire-and-forget
        auditService.log({
            userId: user.id as string,
            action: 'USER_LOGIN',
            resource: 'user',
            resourceId: user.id as string,
        });

        return {
            user: user.toJSON(),
            accessToken,
            refreshToken,
        };
    }

    async refreshToken(token: string): Promise<RefreshResult> {
        // Verify the refresh token signature
        const payload = tokenService.verifyRefreshToken(token);

        // Find user and verify the stored refresh token matches
        const user = await User.findById(payload.id).select('+refreshToken');
        if (!user || user.refreshToken !== token) {
            throw ApiError.unauthorized('Sesión inválida — inicie sesión nuevamente');
        }

        if (!user.isActive) {
            throw ApiError.forbidden('Cuenta desactivada');
        }

        // Generate new access token only (refresh token stays the same)
        const accessToken = tokenService.generateAccessToken({
            id: user.id as string,
            email: user.email,
            role: user.role,
        });

        return { accessToken };
    }

    async logout(userId: string): Promise<void> {
        // Nullify refresh token — prevents reuse
        await User.findByIdAndUpdate(userId, { refreshToken: null });

        // Audit: fire-and-forget
        auditService.log({
            userId,
            action: 'USER_LOGOUT',
            resource: 'user',
            resourceId: userId,
        });
    }
}

export const authService = new AuthService();
