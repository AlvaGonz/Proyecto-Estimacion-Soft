import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { adminService, AdminUser } from '../../services/adminService';

// --- Create User Modal ---
interface UserModalProps {
   onClose: () => void;
   onSave: (data: { name: string; email: string; password: string; role: string }) => Promise<void>;
   isLoading: boolean;
   error: string | null;
}

export const CreateUserModal: React.FC<UserModalProps> = ({ onClose, onSave, isLoading, error }) => {
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

// --- Edit User Modal ---
interface EditUserModalProps {
  user: AdminUser;
  onClose: () => void;
  onSave: (data: { name: string; role: string; isActive: boolean }) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onSave, isLoading, error }) => {
  const [form, setForm] = useState({
    name: user.name,
    role: user.role,
    isActive: user.isActive,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(form);
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-user-title"
    >
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h3 id="edit-user-title" className="text-2xl font-black text-slate-900">Editar Usuario</h3>
          <button onClick={onClose} aria-label="Cerrar modal" className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <p className="text-slate-400 text-sm font-bold">Actualice la información del perfil y rol.</p>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-bold">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="edit-user-name" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre</label>
            <input
              id="edit-user-name"
              type="text"
              required
              minLength={2}
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-sm focus:ring-2 focus:ring-delphi-keppel/30 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-sm text-slate-400 cursor-not-allowed"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="edit-user-role" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rol</label>
            <select
              id="edit-user-role"
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-sm focus:ring-2 focus:ring-delphi-keppel/30 outline-none transition-all"
            >
              <option value="experto">Experto</option>
              <option value="facilitador">Facilitador</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="edit-user-status" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estado</label>
            <select
              id="edit-user-status"
              value={form.isActive ? 'activo' : 'inactivo'}
              onChange={e => setForm(f => ({ ...f, isActive: e.target.value === 'activo' }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-sm focus:ring-2 focus:ring-delphi-keppel/30 outline-none transition-all"
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-slate-200 text-sm font-black text-slate-500 hover:bg-slate-50 transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={isLoading}
              className="flex-1 py-3 rounded-2xl bg-delphi-keppel text-white text-sm font-black shadow-lg shadow-delphi-keppel/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
