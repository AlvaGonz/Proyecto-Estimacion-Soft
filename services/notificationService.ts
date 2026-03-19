
export interface Notification {
  id: string;
  type: 'project_invite' | 'round_opened' | 'round_closed' | 'consensus_reached' | 'system';
  message: string;
  projectId?: string;
  createdAt: number;
  read: boolean;
}

class NotificationService {
  private STORAGE_KEY = 'estimapro_notifications';

  getNotifications(): Notification[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse notifications', e);
      return [];
    }
  }

  saveNotifications(notifications: Notification[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notifications));
    // Dispatch custom event to notify listeners in the same window
    window.dispatchEvent(new CustomEvent('notifications_updated'));
  }

  addNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) {
    const notifications = this.getNotifications();
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substring(2, 9),
      createdAt: Date.now(),
      read: false
    };
    this.saveNotifications([newNotification, ...notifications]);
  }

  markAsRead(id: string) {
    const notifications = this.getNotifications();
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    this.saveNotifications(updated);
  }

  markAllAsRead() {
    const notifications = this.getNotifications();
    const updated = notifications.map(n => ({ ...n, read: true }));
    this.saveNotifications(updated);
  }

  deleteNotification(id: string) {
    const notifications = this.getNotifications();
    const filtered = notifications.filter(n => n.id !== id);
    this.saveNotifications(filtered);
  }

  clearAll() {
    this.saveNotifications([]);
  }
}

export const notificationService = new NotificationService();
