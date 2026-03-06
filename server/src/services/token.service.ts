import { env } from '../config/env.js';

interface TokenPayload {
    id: string;
    email: string;
    role: string;
}

export class TokenService {
    generateAccessToken(payload: TokenPayload): string {
        // TODO: Sign JWT with env.JWT_ACCESS_SECRET and env.JWT_ACCESS_EXPIRY
        // return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRY });
        console.log('[STUB] Generating access token for:', payload.email);
        return 'stub-access-token';
    }

    generateRefreshToken(payload: TokenPayload): string {
        // TODO: Sign JWT with env.JWT_REFRESH_SECRET and env.JWT_REFRESH_EXPIRY
        // return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRY });
        console.log('[STUB] Generating refresh token for:', payload.email);
        return 'stub-refresh-token';
    }

    verifyAccessToken(token: string): TokenPayload {
        // TODO: Verify with env.JWT_ACCESS_SECRET and decode
        // return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
        console.log('[STUB] Verifying access token:', token.substring(0, 10));
        return { id: 'stub-id', email: 'stub@example.com', role: 'facilitador' };
    }

    verifyRefreshToken(token: string): TokenPayload {
        // TODO: Verify with env.JWT_REFRESH_SECRET and decode
        // return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
        console.log('[STUB] Verifying refresh token:', token.substring(0, 10));
        return { id: 'stub-id', email: 'stub@example.com', role: 'facilitador' };
    }
}
