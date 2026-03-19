
import React, { useState } from 'react';
import { BrainCircuit, Shield, Send, Lock, User as UserIcon, Mail } from 'lucide-react';
import { User, UserRole } from '../types';
import { loginSchema } from '../utils/schemas';
import { z } from 'zod';

import { authService } from '../services/authService';

interface LoginProps {
  onLogin: (user: User) => void;
  onGoToRegister?: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onGoToRegister }) => {
  const [email, setEmail] = useState(''); // Clear initial placeholders
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      loginSchema.parse({ email, password });

      const user = await authService.login({ email, password });
      onLogin(user);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((err: any) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      } else {
        setErrors({ email: error.message || 'Credenciales inválidas' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-delphi-keppel/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-delphi-giants/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

      <div className="max-w-md w-full relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="bg-white/5 backdrop-blur-2xl p-10 rounded-[3.5rem] border border-white/10 shadow-2xl space-y-10">
          <div className="text-center">
            <div className="bg-delphi-keppel w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-delphi-keppel/30 rotate-6">
              <BrainCircuit className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight leading-none">EstimaPro</h1>
            <p className="text-delphi-celadon font-black text-[10px] uppercase tracking-[0.3em] mt-3">Sistema de Estimación UCE</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-8">
            <div className={`space-y-4 transition-all duration-300 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="space-y-1.5 group">
                <label 
                  htmlFor="email" 
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1.5 flex items-center gap-2 group-focus-within:text-delphi-keppel transition-colors"
                >
                  <Mail className="w-3 h-3" />
                  Correo Electrónico
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-delphi-keppel/10 focus:border-delphi-keppel transition-all outline-none placeholder:text-slate-300"
                  placeholder="nombre@empresa.com"
                  required
                />
                {errors.email && <p id="email-error" role="alert" className="text-red-400 text-xs mt-1 ml-2">{errors.email}</p>}
              </div>

              <div className="space-y-1.5 group">
                <label 
                  htmlFor="password" 
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1.5 flex items-center gap-2 group-focus-within:text-delphi-keppel transition-colors"
                >
                  <Lock className="w-3 h-3" />
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-delphi-keppel/10 focus:border-delphi-keppel transition-all outline-none placeholder:text-slate-300"
                  placeholder="••••••••"
                  required
                />
                {errors.password && <p id="password-error" role="alert" className="text-red-400 text-xs mt-1 ml-2">{errors.password}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full ${isLoading ? 'bg-slate-700 cursor-not-allowed' : 'bg-delphi-keppel shadow-delphi-keppel/30 hover:scale-[1.02]'} text-white py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 group`}
            >
              {isLoading ? 'Autenticando...' : 'Ingresar al Sistema'}
              {!isLoading && <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
            </button>
          </form>

          <div className="flex items-center justify-center gap-6 pt-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <Shield className="w-3 h-3" />
              Auth UCE
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
            <button className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Olvidé mi clave</button>
          </div>

          {/* Register Link */}
          {onGoToRegister && (
            <div className="text-center pt-2">
              <button 
                onClick={onGoToRegister}
                className="text-[10px] font-black uppercase tracking-widest text-delphi-keppel hover:text-delphi-celadon transition-colors"
              >
                ¿No tienes cuenta? Regístrate
              </button>
            </div>
          )}
        </div>

        <p className="text-center mt-10 text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
          Escuela de Ingeniería de Software © 2026
        </p>
      </div>
    </div>
  );
};

export default Login;
