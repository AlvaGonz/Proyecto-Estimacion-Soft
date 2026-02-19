
import React from 'react';
import { Bell, Clock, Target, Users, Zap, X, Check } from 'lucide-react';

interface NotificationCenterProps {
  onClose: () => void;
}

const MOCK_NOTIFICATIONS = [
  { id: 'n1', type: 'invite', msg: 'Has sido invitado como Experto al proyecto "Seguridad API 2024"', time: 'Hace 5 min', unread: true },
  { id: 'n2', type: 'round', msg: 'La Ronda 2 de "Microservicios" ha sido cerrada por el Facilitador.', time: 'Hace 1 hora', unread: true },
  { id: 'n3', type: 'consensus', msg: '¡Convergencia alcanzada! Tarea "Auth Mod" lista para cierre.', time: 'Ayer', unread: false },
  { id: 'n4', type: 'system', msg: 'Recordatorio: Tienes 3 tareas pendientes de estimar.', time: 'Hace 2 días', unread: false },
];

const NotificationCenter: React.FC<NotificationCenterProps> = ({ onClose }) => {
  return (
    <div className="absolute top-20 right-10 w-96 max-h-[500px] bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 z-[60] overflow-hidden flex flex-col animate-in slide-in-from-top-4 duration-300">
       <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
             <Bell className="w-5 h-5 text-delphi-keppel" />
             <h4 className="font-black text-slate-900 tracking-tight">Notificaciones (RF025)</h4>
          </div>
          <button onClick={onClose} className="p-1 text-slate-300 hover:text-delphi-giants transition-colors"><X className="w-5 h-5" /></button>
       </div>

       <div className="flex-1 overflow-y-auto no-scrollbar p-2">
          {MOCK_NOTIFICATIONS.map(n => (
            <div key={n.id} className={`p-4 rounded-3xl flex gap-4 transition-all hover:bg-slate-50 relative group ${n.unread ? 'bg-delphi-keppel/5' : ''}`}>
               <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${
                 n.type === 'invite' ? 'bg-delphi-keppel/10 text-delphi-keppel' :
                 n.type === 'round' ? 'bg-delphi-orange/10 text-delphi-orange' :
                 n.type === 'consensus' ? 'bg-delphi-celadon/10 text-delphi-keppel' : 'bg-slate-100 text-slate-400'
               }`}>
                  {n.type === 'invite' && <Users className="w-6 h-6" />}
                  {n.type === 'round' && <Clock className="w-6 h-6" />}
                  {n.type === 'consensus' && <Zap className="w-6 h-6" />}
                  {n.type === 'system' && <Target className="w-6 h-6" />}
               </div>
               <div className="flex-1">
                  <p className={`text-xs font-bold leading-relaxed mb-1 ${n.unread ? 'text-slate-900' : 'text-slate-500'}`}>{n.msg}</p>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{n.time}</span>
               </div>
               {n.unread && (
                 <div className="w-2 h-2 rounded-full bg-delphi-keppel mt-2 shrink-0" />
               )}
               <button className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white rounded-lg shadow-sm border border-slate-100 text-slate-400 hover:text-delphi-keppel">
                  <Check className="w-3.5 h-3.5" />
               </button>
            </div>
          ))}
       </div>

       <div className="p-4 border-t border-slate-50 bg-slate-50/20 text-center">
          <button className="text-[10px] font-black uppercase tracking-[0.2em] text-delphi-keppel hover:underline">Marcar todas como leídas</button>
       </div>
    </div>
  );
};

export default NotificationCenter;
