
import React from 'react';
import { 
  Users as UsersIcon, 
  UserPlus, 
  UserCheck, 
  UserX, 
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { AdminUser } from '../../services/adminService';
import { LoadingSpinner } from '../../../../shared/components/LoadingSpinner';

const roleBadgeClass = (role: string) => {
  if (role === 'admin') return 'bg-delphi-giants/10 text-delphi-giants border-delphi-giants/20';
  if (role === 'facilitador') return 'bg-delphi-keppel/10 text-delphi-keppel border-delphi-keppel/20';
  return 'bg-slate-100 text-slate-500 border-slate-200';
};

interface UsersTabProps {
  users: AdminUser[];
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  roleFilter: string;
  showInactive: boolean;
  currentUser: any;
  onRoleFilterChange: (role: string) => void;
  onShowInactiveToggle: () => void;
  onCreateUser: () => void;
  onEditUser: (user: AdminUser) => void;
  onDeactivateUser: (user: AdminUser) => void;
}

export const UsersTab: React.FC<UsersTabProps> = ({
  users,
  isLoading,
  error,
  successMessage,
  roleFilter,
  showInactive,
  currentUser,
  onRoleFilterChange,
  onShowInactiveToggle,
  onCreateUser,
  onEditUser,
  onDeactivateUser
}) => {
  return (
    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/30">
        <div className="flex items-center gap-4 flex-1">
          <select 
            aria-label="Filtrar por rol"
            value={roleFilter} 
            onChange={e => onRoleFilterChange(e.target.value)}
            className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-delphi-giants/30 outline-none transition-all"
          >
            <option value="">Todos los roles</option>
            <option value="admin">Administrador</option>
            <option value="facilitador">Facilitador</option>
            <option value="experto">Experto</option>
          </select>
          
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div 
              onClick={onShowInactiveToggle}
              className={`w-10 h-5 rounded-full relative p-0.5 transition-colors ${showInactive ? 'bg-delphi-keppel' : 'bg-slate-300'}`}
              role="switch" 
              aria-checked={showInactive} 
              aria-label="Mostrar inactivos" 
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && onShowInactiveToggle()}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${showInactive ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-xs font-bold text-slate-500">Mostrar inactivos</span>
          </label>
        </div>
        
        <button 
          id="btn-nuevo-usuario" 
          onClick={onCreateUser}
          className="gap-3 bg-delphi-giants text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-delphi-giants/20 hover:scale-[1.02] active:scale-95 transition-all btn-base"
        >
          <UserPlus className="w-4 h-4" />
          Crear Nuevo Usuario
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
            <UsersIcon className="w-12 h-12 opacity-30" />
            <p className="font-black">No hay usuarios registrados</p>
          </div>
        ) : (
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500">
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest">Usuario</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest">Rol</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest">Estado</th>
                <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(user => {
                const userId = user.id || user._id;
                const isSelf = currentUser?.id === userId;
                
                return (
                  <tr key={userId} className="user-row hover:bg-slate-50 transition-colors group">
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
                      <div className="flex items-center justify-end gap-2 group-hover:bg-slate-100/50 p-1 rounded-xl transition-all">
                        <button
                          aria-label={`editar ${user.name}`}
                          title="Editar usuario"
                          onClick={() => onEditUser(user)}
                          className="p-2.5 rounded-xl bg-slate-100 text-slate-400 hover:text-delphi-keppel transition-all focus:opacity-100 outline-none"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                        {user.isActive && (
                          <button
                            aria-label={`Desactivar ${user.name}`}
                            title={isSelf ? 'No puedes desactivarte a ti mismo' : 'Desactivar usuario'}
                            disabled={isSelf}
                            onClick={() => onDeactivateUser(user)}
                            className="p-2.5 rounded-xl bg-slate-100 text-slate-400 hover:text-delphi-giants transition-all focus:opacity-100 outline-none disabled:opacity-30 disabled:cursor-not-allowed"
                          >
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
  );
};
