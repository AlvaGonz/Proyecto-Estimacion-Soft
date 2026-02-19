
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FolderKanban, 
  BarChart3, 
  LogOut, 
  LayoutDashboard, 
  Plus, 
  ChevronRight,
  ShieldCheck,
  BrainCircuit,
  MessageSquare,
  Clock,
  Settings,
  Bell,
  Search,
  Zap,
  ShieldAlert,
  UserPlus,
  AlertCircle
} from 'lucide-react';
import { User, UserRole, Project } from './types';
import ProjectList from './components/ProjectList';
import ProjectDetail from './components/ProjectDetail';
import ReportGenerator from './components/ReportGenerator';
import Login from './components/Login';
import ProjectForm from './components/ProjectForm';
import AdminPanel from './components/AdminPanel';
import NotificationCenter from './components/NotificationCenter';

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Migración a Microservicios Core',
    description: 'Estimación del esfuerzo para desacoplar el monolito bancario.',
    unit: 'Horas',
    facilitatorId: 'u1',
    expertIds: ['u2', 'u3', 'u4'],
    status: 'Activo',
    createdAt: Date.now() - 86400000 * 5
  },
  {
    id: 'p2',
    name: 'Rediseño App Móvil V2',
    description: 'Estimación de puntos de historia para el nuevo diseño UI/UX.',
    unit: 'Puntos de Historia',
    facilitatorId: 'u1',
    expertIds: ['u2', 'u5'],
    status: 'Activo',
    createdAt: Date.now() - 86400000 * 2
  }
];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<'dashboard' | 'projects' | 'project-detail' | 'reports' | 'create-project' | 'admin'>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [showNotifications, setShowNotifications] = useState(false);

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} />;
  }

  const navigateToProject = (id: string) => {
    setSelectedProjectId(id);
    setView('project-detail');
  };

  const handleCreateProject = (newProject: Project) => {
    setProjects([newProject, ...projects]);
    setView('projects');
  };

  const isFacilitator = currentUser.role === UserRole.FACILITATOR || currentUser.role === UserRole.ADMIN;
  const isAdmin = currentUser.role === UserRole.ADMIN;
  const isExpert = currentUser.role === UserRole.EXPERT;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-800">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col shadow-2xl z-30">
        <div className="p-8 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-4">
            <div className="bg-delphi-keppel p-2.5 rounded-2xl shadow-lg shadow-delphi-keppel/20">
              <BrainCircuit className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight leading-none">DelphiPro</h1>
              <p className="text-[9px] uppercase tracking-[0.2em] text-delphi-celadon font-black mt-1">UCE Engineering</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-2 mt-4">
          <button 
            onClick={() => setView('dashboard')}
            className={`flex items-center gap-4 w-full px-5 py-3.5 rounded-2xl transition-all ${view === 'dashboard' ? 'bg-delphi-keppel text-white shadow-xl shadow-delphi-keppel/30 scale-[1.02]' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-black text-sm">Dashboard</span>
          </button>
          <button 
            onClick={() => setView('projects')}
            className={`flex items-center gap-4 w-full px-5 py-3.5 rounded-2xl transition-all ${view === 'projects' || view === 'project-detail' || view === 'create-project' ? 'bg-delphi-keppel text-white shadow-xl shadow-delphi-keppel/30 scale-[1.02]' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <FolderKanban className="w-5 h-5" />
            <span className="font-black text-sm">Proyectos</span>
          </button>
          
          {isFacilitator && (
            <button 
              onClick={() => setView('reports')}
              className={`flex items-center gap-4 w-full px-5 py-3.5 rounded-2xl transition-all ${view === 'reports' ? 'bg-delphi-keppel text-white shadow-xl shadow-delphi-keppel/30 scale-[1.02]' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="font-black text-sm">Reportes</span>
            </button>
          )}

          {isAdmin && (
            <button 
              onClick={() => setView('admin')}
              className={`flex items-center gap-4 w-full px-5 py-3.5 rounded-2xl transition-all ${view === 'admin' ? 'bg-delphi-giants text-white shadow-xl shadow-delphi-giants/30 scale-[1.02]' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <ShieldAlert className="w-5 h-5" />
              <span className="font-black text-sm">Administración</span>
            </button>
          )}
        </nav>

        <div className="p-6 space-y-4">
          <div className="p-5 rounded-3xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-delphi flex items-center justify-center font-black text-white shadow-inner text-lg">
                {currentUser.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black truncate">{currentUser.name}</p>
                <p className="text-[10px] text-delphi-celadon font-black uppercase tracking-widest">{currentUser.role}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 transition-colors text-[10px] font-black uppercase tracking-widest">
                Perfil
              </button>
              <button 
                onClick={() => setCurrentUser(null)}
                className="p-2 rounded-xl bg-delphi-giants/20 text-delphi-giants hover:bg-delphi-giants hover:text-white transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-10 shrink-0 z-20">
          <div className="flex items-center gap-4">
            <div className="relative group hidden md:block">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-delphi-keppel transition-colors" />
              <input 
                type="text" 
                placeholder="Buscar en el sistema..." 
                className="pl-11 pr-6 py-2.5 bg-slate-100 border-none rounded-2xl text-xs font-bold w-64 focus:ring-2 focus:ring-delphi-keppel/30 transition-all outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-delphi-keppel/10 hover:text-delphi-keppel transition-all"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-delphi-giants border-2 border-white rounded-full animate-bounce"></span>
            </button>
            <div className="h-8 w-px bg-slate-200" />
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-delphi-keppel bg-delphi-keppel/5 px-5 py-2.5 rounded-2xl border border-delphi-keppel/10">
              <ShieldCheck className="w-4 h-4" />
              Sesión Segura UCE
            </div>
          </div>
        </header>

        {showNotifications && (
          <NotificationCenter onClose={() => setShowNotifications(false)} />
        )}

        <div className="flex-1 overflow-y-auto p-10 relative custom-scrollbar">
          {view === 'dashboard' && (
            <div className="max-w-7xl mx-auto space-y-12">
              <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-5xl font-black text-slate-900 tracking-tight leading-tight">
                    {isExpert ? 'Panel del Experto' : 'Métrica General'}
                  </h2>
                  <p className="text-slate-400 mt-2 text-xl font-medium">Bienvenido {currentUser.name}, gestiona tus estimaciones UCE.</p>
                </div>
                {isFacilitator && (
                  <button 
                    onClick={() => setView('create-project')}
                    className="bg-delphi-keppel text-white px-8 py-4 rounded-[1.5rem] flex items-center gap-3 font-black shadow-2xl shadow-delphi-keppel/30 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    <Plus className="w-6 h-6" />
                    Nueva Sesión
                  </button>
                )}
              </section>

              {/* Stats Cards - Contextualized for roles (RF026/RF027) */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {[
                  { label: 'Mis Proyectos', val: projects.length.toString(), icon: FolderKanban, color: 'keppel' },
                  { label: isExpert ? 'Tareas Pendientes' : 'Rondas Activas', val: isExpert ? '03' : '04', icon: isExpert ? AlertCircle : Clock, color: 'orange' },
                  { label: 'Convergencia Prom.', val: '88%', icon: Zap, color: 'celadon' },
                  { label: 'Participación', val: '92%', icon: Users, color: 'giants' },
                ].map((s, i) => (
                  <div key={i} className={`bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-slate-200/50 transition-all group`}>
                    <div className={`bg-delphi-${s.color}/10 p-4 rounded-2xl text-delphi-${s.color} w-fit mb-6 group-hover:bg-delphi-${s.color} group-hover:text-white transition-all`}>
                      <s.icon className="w-8 h-8" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{s.label}</p>
                    <p className="text-5xl font-black text-slate-900 mt-2">{s.val}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm">
                    <div className="flex items-center justify-between mb-10">
                      <h3 className="text-2xl font-black tracking-tight">
                        {isExpert ? 'Mis Tareas por Estimar' : 'Actividad de Proyectos'}
                      </h3>
                      <button onClick={() => setView('projects')} className="text-delphi-keppel font-black text-sm uppercase tracking-widest hover:underline">Ver todo</button>
                    </div>
                    <ProjectList projects={projects} onProjectSelect={navigateToProject} />
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                    <h3 className="text-xl font-black mb-8 relative z-10 flex items-center gap-3">
                      <Clock className="w-6 h-6 text-delphi-keppel" />
                      Historial de Acciones (RF029)
                    </h3>
                    <div className="space-y-6 relative z-10">
                      {[
                        { t: '12:45', msg: 'Ronda 2 cerrada - Proyecto Microservicios', dot: 'keppel' },
                        { t: '11:20', msg: 'Nuevo experto asignado: J. Pérez', dot: 'orange' },
                        { t: '09:15', msg: 'Reporte de QA generado por Admin', dot: 'celadon' },
                        { t: 'Ayer', msg: 'Sesión de Kickoff finalizada con éxito', dot: 'vanilla' },
                      ].map((log, i) => (
                        <div key={i} className="flex gap-4 items-start group/item">
                          <span className="text-[10px] font-black text-slate-500 w-10 shrink-0 mt-1">{log.t}</span>
                          <div className={`w-1.5 h-1.5 rounded-full bg-delphi-${log.dot} mt-2 group-hover/item:scale-150 transition-transform`} />
                          <p className="text-xs font-medium text-slate-400 group-hover/item:text-white transition-colors leading-relaxed">{log.msg}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-delphi-vanilla p-10 rounded-[3rem] border border-delphi-orange/20">
                    <div className="bg-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg mb-6">
                      <Zap className="w-8 h-8 text-delphi-orange" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2 leading-none">Mejora Continua</h3>
                    <p className="text-slate-600 text-sm font-medium leading-relaxed">
                      El sistema detectó una divergencia recurrente en el Módulo de Seguridad. Sugerimos revisar la documentación técnica.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'projects' && (
            <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header className="flex items-center justify-between mb-12">
                <h2 className="text-5xl font-black tracking-tight">Proyectos de Estimación</h2>
                {isFacilitator && (
                  <button 
                    onClick={() => setView('create-project')}
                    className="bg-delphi-keppel text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-black shadow-lg shadow-delphi-keppel/20 hover:scale-105 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    Nuevo
                  </button>
                )}
              </header>
              <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100">
                <ProjectList projects={projects} onProjectSelect={navigateToProject} />
              </div>
            </div>
          )}

          {view === 'project-detail' && selectedProjectId && (
            <div className="max-w-6xl mx-auto">
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
        </div>
      </main>
    </div>
  );
};

export default App;
