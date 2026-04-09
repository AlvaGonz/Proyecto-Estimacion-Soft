import React from 'react';
import { X } from 'lucide-react';
import { User } from '../../../types';

interface ProfileModalProps {
  currentUser: User;
  onClose: () => void;
  onLogout: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ currentUser, onClose, onLogout }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      <div className="bg-white/95 backdrop-blur-2xl w-full max-w-sm rounded-[2.5rem] sm:rounded-[3rem] relative shadow-2xl animate-in zoom-in duration-300 overflow-hidden">
        {/* Gradient header band */}
        <div className="h-28 sm:h-32 bg-gradient-to-br from-delphi-keppel via-delphi-celadon/60 to-delphi-keppel/80 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent_70%)]" />
          <button onClick={onClose} className="absolute top-5 right-5 p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-xl transition-all btn-base">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Avatar overlapping the header */}
        <div className="flex flex-col items-center -mt-14 sm:-mt-16 px-6 sm:px-10 pb-8 sm:pb-10">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-br from-delphi-keppel to-delphi-celadon flex items-center justify-center text-white text-3xl sm:text-4xl font-black shadow-2xl shadow-delphi-keppel/30 border-4 border-white">
            {currentUser.name.charAt(0)}
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-5 text-center">{currentUser.name}</h3>
          <span className="mt-2 px-4 py-1.5 rounded-full bg-delphi-keppel/10 text-delphi-keppel text-[10px] font-black uppercase tracking-[0.2em] border border-delphi-keppel/20">
            {currentUser.role}
          </span>
          <p className="text-slate-400 font-medium text-sm mt-3">{currentUser.email}</p>

          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-slate-100 w-full space-y-3">
            <button className="w-full py-3.5 sm:py-4 rounded-2xl bg-delphi-keppel/10 text-delphi-keppel font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-delphi-keppel hover:text-white transition-all duration-300 border border-delphi-keppel/20 btn-base">
              Cambiar Contraseña
            </button>
            <button onClick={onLogout} className="w-full py-3.5 sm:py-4 rounded-2xl bg-white text-delphi-giants font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-delphi-giants hover:text-white transition-all duration-300 border-2 border-delphi-giants/20 btn-base">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
