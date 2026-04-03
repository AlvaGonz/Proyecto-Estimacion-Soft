import { useState, useEffect } from 'react';
import { Project, User } from '../../types';
import { projectService } from '../../features/projects/services/projectService';
import { notificationService } from '../../features/notifications/services/notificationService';
import { toast } from 'react-hot-toast';

export type AppView = 'dashboard' | 'projects' | 'project-detail' | 'reports' | 'create-project' | 'admin';

export const useAppState = (currentUser: User | null) => {
  const [view, setView] = useState<AppView>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (currentUser) {
      projectService.getProjects()
        .then(setProjects)
        .catch(err => {
          console.error("Error loading projects on init:", err);
          if (err.status !== 401) {
            toast.error('Error al cargar proyectos');
          }
        });
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    const updateUnreadCount = () => {
      const notifs = notificationService.getNotifications();
      const unreadForUser = notifs.filter(
        n => !n.read && (!n.targetUserId || n.targetUserId === currentUser.id)
      ).length;
      setUnreadNotifications(unreadForUser);
    };

    updateUnreadCount();
    window.addEventListener('notifications_updated', updateUnreadCount);

    const onUnauthorized = () => {
      localStorage.removeItem('estimapro_auth');
      toast.error('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.', {
        id: 'session-expired',
        duration: 5000
      });
      setView('dashboard');
    };

    window.addEventListener('auth:unauthorized', onUnauthorized);

    return () => {
      window.removeEventListener('notifications_updated', updateUnreadCount);
      window.removeEventListener('auth:unauthorized', onUnauthorized);
    };
  }, [currentUser]);

  const navigateToProject = (id: string) => {
    setSelectedProjectId(id);
    setView('project-detail');
    setIsSidebarOpen(false);
  };

  const handleCreateProject = async (newProjectData: Project, tasks?: Array<{ id: string; title: string; description: string }>) => {
    try {
      const created = await projectService.createProject(newProjectData);

      if (tasks && tasks.length > 0) {
        const taskResults = await Promise.allSettled(
          tasks
            .filter(t => t.title.trim().length > 0)
            .map(t =>
              projectService.createTask(created.id, {
                title: t.title.trim(),
                description: t.description?.trim() || 'Sin descripción proporcionada.',
              })
            )
        );
        const failedCount = taskResults.filter(r => r.status === 'rejected').length;
        if (failedCount > 0) {
          console.warn(`[RF008] ${failedCount}/${tasks.length} task(s) failed to save`);
        }
      }

      setProjects(prev => [created, ...prev]);
      setView('projects');

      if (currentUser) {
        created.expertIds.forEach(expertId => {
          const idStr = typeof expertId === 'string' ? expertId : (expertId as any).id || (expertId as any)._id;
          if (String(idStr) !== String(currentUser.id)) {
            notificationService.addNotification({
              type: 'project_invite',
              message: `Has sido invitado al proyecto "${created.name}".`,
              projectId: created.id,
              targetUserId: String(idStr)
            });
          }
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al crear el proyecto');
    }
  };

  return {
    view,
    setView,
    selectedProjectId,
    setSelectedProjectId,
    projects,
    setProjects,
    showNotifications,
    setShowNotifications,
    isSidebarOpen,
    setIsSidebarOpen,
    searchQuery,
    setSearchQuery,
    showProfileModal,
    setShowProfileModal,
    unreadNotifications,
    navigateToProject,
    handleCreateProject
  };
};
