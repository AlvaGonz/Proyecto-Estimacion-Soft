
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
   AlertCircle,
   TrendingUp,
   BarChart2,
   Calendar,
   FolderArchive,
   RotateCcw,
   Trash2
} from 'lucide-react';
<<<<<<< HEAD:components/AdminPanel.tsx
import { UserRole, User as AppUser, Round, Task, Project } from '../types';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { adminService, AdminUser } from '../services/adminService';
import { projectService } from '../services/projectService';
import { notificationService } from '../services/notificationService';
import { taskService } from '../services/taskService';
import { roundService } from '../services/roundService';
import { calculateParticipationRate, calculateConsensusIndex, calculateAverageRounds } from '../utils/performanceMetrics';
=======
import { UserRole, User as AppUser, Round, Task, Project } from '../../../types';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { adminService, AdminUser } from '../services/adminService';
import { projectService } from '../../projects/services/projectService';
import { notificationService } from '../../notifications/services/notificationService';
import { taskService } from '../../tasks/services/taskService';
import { roundService } from '../../rounds/services/roundService';
import { calculateParticipationRate, calculateConsensusIndex, calculateAverageRounds } from '../../../shared/utils/performanceMetrics';
>>>>>>> 4e67803f0d3febe54d51e7aedb2ef04496ea19c9:src/features/users/components/AdminPanel.tsx

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
   const [activeTab, setActiveTab] = useState<'users' | 'projects' | 'settings'>('users');
   const [isLoading, setIsLoading] = useState(true);
   const [users, setUsers] = useState<AdminUser[]>([]);
   const [projects, setProjects] = useState<any[]>([]);
   const [error, setError] = useState<string | null>(null);
   const [roleFilter, setRoleFilter] = useState<string>('');
   const [showInactive, setShowInactive] = useState(false);
   const [showCreateModal, setShowCreateModal] = useState(false);
   const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    
    // Performance state
    const [tasks, setTasks] = useState<Task[]>([]);
    const [roundsByTask, setRoundsByTask] = useState<Record<string, Round[]>>({});
    const [metrics, setMetrics] = useState({
       participationRate: 0,
       consensusIndex: 0,
       avgRounds: 0,
       activeSessions: 0
    });


   const loadUsers = useCallback(async () => {
      if (activeTab !== 'users') return;
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

   const loadProjects = useCallback(async () => {
      if (activeTab !== 'projects' && activeTab !== 'users') return;
      try {
         setIsLoading(true);
         setError(null);
         const data = await adminService.listProjects();
         setProjects(data);

         // Summary metrics based on projects data
         const activeProj = data.filter(p => !p.isDeleted && p.status === 'active');
         const finishedProj = data.filter(p => !p.isDeleted && p.status === 'finished');
         
         // We'll use more efficient metrics calculation if needed, 
         // but for now, let's keep it simple and fix the infinite loops or heavy processing
         setMetrics(prev => ({
            ...prev,
            activeSessions: activeProj.length,
            // These would ideally come from a simplified stats endpoint or be calculated once
            // Consensus and Participation require fetching tasks/rounds which is heavy in a loop
         }));

      } catch (err: any) {
         setError(err.message || 'Error al cargar proyectos');
      } finally {
         setIsLoading(false);
      }
   }, [activeTab]);

   useEffect(() => {
      if (activeTab === 'users') {
         loadUsers();
         // Also load projects if we want to update the active sessions count
         loadProjects();
      }
      if (activeTab === 'projects') loadProjects();
      if (activeTab === 'settings') setIsLoading(false);
   }, [activeTab, loadUsers, loadProjects]);

   const handleCreateUser = async (data: { name: string; email: string; password: string; role: string }) => {
      setModalLoading(true);
      setModalError(null);
      try {
         await adminService.createUser(data);
         setShowCreateModal(false);
         setSuccessMessage(`Usuario ${data.name} creado exitosamente.`);
         setTimeout(() => setSuccessMessage(null), 4000);
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
         setSuccessMessage(`Usuario ${user.name} desactivado.`);
         setTimeout(() => setSuccessMessage(null), 4000);
         await loadUsers();
      } catch (err: any) {
         setError(err.message || 'Error al desactivar usuario');
      }
   };

   const handleRestoreProject = async (id: string, name: string) => {
      if (!window.confirm(`¿Restaurar el proyecto "${name}"?`)) return;
      try {
         await adminService.restoreProject(id);
         setSuccessMessage(`Proyecto "${name}" restaurado exitosamente.`);
         setTimeout(() => setSuccessMessage(null), 4000);
         await loadProjects();
      } catch (err: any) {
         setError(err.message || 'Error al restaurar proyecto');
      }
   };

   const handleDeleteProject = async (id: string, project: any) => {
      if (!window.confirm(`¿Desea eliminar el proyecto "${project.name}"? Esta acción notificará a los afiliados.`)) return;
      try {
         setIsLoading(true);
         await projectService.deleteProject(id);
         
         // RF025: Notificar a los afiliados
         const facilitatorId = project.facilitatorId?.id || project.facilitatorId?._id || project.facilitatorId;
         const expertIds = project.expertIds || [];
         const allIds = [facilitatorId, ...expertIds];
         
         const targetIds = allIds
            .map(uid => (typeof uid === 'object' && uid !== null ? uid.id || uid._id : uid))
            .filter(uid => uid && String(uid) !== String(currentUser?.id));

         targetIds.forEach(targetId => {
            notificationService.addNotification({
               type: 'system',
               message: `El proyecto "${project.name}" ha sido eliminado por el administrador.`,
               projectId: id,
               targetUserId: String(targetId)
            });
         });

         setSuccessMessage(`Proyecto "${project.name}" eliminado correctamente.`);
         setTimeout(() => {
            window.location.reload();
         }, 1500);
      } catch (err: any) {
         setError(err.message || 'Error al eliminar proyecto');
         setIsLoading(false);
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

         <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8 bg-white p-5 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-sm">
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
               <button role="tab" aria-selected={activeTab === 'projects'} onClick={() => setActiveTab('projects')}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'projects' ? 'bg-white text-delphi-giants shadow-sm' : 'text-slate-400'}`}>
                  Proyectos
               </button>
               <button role="tab" aria-selected={activeTab === 'settings'} onClick={() => setActiveTab('settings')}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'settings' ? 'bg-white text-delphi-giants shadow-sm' : 'text-slate-400'}`}>
                  Configuración
               </button>
            </div>
         </header>
 
         {/* Key Performance Indicators */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden relative group">
               <div className="flex items-center gap-4 relative z-10">
                  <div className="bg-delphi-keppel/10 p-3 rounded-2xl group-hover:scale-110 transition-transform">
                     <Users className="w-6 h-6 text-delphi-keppel" />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Participación</p>
                     <h4 className="text-2xl font-black text-slate-900 mt-1">{metrics.participationRate}%</h4>
                  </div>
               </div>
               <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-delphi-keppel bg-delphi-keppel/5 px-3 py-1 rounded-full w-fit">
                  <TrendingUp className="w-3 h-3" /> Requisito RF012 Cumplido
               </div>
               <div className="absolute top-0 right-0 w-24 h-24 bg-delphi-keppel/5 rounded-bl-full -mr-12 -mt-12 transition-all group-hover:scale-150" />
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden relative group">
               <div className="flex items-center gap-4 relative z-10">
                  <div className="bg-delphi-giants/10 p-3 rounded-2xl group-hover:scale-110 transition-transform">
                     <BarChart2 className="w-6 h-6 text-delphi-giants" />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Índice Consenso</p>
                     <h4 className="text-2xl font-black text-slate-900 mt-1">{metrics.consensusIndex}/100</h4>
                  </div>
               </div>
               <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-delphi-giants bg-delphi-giants/5 px-3 py-1 rounded-full w-fit">
                  <Zap className="w-3 h-3" /> Requisito RF020 Activo
               </div>
               <div className="absolute top-0 right-0 w-24 h-24 bg-delphi-giants/5 rounded-bl-full -mr-12 -mt-12 transition-all group-hover:scale-150" />
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden relative group">
               <div className="flex items-center gap-4 relative z-10">
                  <div className="bg-delphi-orange/10 p-3 rounded-2xl group-hover:scale-110 transition-transform">
                     <History className="w-6 h-6 text-delphi-orange" />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Promedio Rondas</p>
                     <h4 className="text-2xl font-black text-slate-900 mt-1">{metrics.avgRounds}</h4>
                  </div>
               </div>
               <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-delphi-orange bg-delphi-orange/5 px-3 py-1 rounded-full w-fit">
                  <Calendar className="w-3 h-3" /> Eficiencia de Sesión
               </div>
               <div className="absolute top-0 right-0 w-24 h-24 bg-delphi-orange/5 rounded-bl-full -mr-12 -mt-12 transition-all group-hover:scale-150" />
            </div>

            <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl overflow-hidden relative group">
               <div className="flex items-center gap-4 relative z-10">
                  <div className="bg-white/10 p-3 rounded-2xl group-hover:scale-110 transition-transform">
                     <FolderArchive className="w-6 h-6 text-white" />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Sesiones Activas</p>
                     <h4 className="text-2xl font-black text-white mt-1">{metrics.activeSessions}</h4>
                  </div>
               </div>
               <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-white/60 bg-white/10 px-3 py-1 rounded-full w-fit">
                  <LoadingSpinner size="sm" /> Monitoreo en Tiempo Real
               </div>
               <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-tl-full -mr-16 -mb-16 transition-all group-hover:scale-150" />
            </div>
         </div>

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
 
               {successMessage && (
                  <div className="mx-8 mt-6 flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                     <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                     {successMessage}
                  </div>
               )}

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
         ) : activeTab === 'projects' ? (
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
               <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                     <FolderArchive className="w-5 h-5 text-delphi-giants" />
                     Gestión de Proyectos
                  </h3>
               </div>

               {successMessage && (
                  <div className="mx-8 mt-6 flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                     <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                     {successMessage}
                  </div>
               )}

               {error && (
                  <div className="mx-8 mt-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-bold">
                     <AlertCircle className="w-4 h-4 flex-shrink-0" />
                     {error}
                  </div>
               )}

               <div className="overflow-x-auto min-h-[300px]">
                  {isLoading ? (
                     <div className="flex items-center justify-center h-full py-20">
                        <LoadingSpinner size="lg" label="Cargando proyectos..." />
                     </div>
                  ) : projects.length === 0 ? (
                     <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-4">
                        <FolderArchive className="w-12 h-12 opacity-30" />
                        <p className="font-black">No hay proyectos registrados</p>
                     </div>
                  ) : (
                     <table className="w-full min-w-[800px]">
                        <thead>
                           <tr className="bg-slate-50">
                              <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Proyecto</th>
                              <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Facilitador</th>
                              <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                              <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {projects.map(project => (
                              <tr key={project.id || project._id} className={`hover:bg-slate-50 transition-colors group ${project.isDeleted ? 'bg-red-50/30' : ''}`}>
                                 <td className="px-8 py-6">
                                    <div>
                                       <p className="font-black text-slate-900">{project.name}</p>
                                       <p className="text-xs text-slate-400 font-bold line-clamp-1">{project.description}</p>
                                    </div>
                                 </td>
                                 <td className="px-8 py-6">
                                    <div className="flex flex-col">
                                       <span className="text-sm font-black text-slate-700">{project.facilitatorId?.name}</span>
                                       <span className="text-[10px] text-slate-400 font-bold">{project.facilitatorId?.email}</span>
                                    </div>
                                 </td>
                                 <td className="px-8 py-6">
                                    <div className="flex items-center gap-2">
                                       {project.isDeleted ? (
                                          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-widest rounded-lg border border-red-200">
                                             <Trash2 className="w-3 h-3" /> Eliminado
                                          </span>
                                       ) : (
                                          <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border ${
                                             project.status === 'archived' 
                                                ? 'bg-slate-100 text-slate-500 border-slate-200' 
                                                : 'bg-delphi-keppel/10 text-delphi-keppel border-delphi-keppel/20'
                                          }`}>
                                             {project.status}
                                          </span>
                                       )}
                                    </div>
                                 </td>
                                 <td className="px-8 py-6 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                       {project.isDeleted ? (
                                          <button
                                             aria-label={`Restaurar ${project.name}`}
                                             title="Restaurar proyecto"
                                             onClick={() => handleRestoreProject(project.id || project._id, project.name)}
                                             className="p-2.5 rounded-xl bg-delphi-keppel text-white hover:scale-105 transition-all shadow-lg shadow-delphi-keppel/20">
                                             <RotateCcw className="w-4 h-4" />
                                          </button>
                                       ) : (
                                          <button
                                             aria-label={`Eliminar ${project.name}`}
                                             title="Eliminar proyecto"
                                             onClick={() => handleDeleteProject(project.id || project._id, project)}
                                             className="p-2.5 rounded-xl bg-red-600 text-white hover:scale-105 transition-all shadow-lg shadow-red-600/20">
                                             <Trash2 className="w-4 h-4" />
                                          </button>
                                       )}
                                    </div>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  )}
               </div>
            </div>
         ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
               <div className="bg-white p-5 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
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

               <div className="bg-slate-900 p-5 md:p-10 rounded-[2rem] md:rounded-[3rem] text-white shadow-xl space-y-8 relative overflow-hidden">
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
