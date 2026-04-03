import React from 'react';
import { 
  FolderKanban, 
  Clock, 
  Zap, 
  Users, 
  Plus
} from 'lucide-react';
import { AppView } from './shared/hooks/useAppState';
import { Project, User, UserRole } from './types';
import { STATUS_LABELS } from './shared/constants/status';
import { EmptyState } from './shared/components/EmptyState';
import { LoadingSpinner } from './shared/components/LoadingSpinner';
import { Breadcrumbs } from './shared/components/Breadcrumbs';

// Lazy loaded components
const ProjectList = React.lazy(() => import('./features/projects/components/ProjectList'));
const ProjectDetail = React.lazy(() => import('./features/projects/components/ProjectDetail'));
const ReportGenerator = React.lazy(() => import('./features/reports/components/ReportGenerator'));
const ProjectForm = React.lazy(() => import('./features/projects/components/ProjectForm'));
const AdminPanel = React.lazy(() => import('./features/users/components/AdminPanel'));

interface AppRouterProps {
  view: AppView;
  setView: (view: AppView) => void;
  currentUser: User;
  projects: Project[];
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  searchQuery: string;
  navigateToProject: (id: string) => void;
  handleCreateProject: (newProjectData: Project, tasks?: any[]) => Promise<void>;
}

export const AppRouter: React.FC<AppRouterProps> = ({
  view,
  setView,
  currentUser,
  projects,
  selectedProjectId,
  setSelectedProjectId,
  searchQuery,
  navigateToProject,
  handleCreateProject
}) => {
  const isFacilitator = currentUser.role === UserRole.FACILITATOR || currentUser.role === UserRole.ADMIN;
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

  return (
    <>
      <Breadcrumbs 
        view={view} 
        projects={projects} 
        selectedProjectId={selectedProjectId} 
        onNavigate={(v) => {
          setView(v);
          if (v !== 'project-detail') setSelectedProjectId(null);
        }} 
      />
      
      <React.Suspense fallback={
        <div className="flex items-center justify-center p-20 animate-in fade-in duration-700">
          <LoadingSpinner size="lg" label="Cargando vista..." />
        </div>
      }>
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

            {/* Stats Grid */}
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
      </React.Suspense>
    </>
  );
};
