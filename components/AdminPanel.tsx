
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
   FolderArchive,
   Trash2,
   RotateCcw
} from 'lucide-react';
import { UserRole, User as AppUser } from '../types';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { adminService, AdminUser } from '../services/adminService';
import { userService } from '../services/userService';

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
               <p className="text-[10px] text-slate-400 font-bold text-center mt-4">
                  * La contraseña debe tener 8+ caracteres, una mayúscula y un número.
               </p>
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
   const [confirmAction, setConfirmAction] = useState<{
      type: 'archive' | 'delete' | 'restore';
      id: string;
      name: string;
   } | null>(null);
   // Facilitator reassignment state (Projects tab)
   const [facilitators, setFacilitators] = useState<{ id: string; name: string; email: string }[]>([]);
   const [reassigning, setReassigning] = useState<Record<string, { open: boolean; selected: string; loading: boolean }>>({});

   const loadUsers = useCallback(async () => {
      setIsLoading(true);
      setError(null);
      try {
         // Clear projects to avoid confusion during state transition
         setProjects([]); 
         const filters: { role?: string; isActive?: boolean } = {};
         if (roleFilter) filters.role = roleFilter;
         if (!showInactive) filters.isActive = true;
         
         const result = await adminService.listUsers(filters);
         // Ensuring setUsers always receives an array
         const usersData = (result && Array.isArray(result.users)) ? result.users : [];
         setUsers(usersData);
      } catch (err: any) {
         console.error('Error loading users:', err);
         setError(err.message || 'Error al cargar usuarios');
      } finally {
         setIsLoading(false);
      }
    }, [activeTab, roleFilter, showInactive]);

   const loadProjects = useCallback(async () => {
      setIsLoading(true);
      setError(null);
      try {
         // Clear users to avoid confusion during state transition
         setUsers([]); 
         const [data, facs] = await Promise.all([
            adminService.listProjects(),
            userService.getActiveFacilitators()
         ]);
         
         // Robustly handle different response formats
         const projectsData = Array.isArray(data) ? data : (data as any)?.projects || (data as any)?.data || [];
         
         // [DEBUG] Trace project structure to catch ID leakage
         console.log('App: Projects loaded:', projectsData.length);
         if (projectsData.length > 0) {
            console.log('App: First project structure sample:', {
               name: projectsData[0].name,
               _id: projectsData[0]._id,
               id: projectsData[0].id,
               facId: projectsData[0].facilitatorId?._id || projectsData[0].facilitatorId
            });
         }
         
         const facilitatorsData = Array.isArray(facs) ? facs : (facs as any)?.users || (facs as any)?.data || [];
         
         console.log(`Loaded ${projectsData.length} projects and ${facilitatorsData.length} facilitators`);
         
         setProjects(projectsData);
         setFacilitators(facilitatorsData.map((f: any) => ({ 
            id: f.id || f._id, 
            name: f.name || 'Sin nombre', 
            email: f.email || '' 
         })));
      } catch (err: any) {
         console.error('Error loading projects:', err);
         setError(err.message || 'Error al cargar proyectos');
      } finally {
         setIsLoading(false);
      }
   }, [activeTab]);

   useEffect(() => {
      if (activeTab === 'users') loadUsers();
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
         console.error('Error in handleCreateUser:', err);
         // Support structured error messages from API
         let msg = 'Error al crear usuario';
         if (err.errors && typeof err.errors === 'object') {
            msg = Object.values(err.errors).flat().join(', ');
         } else if (err.message) {
            msg = err.message;
         }
         setModalError(msg);
      } finally {
         setModalLoading(false);
      }
   };

   const handleDeactivate = async (user: any) => {
      const uid = user.id || user._id;
      console.log(`Deactivating user: ${uid} (${user.name})`);
      try {
         await adminService.deactivateUser(uid);
         console.log('Deactivation successful');
         setSuccessMessage(`Usuario ${user.name} desactivado.`);
         setTimeout(() => setSuccessMessage(null), 4000);
         await loadUsers();
      } catch (err: any) {
         console.error('Error in handleDeactivate:', err);
         setError(err.message || 'Error al desactivar usuario');
      }
   };

   const handleActivate = async (user: any) => {
      const uid = user.id || user._id;
      console.log(`Activating user: ${uid} (${user.name})`);
      try {
         await adminService.activateUser(uid);
         console.log('Activation successful');
         setSuccessMessage(`Usuario ${user.name} activado.`);
         setTimeout(() => setSuccessMessage(null), 4000);
         await loadUsers();
      } catch (err: any) {
         console.error('Error in handleActivate:', err);
         setError(err.message || 'Error al activar usuario');
      }
   };

   const handleDelete = async (user: any) => {
      const uid = user.id || user._id;
      console.log(`Deleting user: ${uid} (${user.name})`);
      try {
         await adminService.deleteUser(uid);
         console.log('Deletion successful');
         setSuccessMessage(`Usuario ${user.name} eliminado.`);
         setTimeout(() => setSuccessMessage(null), 4000);
         await loadUsers();
      } catch (err: any) {
         console.error('Error in handleDelete:', err);
         setError(err.message || 'Error al eliminar usuario');
      }
   };

   const handleReassignFacilitator = async (projectId: string, projectName: string) => {
      const state = reassigning[projectId];
      if (!state?.selected) {
         console.warn('No facilitator selected for reassignment');
         return;
      }
      console.log(`Reassigning facilitator for project ${projectId} (${projectName}) to ${state.selected}`);
      setReassigning(prev => ({ ...prev, [projectId]: { ...prev[projectId], loading: true } }));
      try {
         await adminService.reassignFacilitator(projectId, state.selected);
         const facilitatorsArray = Array.isArray(facilitators) ? facilitators : [];
         const facilitatorName = facilitatorsArray.find(f => f.id === state.selected)?.name ?? 'Facilitador';
         console.log('Reassignment successful');
         setSuccessMessage(`Facilitador de "${projectName}" reasignado a ${facilitatorName}.`);
         setTimeout(() => setSuccessMessage(null), 5000);
         setReassigning(prev => ({ ...prev, [projectId]: { open: false, selected: '', loading: false } }));
         await loadProjects();
      } catch (err: any) {
         console.error('Error in reassignFacilitator:', err);
         setError(err.message || 'Error al reasignar facilitador');
         setReassigning(prev => ({ ...prev, [projectId]: { ...prev[projectId], loading: false } }));
      }
   };

   const handleRestoreProject = async (id: string, name: string) => {
      console.log(`[Admin] Attempting to RESTORE: name="${name}", id="${id}"`);
      try {
         await adminService.restoreProject(id);
         setSuccessMessage(`Proyecto "${name}" restaurado correctamente`);
         setTimeout(() => setSuccessMessage(null), 3000);
         await loadProjects();
      } catch (err: any) {
         console.error('Error restoring project:', err);
         setError(err.message || 'Error al restaurar proyecto');
      }
   };
   
   const handleArchiveProject = async (id: string, name: string) => {
      console.log(`[Admin] Attempting to ARCHIVE: name="${name}", id="${id}"`);
      try {
         await adminService.archiveProject(id);
         setSuccessMessage(`Proyecto "${name}" archivado correctamente`);
         setTimeout(() => setSuccessMessage(null), 3000);
         await loadProjects();
      } catch (err: any) {
         console.error('Error archiving project:', err);
         setError(err.message || 'Error al archivar proyecto');
      } finally {
         setConfirmAction(null);
      }
   };

   const handleDeleteProject = async (id: string, name: string) => {
      console.log(`[Admin] Attempting to DELETE: name="${name}", id="${id}"`);
      try {
         await adminService.deleteProject(id);
         setSuccessMessage(`Proyecto "${name}" eliminado correctamente`);
         setTimeout(() => setSuccessMessage(null), 3000);
         await loadProjects();
      } catch (err: any) {
         console.error('Error deleting project:', err);
         setError(err.message || 'Error al eliminar proyecto');
      } finally {
         setConfirmAction(null);
      }
   };

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
                   ) : (!users || !Array.isArray(users) || users.length === 0) ? (
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
                           {Array.isArray(users) && users.filter(u => u !== null && u !== undefined).map(user => {
                              const userId = user.id || user._id;
                              if (!userId) return null;
                              const isSelf = currentUser?.id === userId;
                              return (
                                 <tr key={userId} className="hover:bg-slate-50 transition-colors group">
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
                                          {user.isActive ? (
                                             <button
                                                aria-label={`Desactivar ${user.name}`}
                                                title={isSelf ? 'No puedes desactivarte a ti mismo' : 'Desactivar usuario'}
                                                disabled={isSelf}
                                                onClick={() => handleDeactivate(user)}
                                                className="p-2.5 rounded-xl bg-slate-100 text-slate-400 hover:text-delphi-giants transition-all focus:opacity-100 outline-none disabled:opacity-30 disabled:cursor-not-allowed">
                                                <UserX className="w-4 h-4" />
                                             </button>
                                          ) : (
                                             <button
                                                aria-label={`Habilitar ${user.name}`}
                                                title="Habilitar usuario"
                                                onClick={() => handleActivate(user)}
                                                className="p-2.5 rounded-xl bg-delphi-keppel/10 text-delphi-keppel hover:bg-delphi-keppel hover:text-white transition-all focus:opacity-100 outline-none">
                                                <UserCheck className="w-4 h-4" />
                                             </button>
                                          )}
                                          <button
                                             aria-label={`Borrar ${user.name}`}
                                             title={isSelf ? 'No puedes borrarte a ti mismo' : 'Borrar usuario permanentemente'}
                                             disabled={isSelf}
                                             onClick={() => handleDelete(user)}
                                             className="p-2.5 rounded-xl bg-slate-100 text-slate-400 hover:text-red-600 transition-all focus:opacity-100 outline-none disabled:opacity-30 disabled:cursor-not-allowed">
                                             <Trash2 className="w-4 h-4" />
                                          </button>
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
                  ) : !Array.isArray(projects) || projects.length === 0 ? (
                     <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-4">
                        <FolderArchive className="w-12 h-12 opacity-30" />
                        <p className="font-black">No hay proyectos registrados</p>
                     </div>
                  ) : (
                     <table className="w-full min-w-[900px]">
                        <thead>
                           <tr className="bg-slate-50">
                              <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Proyecto</th>
                              <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Facilitador</th>
                              <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                              <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Reasignar Facilitador</th>
                              <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {Array.isArray(projects) && projects.filter(p => p !== null && p !== undefined).map(project => {
                              // ALWAYS prioritize _id for MongoDB backend operations
                              const pid = project._id || project.id;
                              const facilitator = project.facilitatorId;
                              const rState = reassigning[pid] || { open: false, selected: '', loading: false };
                              return (
                                 <tr key={pid} className={`hover:bg-slate-50 transition-colors ${project.isDeleted ? 'bg-red-50/30' : ''}`}>
                                    <td className="px-8 py-6">
                                       <div>
                                          <p className="font-black text-slate-900">{project.name}</p>
                                          <p className="text-xs text-slate-400 font-bold line-clamp-1">{project.description}</p>
                                       </div>
                                    </td>
                                    <td className="px-8 py-6">
                                       <div className="flex flex-col gap-1">
                                          {project.facilitatorId?.name ? (
                                             <>
                                                <span className="text-sm font-black text-slate-700">{project.facilitatorId.name}</span>
                                                <span className="text-[10px] text-slate-400 font-bold">{project.facilitatorId.email}</span>
                                             </>
                                          ) : (
                                             <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded-lg border border-amber-200 w-fit">
                                                <AlertCircle className="w-3 h-3" /> Sin facilitador
                                             </span>
                                          )}
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
                                    <td className="px-8 py-6">
                                       {!project.isDeleted && (
                                          rState.open ? (
                                             <div className="flex items-center gap-2 flex-wrap">
                                                <select
                                                   aria-label="Seleccionar nuevo facilitador"
                                                   value={rState.selected}
                                                   onChange={e => setReassigning(prev => ({ ...prev, [pid]: { ...prev[pid], selected: e.target.value } }))}
                                                   className="px-3 py-2 bg-white border-2 border-delphi-keppel/40 rounded-xl text-xs font-bold outline-none focus:border-delphi-keppel transition-all min-w-[160px]"
                                                >
                                                   <option value="">— Seleccionar —</option>
                                                    {Array.isArray(facilitators) && facilitators.map(f => (
                                                       <option key={f.id} value={f.id}>{f.name}</option>
                                                    ))}
                                                </select>
                                                <button
                                                   disabled={!rState.selected || rState.loading}
                                                   onClick={() => handleReassignFacilitator(pid, project.name)}
                                                   className="px-3 py-2 bg-delphi-keppel text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-delphi-keppel/20"
                                                >
                                                   {rState.loading ? '...' : 'Guardar'}
                                                </button>
                                                <button
                                                   onClick={() => setReassigning(prev => ({ ...prev, [pid]: { open: false, selected: '', loading: false } }))}
                                                   className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                                                   aria-label="Cancelar reasignación"
                                                >
                                                   <X className="w-3.5 h-3.5" />
                                                </button>
                                             </div>
                                          ) : (
                                             <button
                                                onClick={() => setReassigning(prev => ({ ...prev, [pid]: { open: true, selected: project.facilitatorId?.id || project.facilitatorId?._id || '', loading: false } }))}
                                                className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                                                   !project.facilitatorId?.name
                                                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200'
                                                      : 'bg-slate-100 text-slate-500 hover:bg-delphi-keppel/10 hover:text-delphi-keppel'
                                                }`}
                                             >
                                                <UserCheck className="w-3.5 h-3.5" />
                                                {!project.facilitatorId?.name ? 'Asignar' : 'Cambiar'}
                                             </button>
                                          )
                                       )}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                       <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          {project.isDeleted ? (
                                             <button
                                                aria-label={`Restaurar ${project.name}`}
                                                title="Restaurar proyecto"
                                                onClick={() => handleRestoreProject(pid, project.name)}
                                                className="p-2.5 rounded-xl bg-delphi-keppel text-white hover:scale-105 transition-all shadow-lg shadow-delphi-keppel/20">
                                                <RotateCcw className="w-4 h-4" />
                                             </button>
                                          ) : (
                                             <>
                                                {project.status !== 'archived' && (
                                                   <button
                                                      aria-label={`Archivar ${project.name}`}
                                                      title="Archivar proyecto (Solo lectura)"
                                                      onClick={() => setConfirmAction({ type: 'archive', id: pid, name: project.name })}
                                                      className="p-2.5 rounded-xl bg-slate-100 text-slate-400 hover:text-amber-600 transition-all">
                                                      <FolderArchive className="w-4 h-4" />
                                                   </button>
                                                )}
                                                <button
                                                   aria-label={`Borrar ${project.name}`}
                                                   title="Eliminar proyecto (Soft-delete)"
                                                   onClick={() => setConfirmAction({ type: 'delete', id: pid, name: project.name })}
                                                   className="p-2.5 rounded-xl bg-slate-100 text-slate-400 hover:text-red-600 transition-all">
                                                   <Trash2 className="w-4 h-4" />
                                                </button>
                                             </>
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
         {/* Confirmation Modal */}
         {confirmAction && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
               <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-100">
                  <div className="bg-amber-100 w-16 h-16 rounded-3xl flex items-center justify-center mb-6 mx-auto">
                     <AlertCircle className="w-8 h-8 text-amber-600" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 text-center mb-2">¿Estás seguro?</h3>
                  <p className="text-slate-500 text-center font-bold mb-8">
                     Estás a punto de {confirmAction.type === 'archive' ? 'archivar' : 'eliminar'} el proyecto 
                     <span className="text-slate-900 block mt-1">"{confirmAction.name}"</span>
                  </p>
                  <div className="flex flex-col gap-3">
                     <button
                        onClick={() => confirmAction.type === 'archive' 
                           ? handleArchiveProject(confirmAction.id, confirmAction.name)
                           : handleDeleteProject(confirmAction.id, confirmAction.name)
                        }
                        className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all hover:scale-[1.02] shadow-xl ${
                           confirmAction.type === 'archive' 
                              ? 'bg-amber-500 shadow-amber-500/20' 
                              : 'bg-red-500 shadow-red-500/20'
                        }`}
                     >
                        Confirmar {confirmAction.type === 'archive' ? 'Archivado' : 'Eliminación'}
                     </button>
                     <button
                        onClick={() => setConfirmAction(null)}
                        className="w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                     >
                        Cancelar
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default AdminPanel;
