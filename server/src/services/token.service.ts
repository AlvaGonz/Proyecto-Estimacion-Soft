import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

interface AccessTokenPayload {
    id: string;
    email: string;
    role: string;
}

interface RefreshTokenPayload {
    id: string;
}

export class TokenService {
    generateAccessToken(payload: AccessTokenPayload): string {
        return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
            expiresIn: env.JWT_ACCESS_EXPIRY,
        } as jwt.SignOptions);
    }

    generateRefreshToken(payload: RefreshTokenPayload): string {
        // Refresh token carries minimal data (id only) for security
        return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
            expiresIn: env.JWT_REFRESH_EXPIRY,
        } as jwt.SignOptions);
    }

    verifyAccessToken(token: string): AccessTokenPayload {
        try {
            const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
            return { id: decoded.id, email: decoded.email, role: decoded.role };
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw ApiError.unauthorized('Token expirado');
            }
            if (error instanceof jwt.JsonWebTokenError) {
                throw ApiError.unauthorized('Token inválido');
            }
            throw ApiError.unauthorized('Error de autenticación');
        }
    }

    verifyRefreshToken(token: string): RefreshTokenPayload {
        try {
            const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
            return { id: decoded.id };
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw ApiError.unauthorized('Refresh token expirado');
            }
            if (error instanceof jwt.JsonWebTokenError) {
                throw ApiError.unauthorized('Refresh token inválido');
            }
            throw ApiError.unauthorized('Error de autenticación');
        }
    }
}

// Singleton instance
export const tokenService = new TokenService();
