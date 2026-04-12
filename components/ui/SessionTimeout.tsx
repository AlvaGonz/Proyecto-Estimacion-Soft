import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { authService } from '../../services/authService';

export const SessionTimeout: React.FC = () => {
    const [isIdle, setIsIdle] = useState(false);
    const [countdown, setCountdown] = useState(15);
    const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const INACTIVITY_LIMIT = 60 * 1000; // 60 seconds
    const COUNTDOWN_LIMIT = 15; // 15 seconds

    const handleActivity = () => {
        if (isIdle) {
            // If already idle, don't reset just by moving mouse. The user must click "Continue"
            return;
        }

        if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);

        activityTimeoutRef.current = setTimeout(() => {
            setIsIdle(true);
            setCountdown(COUNTDOWN_LIMIT);
        }, INACTIVITY_LIMIT);
    };

    const handleContinue = () => {
        setIsIdle(false);
        setCountdown(COUNTDOWN_LIMIT);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        handleActivity(); // Restart activity timer
    };

    const handleLogout = async () => {
        setIsIdle(false);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
        
        try {
            await authService.logout();
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            localStorage.removeItem('estimapro_auth');
            window.dispatchEvent(new Event('auth:unauthorized'));
        }
    };

    useEffect(() => {
        const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
        
        const attachListeners = () => {
            events.forEach((event) => window.addEventListener(event, handleActivity));
        };
        const detachListeners = () => {
            events.forEach((event) => window.removeEventListener(event, handleActivity));
        };

        attachListeners();
        handleActivity(); // Initial start

        return () => {
            detachListeners();
            if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        };
    }, [isIdle]);

    useEffect(() => {
        if (isIdle) {
            countdownIntervalRef.current = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(countdownIntervalRef.current!);
                        handleLogout();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        };
    }, [isIdle]);

    if (!isIdle) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
                <div className="flex flex-col items-center text-center">
                    <div className="bg-delphi-orange/10 p-4 rounded-full mb-6">
                        <AlertCircle className="w-12 h-12 text-delphi-orange" />
                    </div>
                    
                    <h2 className="text-2xl font-black text-slate-900 mb-2">
                        ¿Sigues ahí?
                    </h2>
                    
                    <p className="text-slate-500 mb-8 font-medium">
                        Tu sesión se cerrará por inactividad en{' '}
                        <span className="text-delphi-orange font-black text-xl">{countdown}</span> segundos.
                    </p>

                    <div className="flex gap-4 w-full">
                        <button
                            onClick={handleLogout}
                            className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                        >
                            Cerrar sesión
                        </button>
                        <button
                            onClick={handleContinue}
                            className="flex-1 py-3 px-4 rounded-2xl bg-delphi-keppel text-white font-bold hover:bg-delphi-keppel/90 shadow-lg shadow-delphi-keppel/20 transition-all"
                        >
                            Continuar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
