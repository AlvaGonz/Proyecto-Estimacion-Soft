
import React, { useState } from 'react';
import { BrainCircuit, Shield, Send, Lock, User as UserIcon } from 'lucide-react';
import { User, UserRole } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('aalvarez@uce.edu.do');
  const [role, setRole] = useState<UserRole>(UserRole.FACILITATOR);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({
      id: Math.random().toString(36).substr(2, 9),
      name: email.split('@')[0].toUpperCase(),
      email,
      role
    });
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
            <h1 className="text-4xl font-black text-white tracking-tight leading-none">DelphiPro</h1>
            <p className="text-delphi-celadon font-black text-[10px] uppercase tracking-[0.3em] mt-3">Sistema de Estimación UCE</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Correo Institucional</label>
                <div className="relative group">
                  <UserIcon className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-delphi-keppel transition-colors" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-white font-bold placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-delphi-keppel/30 focus:border-delphi-keppel/30 transition-all"
                    placeholder="usuario@uce.edu.do"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Contraseña</label>
                <div className="relative group">
                  <Lock className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-delphi-keppel transition-colors" />
                  <input 
                    type="password" 
                    defaultValue="********"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-white font-bold placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-delphi-keppel/30 focus:border-delphi-keppel/30 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Rol de Acceso</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button"
                    onClick={() => setRole(UserRole.FACILITATOR)}
                    className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${role === UserRole.FACILITATOR ? 'bg-delphi-keppel text-white border-delphi-keppel' : 'bg-transparent text-slate-400 border-white/10 hover:border-white/30'}`}
                  >
                    Facilitador
                  </button>
                  <button 
                    type="button"
                    onClick={() => setRole(UserRole.EXPERT)}
                    className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${role === UserRole.EXPERT ? 'bg-delphi-keppel text-white border-delphi-keppel' : 'bg-transparent text-slate-400 border-white/10 hover:border-white/30'}`}
                  >
                    Experto
                  </button>
                </div>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-delphi-keppel text-white py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-delphi-keppel/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 group"
            >
              Ingresar al Sistema
              <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
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
        </div>
        
        <p className="text-center mt-10 text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
          Escuela de Ingeniería de Software © 2024
        </p>
      </div>
    </div>
  );
};

export default Login;
