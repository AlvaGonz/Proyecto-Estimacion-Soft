import React, { useState, useEffect, useCallback } from 'react';
import {
   ShieldCheck,
   TrendingUp,
   BarChart2,
   Calendar,
   FolderArchive,
   Users,
   Zap,
   History as HistoryIcon
} from 'lucide-react';
import { User as AppUser, Round } from '../../../types';
import { adminService, AdminUser } from '../services/adminService';
import { projectService } from '../../projects/services/projectService';
import { notificationService } from '../../notifications/services/notificationService';
import { taskService } from '../../tasks/services/taskService';
import { roundService } from '../../rounds/services/roundService';
import { getAdminMetricsSummary } from '../../../shared/utils/performanceMetrics';
import { useModal } from '../../../shared/components/ModalProvider';

// Modular Components
import { 
   AdminStatCard, 
   UsersTab, 
   ProjectsTab, 
   SettingsTab,
   CreateUserModal,
   EditUserModal
} from './Admin';

interface AdminPanelProps {
   currentUser?: AppUser | null;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser }) => {
   const { confirm } = useModal();
   const [activeTab, setActiveTab] = useState<'users' | 'projects' | 'settings'>('users');
   const [isLoading, setIsLoading] = useState(true);
   const [users, setUsers] = useState<AdminUser[]>([]);
   const [projects, setProjects] = useState<any[]>([]);
   const [error, setError] = useState<string | null>(null);
   const [roleFilter, setRoleFilter] = useState<string>('');
   const [showInactive, setShowInactive] = useState(false);
   const [showCreateModal, setShowCreateModal] = useState(false);
   const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
   const [modalLoading, setModalLoading] = useState(false);
   const [modalError, setModalError] = useState<string | null>(null);
   const [successMessage, setSuccessMessage] = useState<string | null>(null);
   
   // Performance state
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
      try {
         setIsLoading(true);
         setError(null);
         const data = await adminService.listProjects();
         setProjects(Array.isArray(data) ? data : []);

         if (activeTab === 'users' || activeTab === 'projects') {
            const activeProj = (Array.isArray(data) ? data : []).filter(p => p && !p.isDeleted);
            
            if (activeProj.length === 0) {
               setMetrics(getAdminMetricsSummary([], [], {}));
               return;
            }

            const allTasksPromises = activeProj.map(p => 
               taskService.getTasks(p.id).catch(() => [])
            );
            const tasksArrays = await Promise.all(allTasksPromises);
            const allTasks = tasksArrays.flat();

            const roundsMap: Record<string, Round[]> = {};
            const roundPromises = allTasks.map(async (task) => {
               try {
                  const rounds = await roundService.getRoundsByTask(task.projectId, task.id);
                  roundsMap[task.id] = rounds || [];
               } catch (e) {
                  roundsMap[task.id] = [];
               }
            });
            
            await Promise.all(roundPromises);

            const summary = getAdminMetricsSummary(data, allTasks, roundsMap);
            setMetrics(summary);
         }
      } catch (err: any) {
         setError(err.message || 'Error al cargar proyectos');
         setMetrics(getAdminMetricsSummary([], [], {}));
      } finally {
         setIsLoading(false);
      }
   }, [activeTab]);

   useEffect(() => {
      if (activeTab === 'users') {
         loadUsers();
         loadProjects();
      } else if (activeTab === 'projects') {
         loadProjects();
      } else {
         setIsLoading(false);
      }
   }, [activeTab, loadUsers, loadProjects]);

   const handleCreateUser = async (data: any) => {
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

   const handleEditUser = async (data: any) => {
      if (!editingUser) return;
      setModalLoading(true);
      setModalError(null);
      try {
         await adminService.updateUser(editingUser.id || editingUser._id || '', data);
         setEditingUser(null);
         setSuccessMessage(`Usuario ${data.name} actualizado.`);
         setTimeout(() => setSuccessMessage(null), 4000);
         await loadUsers();
      } catch (err: any) {
         setModalError(err.message || 'Error al actualizar usuario');
      } finally {
         setModalLoading(false);
      }
   };

   const handleDeactivateUser = async (user: AdminUser) => {
      const isConfirmed = await confirm(
         '¿Desactivar usuario?',
         `¿Estás seguro de que deseas desactivar a ${user.name}?`,
         { type: 'danger', confirmText: 'Desactivar' }
      );
      if (!isConfirmed) return;
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
      const isConfirmed = await confirm(
         '¿Restaurar proyecto?',
         `¿Deseas restaurar "${name}"?`,
         { type: 'info', confirmText: 'Restaurar' }
      );
      if (!isConfirmed) return;
      try {
         await adminService.restoreProject(id);
         setSuccessMessage(`Proyecto "${name}" restaurado.`);
         setTimeout(() => setSuccessMessage(null), 4000);
         await loadProjects();
      } catch (err: any) {
         setError(err.message || 'Error al restaurar proyecto');
      }
   };

   const handleDeleteProject = async (id: string, project: any) => {
      const isConfirmed = await confirm(
         '¿Eliminar proyecto?',
         `¿Desea eliminar permanentemente "${project.name}"? Esta acción no se puede deshacer.`,
         { type: 'danger', confirmText: 'Eliminar' }
      );
      if (!isConfirmed) return;
      try {
         setIsLoading(true);
         await projectService.deleteProject(id);
         
         const targetIds = [project.facilitatorId, ...(project.expertIds || [])]
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
         setTimeout(() => window.location.reload(), 1500);
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

         {editingUser && (
            <EditUserModal
               user={editingUser}
               onClose={() => { setEditingUser(null); setModalError(null); }}
               onSave={handleEditUser}
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
            <div className="flex bg-slate-100 p-2 rounded-2xl" role="tablist">
               {(['users', 'projects', 'settings'] as const).map(tab => (
                  <button key={tab} role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)}
                     className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-delphi-giants shadow-sm' : 'text-slate-400'}`}>
                     {tab === 'users' ? 'Usuarios' : tab === 'projects' ? 'Proyectos' : 'Configuración'}
                  </button>
               ))}
            </div>
         </header>
  
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <AdminStatCard icon={Users} label="Participación" value={`${metrics.participationRate}%`} badgeText="Requisito RF012" BadgeIcon={TrendingUp} variant="keppel" />
            <AdminStatCard icon={BarChart2} label="Índice Consenso" value={`${metrics.consensusIndex}/100`} badgeText="Requisito RF020" BadgeIcon={Zap} variant="giants" />
            <AdminStatCard icon={HistoryIcon} label="Promedio Rondas" value={metrics.avgRounds} badgeText="Eficiencia" BadgeIcon={Calendar} variant="orange" />
            <AdminStatCard icon={FolderArchive} label="Sesiones Activas" value={metrics.activeSessions} badgeText="Monitoreo" BadgeIcon={Zap} variant="dark" />
         </div>

         {activeTab === 'users' ? (
            <UsersTab 
               users={users} 
               isLoading={isLoading} 
               error={error} 
               successMessage={successMessage}
               roleFilter={roleFilter} 
               showInactive={showInactive} 
               currentUser={currentUser}
               onRoleFilterChange={setRoleFilter}
               onShowInactiveToggle={() => setShowInactive(!showInactive)}
               onCreateUser={() => setShowCreateModal(true)}
               onEditUser={setEditingUser}
               onDeactivateUser={handleDeactivateUser}
            />
         ) : activeTab === 'projects' ? (
            <ProjectsTab 
               projects={projects} 
               isLoading={isLoading} 
               error={error} 
               successMessage={successMessage}
               onRestoreProject={handleRestoreProject}
               onDeleteProject={handleDeleteProject}
            />
         ) : (
            <SettingsTab />
         )}
      </div>
   );
};

export default AdminPanel;
