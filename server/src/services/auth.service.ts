import { RegisterDTO, LoginDTO } from '../types/api.types.js';

interface AuthResult {
    user: { id: string; email: string; name: string; role: string };
    accessToken: string;
    refreshToken: string;
}

interface RefreshResult {
    accessToken: string;
}

interface LogoutResult {
    message: string;
}

export class AuthService {
    async register(data: RegisterDTO): Promise<AuthResult> {
        // TODO: Check if email already exists in database
        // TODO: Hash password with bcrypt (rounds: 12)
        // TODO: Create user in database
        // TODO: Generate access + refresh tokens
        // TODO: Log audit event (action: 'user:register')

        // STUB: Return mock data
        return {
            user: { id: 'stub-id', email: data.email, name: data.name, role: data.role },
            accessToken: 'stub-access-token',
            refreshToken: 'stub-refresh-token',
        };
    }

    async login(data: LoginDTO): Promise<AuthResult> {
        // TODO: Find user by email in database
        // TODO: Compare password with bcrypt
        // TODO: Throw ApiError.unauthorized if credentials invalid
        // TODO: Generate access + refresh tokens
        // TODO: Log audit event (action: 'user:login')

        // STUB: Return mock data
        return {
            user: { id: 'stub-id', email: data.email, name: 'Stub User', role: 'facilitador' },
            accessToken: 'stub-access-token',
            refreshToken: 'stub-refresh-token',
        };
    }

    async refreshToken(token: string): Promise<RefreshResult> {
        // TODO: Verify refresh token with JWT_REFRESH_SECRET
        // TODO: Generate new access token
        // TODO: Optionally rotate refresh token

        // STUB: Return mock data
        console.log('[STUB] Refreshing token:', token.substring(0, 10));
        return { accessToken: 'new-stub-access-token' };
    }

    async logout(userId: string): Promise<LogoutResult> {
        // TODO: Invalidate refresh token (add to blacklist or remove from DB)
        // TODO: Log audit event (action: 'user:logout')

        // STUB: Return mock message
        console.log('[STUB] Logging out user:', userId);
        return { message: 'Sesión cerrada' };
    }
}
