
import React, { useState, useEffect, useCallback } from 'react';
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
   Lock,
   X,
   AlertCircle
} from 'lucide-react';
import { UserRole, User as AppUser } from '../types';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { adminService, AdminUser } from '../services/adminService';

// Role badge colors matching existing design tokens
const roleBadgeClass = (role: string) => {
   if (role === 'admin') return 'bg-delphi-giants/10 text-delphi-giants border-delphi-giants/20';
   if (role === 'facilitador') return 'bg-delphi-keppel/10 text-delphi-keppel border-delphi-keppel/20';
   return 'bg-slate-100 text-slate-500 border-slate-200';
};

// --- Create/Edit User Modal ---
interface UserModalProps {
   onClose: () => void;
   onSave: (data: { name: string; email: string; password: string; role: string }) => Promise<void>;
   isLoading: boolean;
   error: string | null;
}
const CreateUserModal: React.FC<UserModalProps> = ({ onClose, onSave, isLoading, error }) => {
   const [form, setForm] = useState({ name: '', email: '', password: '', role: 'experto' });

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      await onSave(form);
   };

   return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Crear nuevo usuario">
         <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8 space-y-6">
            <div className="flex items-center justify-between">
               <h3 className="text-2xl font-black text-slate-900">Nuevo Usuario</h3>
               <button onClick={onClose} aria-label="Cerrar modal" className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
               </button>
            </div>

            {error && (
               <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-bold">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
               </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
               <div className="space-y-2">
                  <label htmlFor="user-name" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre</label>
                  <input id="user-name" type="text" required minLength={2} value={form.name}
                     onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                     className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-sm focus:ring-2 focus:ring-delphi-keppel/30 outline-none transition-all" />
               </div>
               <div className="space-y-2">
                  <label htmlFor="user-email" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email</label>
                  <input id="user-email" type="email" required value={form.email}
                     onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                     className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-sm focus:ring-2 focus:ring-delphi-keppel/30 outline-none transition-all" />
               </div>
               <div className="space-y-2">
                  <label htmlFor="user-password" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contraseña</label>
                  <input id="user-password" type="password" required minLength={8} value={form.password}
                     onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                     placeholder="Min 8 chars, mayúscula, número"
                     className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-sm focus:ring-2 focus:ring-delphi-keppel/30 outline-none transition-all" />
               </div>
               <div className="space-y-2">
                  <label htmlFor="user-role" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rol</label>
                  <select id="user-role" value={form.role}
                     onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                     className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-sm focus:ring-2 focus:ring-delphi-keppel/30 outline-none transition-all">
                     <option value="experto">Experto</option>
                     <option value="facilitador">Facilitador</option>
                     <option value="admin">Admin</option>
                  </select>
               </div>

               <div className="flex gap-3 pt-2">
                  <button type="button" onClick={onClose}
                     className="flex-1 py-3 rounded-2xl border border-slate-200 text-sm font-black text-slate-500 hover:bg-slate-50 transition-all">
                     Cancelar
                  </button>
                  <button type="submit" disabled={isLoading}
                     className="flex-1 py-3 rounded-2xl bg-delphi-giants text-white text-sm font-black shadow-lg shadow-delphi-giants/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                     {isLoading ? 'Creando...' : 'Crear Usuario'}
                  </button>
               </div>
            </form>
         </div>
      </div>
   );
};

// --- Main Component ---
interface AdminPanelProps {
   currentUser?: AppUser | null;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser }) => {
   const [activeTab, setActiveTab] = useState<'users' | 'settings'>('users');
   const [isLoading, setIsLoading] = useState(true);
   const [users, setUsers] = useState<AdminUser[]>([]);
   const [error, setError] = useState<string | null>(null);
   const [roleFilter, setRoleFilter] = useState<string>('');
   const [showInactive, setShowInactive] = useState(false);
   const [showCreateModal, setShowCreateModal] = useState(false);
   const [modalLoading, setModalLoading] = useState(false);
   const [modalError, setModalError] = useState<string | null>(null);

   const loadUsers = useCallback(async () => {
      if (activeTab !== 'users') { setIsLoading(false); return; }
      try {
         setIsLoading(true);
         setError(null);
         const filters: { role?: string; isActive?: boolean } = {};
         if (roleFilter) filters.role = roleFilter;
         if (!showInactive) filters.isActive = true;
         const result = await adminService.listUsers(filters);
         setUsers(result.users);
      } catch (err: any) {
         setError(err.message || 'Error al cargar usuarios');
      } finally {
         setIsLoading(false);
      }
   }, [activeTab, roleFilter, showInactive]);

   useEffect(() => { loadUsers(); }, [loadUsers]);

   const handleCreateUser = async (data: { name: string; email: string; password: string; role: string }) => {
      setModalLoading(true);
      setModalError(null);
      try {
         await adminService.createUser(data);
         setShowCreateModal(false);
         await loadUsers();
      } catch (err: any) {
         setModalError(err.message || 'Error al crear usuario');
      } finally {
         setModalLoading(false);
      }
   };

   const handleDeactivate = async (user: AdminUser) => {
      if (!window.confirm(`¿Desactivar a ${user.name}?`)) return;
      try {
         await adminService.deactivateUser(user.id || user._id || '');
         await loadUsers();
      } catch (err: any) {
         setError(err.message || 'Error al desactivar usuario');
      }
   };

   return (
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
         {showCreateModal && (
            <CreateUserModal
               onClose={() => { setShowCreateModal(false); setModalError(null); }}
               onSave={handleCreateUser}
               isLoading={modalLoading}
               error={modalError}
            />
         )}

         <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-8">
               <div className="bg-delphi-giants p-4 rounded-3xl shadow-xl shadow-delphi-giants/20">
                  <ShieldCheck className="w-10 h-10 text-white" />
               </div>
               <div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Administración</h2>
                  <p className="text-slate-400 font-bold mt-2">Control total de usuarios, roles y parámetros del sistema.</p>
               </div>
            </div>
            <div className="flex bg-slate-100 p-2 rounded-2xl" role="tablist" aria-label="Pestañas de administración">
               <button role="tab" aria-selected={activeTab === 'users'} onClick={() => setActiveTab('users')}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-white text-delphi-giants shadow-sm' : 'text-slate-400'}`}>
                  Usuarios
               </button>
               <button role="tab" aria-selected={activeTab === 'settings'} onClick={() => setActiveTab('settings')}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'settings' ? 'bg-white text-delphi-giants shadow-sm' : 'text-slate-400'}`}>
                  Configuración
               </button>
            </div>
         </header>

         {activeTab === 'users' ? (
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
               <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/30">
                  <div className="flex items-center gap-4 flex-1">
                     {/* Role filter */}
                     <select aria-label="Filtrar por rol"
                        value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                        className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-delphi-giants/30 outline-none transition-all">
                        <option value="">Todos los roles</option>
                        <option value="admin">Admin</option>
                        <option value="facilitador">Facilitador</option>
                        <option value="experto">Experto</option>
                     </select>
                     {/* Show inactive toggle */}
                     <label className="flex items-center gap-2 cursor-pointer select-none">
                        <div onClick={() => setShowInactive(v => !v)}
                           className={`w-10 h-5 rounded-full relative p-0.5 transition-colors ${showInactive ? 'bg-delphi-keppel' : 'bg-slate-300'}`}
                           role="switch" aria-checked={showInactive} aria-label="Mostrar inactivos" tabIndex={0}
                           onKeyDown={e => e.key === 'Enter' && setShowInactive(v => !v)}>
                           <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${showInactive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </div>
                        <span className="text-xs font-bold text-slate-500">Mostrar inactivos</span>
                     </label>
                  </div>
                  <button id="btn-nuevo-usuario" onClick={() => setShowCreateModal(true)}
                     className="flex items-center gap-3 px-6 py-3 bg-delphi-giants text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-delphi-giants/20 hover:scale-[1.02] active:scale-95 transition-all">
                     <UserPlus className="w-4 h-4" />
                     Nuevo Usuario
                  </button>
               </div>

               {error && (
                  <div className="mx-8 mt-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-bold">
                     <AlertCircle className="w-4 h-4 flex-shrink-0" />
                     {error}
                  </div>
               )}

               <div className="overflow-x-auto min-h-[300px]">
                  {isLoading ? (
                     <div className="flex items-center justify-center h-full py-20">
                        <LoadingSpinner size="lg" label="Cargando usuarios..." />
                     </div>
                  ) : users.length === 0 ? (
                     <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-4">
                        <Users className="w-12 h-12 opacity-30" />
                        <p className="font-black">No hay usuarios registrados</p>
                     </div>
                  ) : (
                     <table className="w-full min-w-[800px]">
                        <thead>
                           <tr className="bg-slate-50">
                              <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuario</th>
                              <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Rol</th>
                              <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                              <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {users.map(user => {
                              const isSelf = currentUser?.id === (user.id || user._id);
                              return (
                                 <tr key={user.id || user._id} className="hover:bg-slate-50 transition-colors group">
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
                                       <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${roleBadgeClass(user.role)}`}>
                                          {user.role}
                                       </span>
                                    </td>
                                    <td className="px-8 py-6">
                                       <div className="flex items-center gap-2">
                                          <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-delphi-keppel animate-pulse' : 'bg-slate-300'}`} />
                                          <span className="text-xs font-black text-slate-600">{user.isActive ? 'Activo' : 'Inactivo'}</span>
                                       </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                       <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          {user.isActive && (
                                             <button
                                                aria-label={`Desactivar ${user.name}`}
                                                title={isSelf ? 'No puedes desactivarte a ti mismo' : 'Desactivar usuario'}
                                                disabled={isSelf}
                                                onClick={() => handleDeactivate(user)}
                                                className="p-2.5 rounded-xl bg-slate-100 text-slate-400 hover:text-delphi-giants transition-all focus:opacity-100 outline-none disabled:opacity-30 disabled:cursor-not-allowed">
                                                <UserX className="w-4 h-4" />
                                             </button>
                                          )}
                                       </div>
                                    </td>
                                 </tr>
                              );
                           })}
                        </tbody>
                     </table>
                  )}
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
                        <label htmlFor="cvThreshold" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">CV Umbral de Consenso (%)</label>
                        <input id="cvThreshold" type="number" defaultValue={20} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-black" />
                        <p className="text-[10px] text-slate-400 italic font-bold">Coeficiente de Variación máximo para considerar convergencia alta.</p>
                     </div>
                     <div className="space-y-3">
                        <label htmlFor="maxRounds" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Máximo de Rondas Sugeridas</label>
                        <input id="maxRounds" type="number" defaultValue={4} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-black" />
                     </div>
                  </div>
               </div>

               <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-xl space-y-8 relative overflow-hidden">
                  <h3 className="text-2xl font-black tracking-tight flex items-center gap-3 relative z-10">
                     <Lock className="w-6 h-6 text-delphi-giants" />
                     Seguridad Institucional
                  </h3>
                  <div className="space-y-6 relative z-10">
                     <div role="switch" aria-checked="true" aria-label="Doble Factor UCE (2FA)" tabIndex={0} className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/10 group hover:bg-white/10 transition-all cursor-pointer">
                        <div>
                           <p className="font-black">Doble Factor UCE (2FA)</p>
                           <p className="text-xs text-slate-400 font-bold mt-1">Requerir autenticación adicional para administradores.</p>
                        </div>
                        <div className="w-12 h-6 bg-delphi-keppel rounded-full relative p-1">
                           <div className="w-4 h-4 bg-white rounded-full absolute right-1" />
                        </div>
                     </div>
                     <div role="switch" aria-checked="false" aria-label="Auditoría Extendida" tabIndex={0} className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/10 group hover:bg-white/10 transition-all cursor-pointer">
                        <div>
                           <p className="font-black">Auditoría Extendida</p>
                           <p className="text-xs text-slate-400 font-bold mt-1">Guardar IP y User-Agent en cada estimación.</p>
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
