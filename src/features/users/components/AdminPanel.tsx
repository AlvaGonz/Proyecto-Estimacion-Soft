import React from 'react';
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
import { User as AppUser } from '../../../types';
import { useAdminPanel } from '../hooks/useAdminPanel';

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
   const {
      activeTab,
      setActiveTab,
      isLoading,
      users,
      projects,
      error,
      roleFilter,
      setRoleFilter,
      showInactive,
      setShowInactive,
      showCreateModal,
      setShowCreateModal,
      editingUser,
      setEditingUser,
      modalLoading,
      modalError,
      setModalError,
      successMessage,
      metrics,
      handleCreateUser,
      handleEditUser,
      handleDeactivateUser,
      handleRestoreProject,
      handleDeleteProject
   } = useAdminPanel(currentUser);

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
