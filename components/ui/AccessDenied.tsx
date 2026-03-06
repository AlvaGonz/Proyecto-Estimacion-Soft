import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const AccessDenied: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in duration-500">
      <div className="bg-red-50 p-6 rounded-full mb-6">
        <ShieldAlert className="w-16 h-16 text-red-500" />
      </div>
      <h2 className="text-2xl font-black text-slate-900 mb-2">Acceso Denegado</h2>
      <p className="text-slate-500 max-w-md">No tienes los permisos necesarios para ver esta sección o realizar esta acción.</p>
    </div>
  );
};
