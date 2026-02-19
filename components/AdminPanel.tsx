
import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Search, 
  MoreVertical, 
  UserCheck, 
  UserX,
  ShieldCheck,
  Zap,
  Lock
} from 'lucide-react';
import { UserRole } from '../types';

const MOCK_USERS = [
  { id: 'u1', name: 'Adrian Alvarez', email: 'aalvarez@uce.edu.do', role: UserRole.FACILITATOR, status: 'Activo' },
  { id: 'u2', name: 'Dr. Roberto Santos', email: 'rsantos@uce.edu.do', role: UserRole.EXPERT, status: 'Activo' },
  { id: 'u3', name: 'Ing. María López', email: 'mlopez@uce.edu.do', role: UserRole.EXPERT, status: 'Inactivo' },
  { id: 'u4', name: 'Admin Central', email: 'admin@uce.edu.do', role: UserRole.ADMIN, status: 'Activo' },
];

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'settings'>('users');

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-8">
           <div className="bg-delphi-giants p-4 rounded-3xl shadow-xl shadow-delphi-giants/20">
              <ShieldCheck className="w-10 h-10 text-white" />
           </div>
           <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Administración</h2>
              <p className="text-slate-400 font-bold mt-2">Control total de usuarios, roles y parámetros del sistema (RF005).</p>
           </div>
        </div>
        <div className="flex bg-slate-100 p-2 rounded-2xl">
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-white text-delphi-giants shadow-sm' : 'text-slate-400'}`}
          >
            Usuarios
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'settings' ? 'bg-white text-delphi-giants shadow-sm' : 'text-slate-400'}`}
          >
            Configuración
          </button>
        </div>
      </header>

      {activeTab === 'users' ? (
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
           <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/30">
              <div className="relative flex-1 max-w-md">
                 <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                 <input 
                    type="text" 
                    placeholder="Buscar usuario por nombre o email..." 
                    className="w-full pl-11 pr-6 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-delphi-giants/30 transition-all outline-none"
                 />
              </div>
              <button className="flex items-center gap-3 px-6 py-3 bg-delphi-giants text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-delphi-giants/20 hover:scale-[1.02] active:scale-95 transition-all">
                <UserPlus className="w-4 h-4" />
                Nuevo Usuario
              </button>
           </div>

           <div className="overflow-x-auto">
              <table className="w-full">
                 <thead>
                    <tr className="bg-slate-50">
                       <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuario</th>
                       <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Rol</th>
                       <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                       <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {MOCK_USERS.map(user => (
                       <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-8 py-6">
                             <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-delphi flex items-center justify-center font-black text-white text-lg shadow-inner">
                                   {user.name.charAt(0)}
                                </div>
                                <div>
                                   <p className="font-black text-slate-900">{user.name}</p>
                                   <p className="text-xs text-slate-400 font-bold">{user.email}</p>
                                </div>
                             </div>
                          </td>
                          <td className="px-8 py-6">
                             <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                user.role === UserRole.ADMIN ? 'bg-delphi-giants/10 text-delphi-giants border-delphi-giants/20' :
                                user.role === UserRole.FACILITATOR ? 'bg-delphi-keppel/10 text-delphi-keppel border-delphi-keppel/20' : 'bg-slate-100 text-slate-500 border-slate-200'
                             }`}>
                                {user.role}
                             </span>
                          </td>
                          <td className="px-8 py-6">
                             <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${user.status === 'Activo' ? 'bg-delphi-keppel animate-pulse' : 'bg-slate-300'}`} />
                                <span className="text-xs font-black text-slate-600">{user.status}</span>
                             </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2.5 rounded-xl bg-slate-100 text-slate-400 hover:text-delphi-keppel transition-all" title="Activar/Desactivar">
                                   <UserCheck className="w-4 h-4" />
                                </button>
                                <button className="p-2.5 rounded-xl bg-slate-100 text-slate-400 hover:text-delphi-giants transition-all" title="Eliminar">
                                   <UserX className="w-4 h-4" />
                                </button>
                                <button className="p-2.5 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-900 transition-all">
                                   <MoreVertical className="w-4 h-4" />
                                </button>
                             </div>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
           <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
              <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
                 <Zap className="w-6 h-6 text-delphi-orange" />
                 Parámetros de Convergencia
              </h3>
              <div className="space-y-6">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">CV Umbral de Consenso (%)</label>
                    <input type="number" defaultValue={20} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-black" />
                    <p className="text-[10px] text-slate-400 italic font-bold">Coeficiente de Variación máximo para considerar convergencia alta.</p>
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Máximo de Rondas Sugeridas</label>
                    <input type="number" defaultValue={4} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-black" />
                 </div>
              </div>
           </div>

           <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-xl space-y-8 relative overflow-hidden">
              <h3 className="text-2xl font-black tracking-tight flex items-center gap-3 relative z-10">
                 <Lock className="w-6 h-6 text-delphi-giants" />
                 Seguridad Institucional
              </h3>
              <div className="space-y-6 relative z-10">
                 <div className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/10 group hover:bg-white/10 transition-all cursor-pointer">
                    <div>
                       <p className="font-black">Doble Factor UCE (2FA)</p>
                       <p className="text-xs text-slate-400 font-bold mt-1">Requerir autenticación adicional para administradores.</p>
                    </div>
                    <div className="w-12 h-6 bg-delphi-keppel rounded-full relative p-1">
                       <div className="w-4 h-4 bg-white rounded-full absolute right-1" />
                    </div>
                 </div>
                 <div className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/10 group hover:bg-white/10 transition-all cursor-pointer">
                    <div>
                       <p className="font-black">Auditoría Extendida</p>
                       <p className="text-xs text-slate-400 font-bold mt-1">Guardar IP y User-Agent en cada estimación (RF029).</p>
                    </div>
                    <div className="w-12 h-6 bg-slate-700 rounded-full relative p-1">
                       <div className="w-4 h-4 bg-white rounded-full absolute left-1" />
                    </div>
                 </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-delphi-giants/10 rounded-bl-[80px] pointer-events-none" />
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
