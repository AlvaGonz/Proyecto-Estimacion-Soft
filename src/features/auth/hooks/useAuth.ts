import { useState, useEffect } from 'react';
import { User, UserRole } from '../../../types';
import { authService } from '../services/authService';

export const useAuth = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isInitializing, setIsInitializing] = useState(true);
    const [authView, setAuthView] = useState<'login' | 'register'>('login');

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const authFlag = localStorage.getItem('estimapro_auth');
                if (!authFlag) {
                    await authService.logout().catch(() => {});
                    setCurrentUser(null);
                    return;
                }

                const user = await authService.getMe();
                if (user) {
                    setCurrentUser(user);
                } else {
                    localStorage.removeItem('estimapro_auth');
                    setCurrentUser(null);
                }
            } catch (err) {
                console.error("Auth initialization failed:", err);
                localStorage.removeItem('estimapro_auth');
                setCurrentUser(null);
            } finally {
                setIsInitializing(false);
            }
        };

        checkAuth();

        const handleUnauthorized = async () => {
            await authService.logout().catch(() => {});
            localStorage.removeItem('estimapro_auth');
            setCurrentUser(null);
        };

        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized as EventListener);
    }, []);

    const logout = async () => {
        try {
            await authService.logout();
        } finally {
            localStorage.removeItem('estimapro_auth');
            setCurrentUser(null);
        }
    };

    const login = (user: User) => {
        localStorage.setItem('estimapro_auth', 'true');
        setCurrentUser(user);
    };

    return {
        currentUser,
        isInitializing,
        authView,
        setAuthView,
        login,
        logout
    };
};
