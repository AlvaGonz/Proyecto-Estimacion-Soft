import React from 'react';
import { 
  X, 
  BrainCircuit, 
  LayoutDashboard, 
  FolderKanban, 
  BarChart3, 
  ShieldAlert, 
  LogOut 
} from 'lucide-react';
import { User, UserRole } from '../../../types';
import { AppView } from '../../hooks/useAppState';
import { NavButton } from '../navigation/NavButton';

interface SidebarProps {
  currentUser: User;
  view: AppView;
  setView: (view: AppView) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  logout: () => void;
  setShowProfileModal: (show: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  view,
  setView,
  isSidebarOpen,
  setIsSidebarOpen,
  logout,
  setShowProfileModal
}) => {
  const isFacilitator = currentUser.role === UserRole.FACILITATOR || currentUser.role === UserRole.ADMIN;
  const isAdmin = currentUser.role === UserRole.ADMIN;

  const handleNavClick = (target: AppView) => {
    setView(target);
    setIsSidebarOpen(false);
  };

  return (
    <aside className={`fixed inset-y-0 left-0 w-72 glass-sidebar flex flex-col z-50 transition-transform duration-500 ease-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-8 border-b border-white/5 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4 group cursor-pointer" onClick={() => handleNavClick('dashboard')}>
          <div className="bg-delphi-keppel p-2.5 rounded-2xl shadow-xl shadow-delphi-keppel/20 group-hover:rotate-12 transition-transform duration-500">
            <BrainCircuit className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tighter text-white leading-none">EstimaPro</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-delphi-celadon font-bold mt-1 opacity-70">UCE Engineering</p>
          </div>
        </div>
        <button onClick={() => setIsSidebarOpen(false)} aria-label="Cerrar menú lateral" className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      <nav className="flex-1 p-6 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
        <NavButton target="dashboard" icon={LayoutDashboard} label="Dashboard" currentView={view} onClick={handleNavClick} />
        <NavButton target="projects" icon={FolderKanban} label="Proyectos" currentView={view} onClick={handleNavClick} />

        {isFacilitator && (
          <NavButton target="reports" icon={BarChart3} label="Reportes" currentView={view} onClick={handleNavClick} />
        )}

        {isAdmin && (
          <NavButton target="admin" icon={ShieldAlert} label="Administración" color="giants" currentView={view} onClick={handleNavClick} />
        )}
      </nav>

      <div className="p-6">
        <div className="p-5 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-inner group">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-delphi flex items-center justify-center font-black text-white shadow-xl group-hover:scale-105 transition-transform">
              {currentUser.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
              <p className="text-[10px] text-delphi-celadon font-bold uppercase tracking-widest truncate opacity-80">{currentUser.role}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all text-[10px] font-black uppercase tracking-widest border border-white/5"
            >
              Perfil
            </button>
            <button
              onClick={logout}
              className="p-2.5 rounded-xl bg-delphi-giants/10 text-delphi-giants hover:bg-delphi-giants hover:text-white transition-all border border-delphi-giants/20"
              title="Cerrar Sesión"
              aria-label="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
