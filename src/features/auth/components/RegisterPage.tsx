// components/RegisterPage.tsx
// RF001: Registro de nuevos usuarios
// RS1: Validar nombre, correo, contraseña
// RS2: Verificar unicidad de correo (backend)
// RS3: Contraseña segura (mínimo 8 caracteres)

import React, { useState } from 'react';
import { BrainCircuit, Shield, Send, Lock, User as UserIcon, Mail, ArrowLeft } from 'lucide-react';
import { User, UserRole } from '../../../types';
import { registerSchema } from '../../../shared/utils/schemas';
import { z } from 'zod';
import { authService } from '../services/authService';

interface RegisterPageProps {
  onRegister: (user: User) => void;
  onGoToLogin: () => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onRegister, onGoToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => { const newErrors = { ...prev }; delete newErrors[name]; return newErrors; });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      // Validación con Zod
      // Validar con Zod
      registerSchema.parse({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });

      // Llamada al servicio de registro
      const user = await authService.register({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });

      setSuccessMessage('¡Registro exitoso! Redirigiendo...');
      
      // Set auth flag in localStorage for client-side session validation
      localStorage.setItem('estimapro_auth', 'true');
      
      // Pequeña demora para mostrar el mensaje de éxito
      setTimeout(() => {
        onRegister(user);
      }, 1500);

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
        setErrors({ email: error.message || 'Error al registrar usuario. El correo puede estar en uso.' });
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
        <div className="bg-white/5 backdrop-blur-2xl p-10 rounded-[3.5rem] border border-white/10 shadow-2xl space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="bg-delphi-keppel w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-delphi-keppel/30 rotate-6">
              <UserIcon className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight leading-none">Crear Cuenta</h1>
            <p className="text-delphi-celadon font-black text-[10px] uppercase tracking-[0.3em] mt-3">Únete a EstimaPro UCE</p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-2xl p-4 text-center">
              <p className="text-emerald-400 text-sm font-bold">{successMessage}</p>
            </div>
          )}

          {/* Register Form */}
          <form onSubmit={handleRegister} className="space-y-6" noValidate>
            <div className="space-y-5">
              {/* Name Field */}
              <div className="space-y-2">
                <label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Nombre Completo</label>
                <div className="relative group">
                  <UserIcon className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-delphi-keppel transition-colors" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    aria-describedby="name-error"
                    className={`w-full bg-white/5 border ${errors.name ? 'border-red-500' : 'border-white/10'} rounded-2xl pl-14 pr-6 py-4 text-white font-bold placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-delphi-keppel/30 focus:border-delphi-keppel/30 transition-all`}
                    placeholder="Juan Pérez"
                  />
                </div>
                {errors.name && <p id="name-error" role="alert" className="text-red-400 text-xs mt-1 ml-2">{errors.name || 'El nombre es requerido'}</p>}
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Correo Institucional</label>
                <div className="relative group">
                  <Mail className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-delphi-keppel transition-colors" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    aria-describedby="email-error"
                    className={`w-full bg-white/5 border ${errors.email ? 'border-red-500' : 'border-white/10'} rounded-2xl pl-14 pr-6 py-4 text-white font-bold placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-delphi-keppel/30 focus:border-delphi-keppel/30 transition-all`}
                    placeholder="usuario@uce.edu.do"
                  />
                </div>
                {errors.email && <p id="email-error" role="alert" className="text-red-400 text-xs mt-1 ml-2">{errors.email}</p>}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Contraseña</label>
                <div className="relative group">
                  <Lock className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-delphi-keppel transition-colors" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    aria-describedby="password-error"
                    className={`w-full bg-white/5 border ${errors.password ? 'border-red-500' : 'border-white/10'} rounded-2xl pl-14 pr-6 py-4 text-white font-bold placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-delphi-keppel/30 focus:border-delphi-keppel/30 transition-all`}
                    placeholder="Mínimo 8 caracteres"
                  />
                </div>
                {errors.password && <p id="password-error" role="alert" className="text-red-400 text-xs mt-1 ml-2">{errors.password}</p>}
                <p className="text-slate-500 text-[10px] ml-2">Debe tener al menos 8 caracteres</p>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Confirmar Contraseña</label>
                <div className="relative group">
                  <Shield className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-delphi-keppel transition-colors" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    aria-describedby="confirmPassword-error"
                    className={`w-full bg-white/5 border ${errors.confirmPassword ? 'border-red-500' : 'border-white/10'} rounded-2xl pl-14 pr-6 py-4 text-white font-bold placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-delphi-keppel/30 focus:border-delphi-keppel/30 transition-all`}
                    placeholder="Repite tu contraseña"
                  />
                </div>
                {errors.confirmPassword && <p id="confirmPassword-error" role="alert" className="text-red-400 text-xs mt-1 ml-2">{errors.confirmPassword}</p>}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full ${isLoading ? 'bg-slate-700 cursor-not-allowed' : 'bg-delphi-keppel shadow-delphi-keppel/30 hover:scale-[1.02]'} text-white rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all gap-4 group btn-base`}
            >
              {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
              {!isLoading && <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-700" />
            <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">o</span>
            <div className="flex-1 h-px bg-slate-700" />
          </div>

          {/* Login Link */}
          <button 
            onClick={onGoToLogin}
            className="w-full gap-3 text-slate-400 hover:text-white transition-colors group btn-base"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">¿Ya tienes cuenta? Inicia sesión</span>
          </button>
        </div>

        <p className="text-center mt-10 text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
          Escuela de Ingeniería de Software © 2026
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
