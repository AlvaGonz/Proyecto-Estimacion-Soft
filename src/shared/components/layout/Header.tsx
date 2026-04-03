import React from 'react';
import { Menu, Search, Bell } from 'lucide-react';

interface HeaderProps {
  setIsSidebarOpen: (isOpen: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  unreadNotifications: number;
}

export const Header: React.FC<HeaderProps> = ({
  setIsSidebarOpen,
  searchQuery,
  setSearchQuery,
  showNotifications,
  setShowNotifications,
  unreadNotifications
}) => {
  return (
    <header className="glass-navbar h-24 flex items-center justify-between px-6 md:px-12 shrink-0 z-40">
      <div className="flex items-center gap-6">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden p-3 rounded-2xl bg-white shadow-sm text-slate-500 hover:text-delphi-keppel transition-all border border-slate-100"
          aria-label="Abrir menú"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="relative group hidden md:block">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-delphi-keppel transition-colors" />
          <input
            type="text"
            placeholder="Buscar en el workspace..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-6 py-3 bg-white/50 border border-slate-200/60 rounded-2xl text-xs font-semibold w-64 lg:w-80 focus:w-96 focus:ring-4 focus:ring-delphi-keppel/10 focus:bg-white focus:border-delphi-keppel/30 transition-all outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className={`relative p-3 rounded-2xl transition-all duration-300 ${showNotifications
              ? 'bg-delphi-keppel text-white shadow-xl shadow-delphi-keppel/20 scale-105'
              : 'bg-white border border-slate-100 text-slate-500 hover:border-delphi-keppel/30 hover:text-delphi-keppel shadow-sm'
            }`}
        >
          <Bell className="w-5 h-5" />
          {unreadNotifications > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-delphi-giants border-2 border-white rounded-full flex items-center justify-center text-[8px] font-black text-white shadow-lg animate-bounce">
              {unreadNotifications}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
