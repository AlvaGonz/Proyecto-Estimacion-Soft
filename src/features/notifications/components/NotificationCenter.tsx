
import React, { useState, useEffect } from 'react';
import { Bell, Clock, Target, Users, Zap, X, Check, Trash2, ShieldCheck, MessageSquare, BarChart3, PlusCircle, CheckCircle2 } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { Notification } from '../../../types';

interface NotificationCenterProps {
  onClose: () => void;
  currentUserId: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ onClose, currentUserId }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchNotifications = () => {
      const allNotifs = notificationService.getNotifications();
      const userNotifs = allNotifs.filter(n => !n.targetUserId || n.targetUserId === currentUserId);
      setNotifications(userNotifs);
    };

    fetchNotifications();

    // Listen for updates from the same window
    window.addEventListener('notifications_updated', fetchNotifications);

    return () => {
      window.removeEventListener('notifications_updated', fetchNotifications);
    };
  }, [currentUserId]);

  const handleMarkAsRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    notificationService.markAsRead(id);
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsReadForUser(currentUserId);
  };

  const handleDeleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    notificationService.deleteNotification(id);
  };

  const getTimeLabel = (timestamp: number) => {
    const diff = (Date.now() - timestamp) / 1000;
    if (diff < 60) return 'Ahora';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} horas`;
    return `Hace ${Math.floor(diff / 86400)} días`;
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'project_invite': return <Users className="w-6 h-6" />;
      case 'round_opened':
      case 'new_round': return <PlusCircle className="w-6 h-6" />;
      case 'round_closed':
      case 'results_revealed': return <BarChart3 className="w-6 h-6" />;
      case 'consensus_reached': return <CheckCircle2 className="w-6 h-6" />;
      case 'expert_submission': return <MessageSquare className="w-6 h-6" />;
      case 'reminder': return <Clock className="w-6 h-6" />;
      case 'system': return <ShieldCheck className="w-6 h-6" />;
      default: return <Bell className="w-6 h-6" />;
    }
  };

  const getIconColorClass = (type: string) => {
    switch (type) {
      case 'project_invite': return 'bg-delphi-keppel/10 text-delphi-keppel';
      case 'round_opened':
      case 'new_round': return 'bg-delphi-celadon/10 text-delphi-keppel';
      case 'round_closed':
      case 'results_revealed': return 'bg-delphi-orange/10 text-delphi-orange';
      case 'consensus_reached': return 'bg-delphi-keppel/10 text-delphi-keppel';
      case 'expert_submission': return 'bg-blue-100 text-blue-500';
      case 'reminder': return 'bg-delphi-giants/10 text-delphi-giants';
      case 'system': return 'bg-slate-100 text-slate-500';
      default: return 'bg-slate-100 text-slate-400';
    }
  };

  return (
    <div className="absolute top-20 right-10 w-full sm:w-96 max-h-[500px] bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 z-[60] overflow-hidden flex flex-col animate-in slide-in-from-top-4 duration-300">
      <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-delphi-keppel" />
          <h4 className="font-black text-slate-900 tracking-tight">Notificaciones</h4>
        </div>
        <button onClick={onClose} aria-label="Cerrar notificaciones" className="p-1 text-slate-300 hover:text-delphi-giants transition-colors btn-base"><X className="w-5 h-5" /></button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-2 min-h-[100px]">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <div className="bg-slate-50 p-4 rounded-3xl mb-4">
              <Bell className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-400">Sin notificaciones</p>
          </div>
        ) : (
          notifications.map(n => (
            <div key={n.id} className={`p-4 rounded-3xl flex gap-4 transition-all hover:bg-slate-50 relative group ${!n.read ? 'bg-delphi-keppel/5' : ''}`}>
              <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${getIconColorClass(n.type)}`}>
                {getIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold leading-relaxed mb-1 ${!n.read ? 'text-slate-900' : 'text-slate-500 line-clamp-2'}`}>{n.message}</p>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{getTimeLabel(n.createdAt)}</span>
              </div>
              {!n.read && (
                <div className="w-2 h-2 rounded-full bg-delphi-keppel mt-2 shrink-0" />
              )}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button 
                  onClick={(e) => handleMarkAsRead(n.id, e)}
                  aria-label="Marcar como leída" 
                  className="p-1.5 bg-white rounded-lg shadow-sm border border-slate-100 text-slate-400 hover:text-delphi-keppel"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={(e) => handleDeleteNotification(n.id, e)}
                  aria-label="Eliminar" 
                  className="p-1.5 bg-white rounded-lg shadow-sm border border-slate-100 text-slate-400 hover:text-delphi-giants"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {notifications.length > 0 && (
        <div className="p-4 border-t border-slate-50 bg-slate-50/20 text-center">
          <button 
            onClick={handleMarkAllAsRead} 
            className="text-[10px] font-black uppercase tracking-[0.2em] text-delphi-keppel hover:underline btn-base"
          >
            Marcar todas como leídas
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
