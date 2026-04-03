import React, { useState, useEffect } from 'react';
import {
  Users,
  FolderKanban,
  BarChart3,
  LogOut,
  LayoutDashboard,
  Plus,
  ShieldCheck,
  BrainCircuit,
  Clock,
  Bell,
  Search,
  Zap,
  ShieldAlert,
  AlertCircle,
  Menu,
  X
} from 'lucide-react';
import { User, UserRole, Project } from './types';
import ProjectList from './features/projects/components/ProjectList';
import ProjectDetail from './features/projects/components/ProjectDetail';
import ReportGenerator from './features/reports/components/ReportGenerator';
import ProjectForm from './features/projects/components/ProjectForm';
import AdminPanel from './features/users/components/AdminPanel';
import NotificationCenter from './features/notifications/components/NotificationCenter';
import { OnboardingTour } from './shared/components/OnboardingTour';
import { AppErrorBoundary } from './shared/components/AppErrorBoundary';
import { projectService } from './features/projects/services/projectService';
import { EmptyState } from './shared/components/EmptyState';
import { LoadingSpinner } from './shared/components/LoadingSpinner';
import { FloatingHelpButton } from './shared/components/FloatingHelpButton';
import { notificationService } from './features/notifications/services/notificationService';
import { Toaster, toast } from 'react-hot-toast';
import { Login, RegisterPage, useAuth } from './features/auth';

const STATUS_LABELS = {
  'preparation': 'Preparación',
  'kickoff': 'Kickoff',
  'active': 'Activo',
  'finished': 'Finalizado',
  'archived': 'Archivado'
} as const;

const App: React.FC = () => {
  const { 
    currentUser, 
    isInitializing, 
    authView, 
    setAuthView, 
    login, 
    logout 
  } = useAuth();
  
  const [view, setView] = useState<'dashboard' | 'projects' | 'project-detail' | 'reports' | 'create-project' | 'admin'>('dashboard');
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

    // Notifications Logic for Red Dot — uses static import, no re-eval on each render
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
        id: 'session-expired', // Prevent stacking (amontonados)
        duration: 5000
      });
      setView('dashboard'); // Reset view to home
    };

    window.addEventListener('auth:unauthorized', onUnauthorized);

    return () => {
      window.removeEventListener('notifications_updated', updateUnreadCount);
      window.removeEventListener('auth:unauthorized', onUnauthorized);
    };
  }, [currentUser]);

  if (isInitializing) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // Common wrapper for Toaster and global UI elements
  const AppWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-slate-50 font-inter">
      <Toaster position="top-right" toastOptions={{
        duration: 4000,
        style: {
          background: '#fff',
          color: '#334155',
          borderRadius: '1.5rem',
          padding: '1rem 1.5rem',
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
          fontWeight: '600',
          border: '1px solid #f1f5f9',
          zIndex: 9999
        },
        success: {
          iconTheme: { primary: 'hsl(171, 62%, 45%)', secondary: '#fff' }
        },
        error: {
          iconTheme: { primary: 'hsl(15, 95%, 59%)', secondary: '#fff' }
        }
      }} />
      {children}
    </div>
  );

  if (!currentUser) {
    if (authView === 'register') {
      return (
        <AppWrapper>
          <RegisterPage
            onRegister={async (u) => {
              login(u);
            }}
            onGoToLogin={() => setAuthView('login')}
          />
        </AppWrapper>
      );
    }
    return (
      <AppWrapper>
        <Login onGoToRegister={() => setAuthView('register')} onLogin={async (u) => {
          login(u);
        }} />
      </AppWrapper>
    );
  }

  const navigateToProject = (id: string) => {
    setSelectedProjectId(id);
    setView('project-detail');
    setIsSidebarOpen(false);
  };

  const handleCreateProject = async (newProjectData: Project, tasks?: Array<{ id: string; title: string; description: string }>) => {
    try {
      const created = await projectService.createProject(newProjectData);

      // RF008: Persist wizard tasks in the backend
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

      setProjects([created, ...projects]);
      setView('projects');

      // RF025: Notificar a cada experto asignado, excepto al facilitador (redundancia)
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
    } catch (err) {
      console.error(err);
      toast.error('Error al crear el proyecto');
    }
  };

  const isFacilitator = currentUser.role === UserRole.FACILITATOR || currentUser.role === UserRole.ADMIN;
  const isAdmin = currentUser.role === UserRole.ADMIN;
  const isExpert = currentUser.role === UserRole.EXPERT;

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = projects.filter(p => p.status === 'active' || p.status === 'kickoff').length;
  const finishedCount = projects.filter(p => p.status === 'finished').length;
  const totalCount = projects.filter(p => p.status !== 'archived').length;
  const consensusRate = totalCount > 0 ? Math.round((finishedCount / totalCount) * 100) : 0;

  const stats = [
    { label: 'Proyectos', val: totalCount.toString(), icon: FolderKanban, color: 'keppel' },
    { label: 'Activos', val: activeCount.toString(), icon: Clock, color: 'orange' },
    { label: 'Consenso', val: `${consensusRate}%`, icon: Zap, color: 'celadon' },
    { label: 'Finalizados', val: finishedCount.toString(), icon: Users, color: 'giants' },
  ];

  const NavButton = ({ target, icon: Icon, label, color = 'keppel' }: { target: any, icon: any, label: string, color?: string }) => {
    const isActive = view === target || (target === 'projects' && (view === 'project-detail' || view === 'create-project'));
    return (
      <button
        onClick={() => { setView(target); setIsSidebarOpen(false); }}
        aria-current={isActive ? 'page' : undefined}
        className={`flex items-center gap-4 w-full px-5 py-3.5 rounded-2xl transition-all duration-300 relative group ${isActive
            ? `bg-delphi-${color}/10 text-white shadow-lg shadow-delphi-${color}/5 border border-delphi-${color}/30`
            : 'text-slate-400 hover:bg-white/5 hover:text-white'
          }`}
      >
        {isActive && (
          <div className={`absolute left-0 w-1.5 h-6 bg-delphi-${color} rounded-r-full animate-in slide-in-from-left-2 duration-300`} />
        )}
        <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? `text-delphi-${color} scale-110` : 'group-hover:scale-110'}`} />
        <span className={`font-bold text-sm tracking-tight ${isActive ? 'text-white' : ''}`}>{label}</span>
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-mesh overflow-hidden text-slate-800 relative font-inter">
      <Toaster position="top-right" toastOptions={{
        duration: 4000,
        style: {
          background: '#fff',
          color: '#334155',
          borderRadius: '1.5rem',
          padding: '1rem 1.5rem',
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
          fontWeight: '600',
          border: '1px solid #f1f5f9'
        },
        success: {
          iconTheme: { primary: 'hsl(171, 62%, 45%)', secondary: '#fff' }
        },
        error: {
          iconTheme: { primary: 'hsl(15, 95%, 59%)', secondary: '#fff' }
        }
      }} />
      {/* Overlay para móvil */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Responsive - Premium Glassmorphism */}
      <aside className={`fixed inset-y-0 left-0 w-72 glass-sidebar flex flex-col z-50 transition-transform duration-500 ease-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setView('dashboard')}>
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
          <NavButton target="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavButton target="projects" icon={FolderKanban} label="Proyectos" />

          {isFacilitator && (
            <NavButton target="reports" icon={BarChart3} label="Reportes" />
          )}

          {isAdmin && (
            <NavButton target="admin" icon={ShieldAlert} label="Administración" color="giants" />
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

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative w-full">
        {/* Fixed Header - Glass Navbar */}
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

        {showNotifications && (
          <NotificationCenter
            onClose={() => setShowNotifications(false)}
            currentUserId={currentUser.id}
          />
        )}

        {isFacilitator && <OnboardingTour />}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 relative custom-scrollbar">
          <AppErrorBoundary>
            {view === 'dashboard' && (
              <div className="max-w-7xl mx-auto space-y-12 animate-reveal">
                <section className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="px-4 py-1.5 rounded-full bg-delphi-keppel/10 text-delphi-keppel text-[10px] font-black uppercase tracking-widest border border-delphi-keppel/20">
                        Resumen General
                      </span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter leading-tight">
                      {isExpert ? 'Panel del Experto' : 'Visión de Ingeniería'}
                    </h2>
                    <p className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl">
                      Hola, {currentUser.name.split(' ')[0]}. Verifica tus sesiones de estimación.
                    </p>
                  </div>
                  {isFacilitator && (
                    <button
                      onClick={() => setView('create-project')}
                      className="bg-delphi-keppel text-white px-10 py-5 rounded-[2rem] flex items-center justify-center gap-4 font-black shadow-2xl shadow-delphi-keppel/40 hover:scale-[1.05] active:scale-95 transition-all w-full md:w-auto hover:bg-delphi-keppel/90"
                    >
                      <Plus className="w-6 h-6" />
                      Nueva Sesión
                    </button>
                  )}
                </section>

                {/* Stats Grid - Premium Cards */}
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                  {stats.map((s, i) => (
                    <div
                      key={i}
                      className="glass-card p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] hover:translate-y-[-8px] transition-all duration-500 group relative overflow-hidden animate-reveal cursor-default"
                      style={{ animationDelay: `${i * 100 + 400}ms` }}
                    >
                      <div className={`absolute -right-4 -top-4 w-24 h-24 bg-delphi-${s.color}/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`} />
                      <div className={`bg-delphi-${s.color}/10 p-3 sm:p-4 rounded-xl sm:rounded-2xl w-fit mb-4 sm:mb-6 group-hover:bg-delphi-${s.color} group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-delphi-${s.color}/50 transition-all duration-300`}>
                        <s.icon className={`w-6 h-6 sm:w-8 sm:h-8 text-delphi-${s.color} group-hover:text-white transition-colors duration-300`} />
                      </div>
                      <p className="text-[9px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 sm:mb-2">{s.label}</p>
                      <p className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">{s.val}</p>
                    </div>
                  ))}
                </div>

                {/* Dashboard Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className="lg:col-span-2 space-y-10">
                    <div className="glass-card rounded-[3rem] p-8 md:p-12 animate-reveal" style={{ animationDelay: '800ms' }}>
                      <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                          <div className="w-1.5 h-8 bg-delphi-keppel rounded-full" />
                          <h3 className="text-2xl font-black tracking-tight text-slate-900">Sesiones Recientes</h3>
                        </div>
                        <button onClick={() => setView('projects')} className="bg-slate-100 hover:bg-delphi-keppel hover:text-white px-5 py-2.5 rounded-xl text-slate-600 font-bold text-[10px] uppercase tracking-widest transition-all">
                          Explorar Todo
                        </button>
                      </div>
                      <ProjectList projects={filteredProjects} onProjectSelect={navigateToProject} />
                    </div>
                  </div>

                  <div className="space-y-10">
                    <div className="glass-sidebar rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden animate-reveal" style={{ animationDelay: '1000ms' }}>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-delphi-keppel/20 blur-3xl rounded-full -mr-16 -mt-16" />
                      <h3 className="text-xl font-black mb-8 flex items-center gap-4 text-white">
                        <Clock className="w-6 h-6 text-delphi-keppel" />
                        Trazabilidad
                      </h3>
                      <div className="space-y-8 relative">
                        {projects.length > 0 ? [...projects]
                          .filter(p => p.status !== 'archived')
                          .sort((a, b) => b.createdAt - a.createdAt)
                          .slice(0, 4)
                          .map((p, i) => (
                            <div key={i} className="flex gap-5 items-start group">
                              <div className="flex flex-col items-center">
                                <div className={`w-3 h-3 rounded-full border-2 border-white/20 transition-all duration-300 group-hover:scale-150 ${p.status === 'active' ? 'bg-delphi-keppel border-delphi-keppel shadow-[0_0_12px_rgba(20,184,166,0.5)]' :
                                    p.status === 'kickoff' ? 'bg-delphi-orange' :
                                      p.status === 'finished' ? 'bg-delphi-celadon' :
                                        'bg-slate-600'}`} />
                                {i < 3 && <div className="w-px h-12 bg-white/10 mt-2" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">
                                  {new Date(p.createdAt).toLocaleDateString('es-DO', { month: 'short', day: 'numeric' })}
                                </p>
                                <p className="text-sm font-bold text-white leading-none truncate mb-2">{p.name}</p>
                                <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-1 rounded-md bg-white/5 border border-white/10 ${p.status === 'active' ? 'text-delphi-keppel' :
                                    p.status === 'kickoff' ? 'text-delphi-orange' :
                                      p.status === 'finished' ? 'text-delphi-celadon' :
                                        'text-slate-400'}`}>
                                  {STATUS_LABELS[p.status as keyof typeof STATUS_LABELS] || p.status}
                                </span>
                              </div>
                            </div>
                          )) : (
                          <div className="text-center py-12">
                            <EmptyState message="Sin actividad" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-delphi-vanilla to-delphi-orange/20 p-10 rounded-[3rem] border border-white/50 shadow-xl animate-reveal" style={{ animationDelay: '1200ms' }}>
                      <div className="bg-white/40 backdrop-blur-sm w-16 h-16 rounded-3xl flex items-center justify-center mb-8 shadow-inner border border-white/20">
                        <Zap className="w-8 h-8 text-delphi-orange" />
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tighter">AI Insight Pro</h3>
                      <p className="text-slate-600 text-sm font-medium leading-relaxed opacity-80">
                        {projects.filter(p => p.status === 'active').length > 0
                          ? `Identificamos ${projects.filter(p => p.status === 'active').length} sesión(es) activa(s). Sugerimos cerrar rondas con CV < 0.2 para mayor precisión.`
                          : projects.length === 0
                            ? 'Bienvenido al motor Delphi. Inicia tu primera sesión colaborativa ahora.'
                            : 'Análisis completo: Las desviaciones estándar muestran una convergencia récord en tu última semana.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {view === 'projects' && (
              <div className="max-w-6xl mx-auto space-y-8">
                <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <h2 className="text-3xl md:text-5xl font-black tracking-tight">Sesiones</h2>
                  {isFacilitator && (
                    <button
                      onClick={() => setView('create-project')}
                      className="bg-delphi-keppel text-white px-8 py-4 rounded-2xl flex items-center justify-center gap-2 font-black shadow-lg shadow-delphi-keppel/20 hover:scale-105 transition-all w-full sm:w-auto"
                    >
                      <Plus className="w-5 h-5" />
                      Nueva Sesión
                    </button>
                  )}
                </header>
                <div className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-sm border border-slate-100">
                  <ProjectList projects={filteredProjects} onProjectSelect={navigateToProject} />
                </div>
              </div>
            )}

            {view === 'project-detail' && selectedProjectId && (
              <div className="max-w-7xl mx-auto">
                <ProjectDetail
                  projectId={selectedProjectId}
                  onBack={() => setView('projects')}
                  role={currentUser.role}
                  currentUserId={currentUser.id}
                />
              </div>
            )}

            {view === 'create-project' && (
              <div className="max-w-4xl mx-auto">
                <ProjectForm onSubmit={handleCreateProject} onCancel={() => setView('projects')} />
              </div>
            )}

            {view === 'reports' && (
              <div className="max-w-6xl mx-auto">
                <ReportGenerator projects={projects} userRole={currentUser.role} />
              </div>
            )}

            {view === 'admin' && (
              <div className="max-w-7xl mx-auto">
                <AdminPanel currentUser={currentUser} />
              </div>
            )}
          </AppErrorBoundary>
        </div>

        {/* Profile Modal */}
        {showProfileModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowProfileModal(false)} />
            <div className="bg-white/95 backdrop-blur-2xl w-full max-w-sm rounded-[2.5rem] sm:rounded-[3rem] relative shadow-2xl animate-in zoom-in duration-300 overflow-hidden">
              {/* Gradient header band */}
              <div className="h-28 sm:h-32 bg-gradient-to-br from-delphi-keppel via-delphi-celadon/60 to-delphi-keppel/80 relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent_70%)]" />
                <button onClick={() => setShowProfileModal(false)} className="absolute top-5 right-5 p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-xl transition-all">
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
                  <button className="w-full py-3.5 sm:py-4 rounded-2xl bg-delphi-keppel/10 text-delphi-keppel font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-delphi-keppel hover:text-white transition-all duration-300 border border-delphi-keppel/20">
                    Cambiar Contraseña
                  </button>
                  <button onClick={logout} className="w-full py-3.5 sm:py-4 rounded-2xl bg-white text-delphi-giants font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-delphi-giants hover:text-white transition-all duration-300 border-2 border-delphi-giants/20">
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <FloatingHelpButton 
          onOpenTour={isFacilitator ? () => window.dispatchEvent(new CustomEvent('delphi:open-tour')) : undefined} 
        />
      </main>
    </div>
  );
};

export default App;
