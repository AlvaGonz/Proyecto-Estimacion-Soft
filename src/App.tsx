import React from 'react';
import { UserRole } from './types';
import { Toaster } from 'react-hot-toast';
import { useAuth, Login, RegisterPage } from './features/auth';
import { useAppState } from './shared/hooks/useAppState';

// Layout components
import { Header } from './shared/components/layout/Header';
import { Sidebar } from './shared/components/layout/Sidebar';

// Feature components
import { DashboardView } from './features/dashboard/components/DashboardView';
import ProjectList from './features/projects/components/ProjectList';
import ProjectDetail from './features/projects/components/ProjectDetail';
import ReportGenerator from './features/reports/components/ReportGenerator';
import ProjectForm from './features/projects/components/ProjectForm';
import AdminPanel from './features/users/components/AdminPanel';
import NotificationCenter from './features/notifications/components/NotificationCenter';
import { ProfileModal } from './features/users/components/ProfileModal';

// Shared components
import { OnboardingTour } from './shared/components/OnboardingTour';
import { AppErrorBoundary } from './shared/components/AppErrorBoundary';
import { LoadingSpinner } from './shared/components/LoadingSpinner';
import { FloatingHelpButton } from './shared/components/FloatingHelpButton';

const App: React.FC = () => {
  const { 
    currentUser, 
    isInitializing, 
    authView, 
    setAuthView, 
    login, 
    logout 
  } = useAuth();
  
  const appState = useAppState(currentUser);
  
  const {
    view,
    setView,
    selectedProjectId,
    projects,
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
  } = appState;

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
            onRegister={login}
            onGoToLogin={() => setAuthView('login')}
          />
        </AppWrapper>
      );
    }
    return (
      <AppWrapper>
        <Login onGoToRegister={() => setAuthView('register')} onLogin={login} />
      </AppWrapper>
    );
  }

  const isFacilitator = currentUser.role === UserRole.FACILITATOR || currentUser.role === UserRole.ADMIN;
  const isExpert = currentUser.role === UserRole.EXPERT;

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <Sidebar 
        currentUser={currentUser}
        view={view}
        setView={setView}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        logout={logout}
        setShowProfileModal={setShowProfileModal}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative w-full">
        {/* Fixed Header - Glass Navbar */}
        <Header 
          setIsSidebarOpen={setIsSidebarOpen}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
          unreadNotifications={unreadNotifications}
        />

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
              <DashboardView 
                currentUser={currentUser}
                projects={projects}
                filteredProjects={filteredProjects}
                navigateToProject={navigateToProject}
                setView={setView}
                isFacilitator={isFacilitator}
                isExpert={isExpert}
              />
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
                <ProjectForm 
                  onSubmit={handleCreateProject} 
                  onCancel={() => setView('projects')} 
                  currentUser={currentUser}
                />
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
          <ProfileModal 
            currentUser={currentUser}
            onClose={() => setShowProfileModal(false)}
            onLogout={logout}
          />
        )}

        <FloatingHelpButton 
          onOpenTour={isFacilitator ? () => window.dispatchEvent(new CustomEvent('delphi:open-tour')) : undefined} 
        />
      </main>
    </div>
  );
};

export default App;
