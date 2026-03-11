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
import ProjectList from './components/ProjectList';
import ProjectDetail from './components/ProjectDetail';
import ReportGenerator from './components/ReportGenerator';
import Login from './components/Login';
import ProjectForm from './components/ProjectForm';
import AdminPanel from './components/AdminPanel';
import NotificationCenter from './components/NotificationCenter';
import { OnboardingTour } from './components/ui/OnboardingTour';
import { AppErrorBoundary } from './components/ui/AppErrorBoundary';
import { authService } from './services/authService';
import { projectService } from './services/projectService';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<'dashboard' | 'projects' | 'project-detail' | 'reports' | 'create-project' | 'admin'>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await authService.getMe();
        if (user) {
          setCurrentUser(user);
          const userProjects = await projectService.getProjects();
          setProjects(userProjects);
        }
      } catch (err) {
        console.error("Auth initialization failed:", err);
      } finally {
        setIsInitializing(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
  };

  if (isInitializing) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={async (u) => {
      setCurrentUser(u);
      setIsInitializing(true);
      try {
        const p = await projectService.getProjects();
        setProjects(p);
      } finally {
        setIsInitializing(false);
      }
    }} />;
  }

  const navigateToProject = (id: string) => {
    setSelectedProjectId(id);
    setView('project-detail');
    setIsSidebarOpen(false);
  };

  const handleCreateProject = async (newProjectData: Project) => {
    try {
      setIsInitializing(true);
      const created = await projectService.createProject(newProjectData);
      setProjects([created, ...projects]);
      setView('projects');
    } catch (err) {
      console.error(err);
      alert('Error creating project');
    } finally {
      setIsInitializing(false);
    }
  };

  const isFacilitator = currentUser.role === UserRole.FACILITATOR || currentUser.role === UserRole.ADMIN;
  const isAdmin = currentUser.role === UserRole.ADMIN;
  const isExpert = currentUser.role === UserRole.EXPERT;

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = [
    { label: 'Proyectos', val: projects.length.toString(), icon: FolderKanban, color: 'keppel' },
    { label: 'Activos', val: projects.filter(p => p.status === 'activo').length.toString(), icon: Zap, color: 'orange' },
    { label: 'Pendientes', val: projects.filter(p => !p.status || p.status === 'pending').length.toString(), icon: Clock, color: 'celadon' },
    { label: 'Equipo', val: 'UCE', icon: Users, color: 'giants' },
  ];

  const NavButton = ({ target, icon: Icon, label, color = 'keppel' }: { target: any, icon: any, label: string, color?: string }) => {
    const isActive = view === target || (target === 'projects' && (view === 'project-detail' || view === 'create-project'));
    return (
      <button
        onClick={() => { setView(target); setIsSidebarOpen(false); }}
        aria-current={isActive ? 'page' : undefined}
        className={`flex items-center gap-4 w-full px-5 py-3.5 rounded-2xl transition-all ${isActive ? `bg-delphi-${color} text-white shadow-xl shadow-delphi-${color}/30 scale-[1.02]` : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
      >
        <Icon className="w-5 h-5" />
        <span className="font-black text-sm">{label}</span>
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-800 relative">
      {/* Overlay para móvil */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Responsive */}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-slate-900 text-white flex flex-col shadow-2xl z-50 transition-transform duration-300 transform lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-delphi-keppel p-2.5 rounded-2xl shadow-lg shadow-delphi-keppel/20">
              <BrainCircuit className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight leading-none">DelphiPro</h1>
              <p className="text-[9px] uppercase tracking-[0.2em] text-delphi-celadon font-black mt-1">UCE Engineering</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 p-6 space-y-2 mt-4 overflow-y-auto">
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
          <div className="p-5 rounded-3xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-delphi flex items-center justify-center font-black text-white shadow-inner text-lg shrink-0">
                {currentUser.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black truncate">{currentUser.name}</p>
                <p className="text-[10px] text-delphi-celadon font-black uppercase tracking-widest truncate">{currentUser.role}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowProfileModal(true)}
                className="flex-1 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 transition-colors text-[10px] font-black uppercase tracking-widest"
              >
                Perfil
              </button>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl bg-delphi-giants/20 text-delphi-giants hover:bg-delphi-giants hover:text-white transition-all"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative w-full">
        {/* Header Responsive */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 md:px-10 shrink-0 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-delphi-keppel/10 hover:text-delphi-keppel transition-all"
              aria-label="Abrir menú"
              aria-expanded={isSidebarOpen}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative group hidden sm:block">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-delphi-keppel transition-colors" />
              <input
                type="text"
                placeholder="Buscar proyectos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Buscar proyectos o tareas"
                className="pl-11 pr-6 py-2.5 bg-slate-100 border-none rounded-2xl text-xs font-bold w-40 lg:w-64 focus:ring-2 focus:ring-delphi-keppel/30 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-delphi-keppel/10 hover:text-delphi-keppel transition-all"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-delphi-giants border-2 border-white rounded-full"></span>
            </button>
            <div className="h-8 w-px bg-slate-200 hidden xs:block" />
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-delphi-keppel bg-delphi-keppel/5 px-3 md:px-5 py-2.5 rounded-2xl border border-delphi-keppel/10">
              <ShieldCheck className="w-4 h-4" />
              <span className="hidden md:inline">Sesión Segura UCE</span>
              <span className="md:hidden">Secure</span>
            </div>
          </div>
        </header>

        {showNotifications && (
          <NotificationCenter onClose={() => setShowNotifications(false)} />
        )}

        {isFacilitator && <OnboardingTour />}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 relative custom-scrollbar">
          <AppErrorBoundary>
            {view === 'dashboard' && (
              <div className="max-w-7xl mx-auto space-y-8 md:space-y-12">
                <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1">
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                      {isExpert ? 'Panel del Experto' : 'Métrica General'}
                    </h2>
                    <p className="text-slate-400 text-base md:text-lg font-medium">Hola, {currentUser.name.split(' ')[0]}. Gestiona tus sesiones Delphi.</p>
                  </div>
                  {isFacilitator && (
                    <button
                      onClick={() => setView('create-project')}
                      className="bg-delphi-keppel text-white px-8 py-4 rounded-[1.5rem] flex items-center justify-center gap-3 font-black shadow-2xl shadow-delphi-keppel/30 hover:scale-[1.02] active:scale-95 transition-all w-full md:w-auto"
                    >
                      <Plus className="w-6 h-6" />
                      Nueva Sesión
                    </button>
                  )}
                </section>

                {/* Stats Grid Responsive */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-8">
                  {stats.map((s, i) => (
                    <div key={i} className={`bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 hover:shadow-xl transition-all group`}>
                      <div className={`bg-delphi-${s.color}/10 p-3 md:p-4 rounded-2xl text-delphi-${s.color} w-fit mb-4 group-hover:bg-delphi-${s.color} group-hover:text-white transition-all`}>
                        <s.icon className="w-6 h-6 md:w-8 md:h-8" />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                      <p className="text-3xl md:text-4xl font-black text-slate-900 mt-1">{s.val}</p>
                    </div>
                  ))}
                </div>

                {/* Responsive Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-[2rem] md:rounded-[3rem] border border-slate-100 p-6 md:p-10 shadow-sm">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl md:text-2xl font-black tracking-tight">Proyectos Recientes</h3>
                        <button onClick={() => setView('projects')} className="text-delphi-keppel font-black text-xs uppercase tracking-widest hover:underline">Ver todo</button>
                      </div>
                      <ProjectList projects={filteredProjects} onProjectSelect={navigateToProject} />
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                      <h3 className="text-lg font-black mb-6 flex items-center gap-3">
                        <Clock className="w-5 h-5 text-delphi-keppel" />
                        Auditoría Reciente
                      </h3>
                      <div className="space-y-6">
                        {[
                          { t: '12:45', msg: 'Ronda cerrada', dot: 'keppel' },
                          { t: '11:20', msg: 'Nuevo experto', dot: 'orange' },
                          { t: '09:15', msg: 'Reporte listo', dot: 'celadon' },
                        ].map((log, i) => (
                          <div key={i} className="flex gap-4 items-start">
                            <span className="text-[10px] font-black text-slate-500 w-10 shrink-0">{log.t}</span>
                            <div className={`w-1.5 h-1.5 rounded-full bg-delphi-${log.dot} mt-1.5`} />
                            <p className="text-xs font-medium text-slate-400 leading-relaxed truncate">{log.msg}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-delphi-vanilla p-8 rounded-[2.5rem] border border-delphi-orange/20">
                      <Zap className="w-10 h-10 text-delphi-orange mb-6" />
                      <h3 className="text-lg font-black text-slate-900 mb-2">IA Tip</h3>
                      <p className="text-slate-600 text-sm font-medium leading-relaxed">
                        Divergencia detectada en el Módulo de Seguridad. Revise justificaciones de E1.
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
                <ReportGenerator />
              </div>
            )}

            {view === 'admin' && (
              <div className="max-w-7xl mx-auto">
                <AdminPanel />
              </div>
            )}
          </AppErrorBoundary>
        </div>

        {/* Profile Modal */}
        {showProfileModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowProfileModal(false)} />
            <div className="bg-white w-full max-w-md rounded-[3rem] p-10 relative shadow-2xl animate-in zoom-in duration-300">
              <button onClick={() => setShowProfileModal(false)} className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-900">
                <X className="w-6 h-6" />
              </button>
              <div className="text-center">
                <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-delphi mx-auto flex items-center justify-center text-white text-3xl font-black mb-6 shadow-xl">
                  {currentUser.name.charAt(0)}
                </div>
                <h3 className="text-2xl font-black text-slate-900">{currentUser.name}</h3>
                <p className="text-delphi-keppel font-black uppercase tracking-widest text-xs mt-1">{currentUser.role}</p>
                <p className="text-slate-400 font-medium text-sm mt-4">{currentUser.email}</p>
                
                <div className="mt-10 pt-8 border-t border-slate-100 space-y-4">
                  <button className="w-full py-4 rounded-2xl bg-slate-100 text-slate-900 font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">
                    Cambiar Contraseña
                  </button>
                  <button onClick={handleLogout} className="w-full py-4 rounded-2xl bg-delphi-giants/10 text-delphi-giants font-black text-xs uppercase tracking-widest hover:bg-delphi-giants hover:text-white transition-all">
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
