import React from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './features/auth';
import { useAppState } from './shared/hooks/useAppState';
import { LoadingSpinner } from './shared/components/LoadingSpinner';
import { AppErrorBoundary } from './shared/components/AppErrorBoundary';
import { OnboardingTour } from './shared/components/OnboardingTour';
import NotificationCenter from './features/notifications/components/NotificationCenter';
import { AuthGate } from './shared/components/auth/AuthGate';
import { Sidebar } from './shared/components/layout/Sidebar';
import { Header } from './shared/components/layout/Header';
import { ProfileModal } from './shared/components/profile/ProfileModal';
import { AppRouter } from './AppRouter';
import { UserRole } from './types';

// Common wrapper for Toaster and global UI elements
const AppWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
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

const App: React.FC = () => {
  const { 
    currentUser, 
    isInitializing, 
    authView, 
    setAuthView, 
    login, 
    logout 
  } = useAuth();
  
  const state = useAppState(currentUser);

  if (isInitializing) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  const isFacilitator = currentUser?.role === UserRole.FACILITATOR || currentUser?.role === UserRole.ADMIN;

  return (
    <AppWrapper>
      <AuthGate 
        currentUser={currentUser} 
        authView={authView} 
        setAuthView={setAuthView} 
        login={login} 
        AppWrapper={AppWrapper}
      >
        <div className="flex h-screen bg-mesh overflow-hidden text-slate-800 relative font-inter">
          {/* Overlay for mobile */}
          {state.isSidebarOpen && (
            <div
              className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
              onClick={() => state.setIsSidebarOpen(false)}
            />
          )}

          <Sidebar 
            currentUser={currentUser!}
            view={state.view}
            setView={state.setView}
            isSidebarOpen={state.isSidebarOpen}
            setIsSidebarOpen={state.setIsSidebarOpen}
            logout={logout}
            setShowProfileModal={state.setShowProfileModal}
          />

          <main className="flex-1 flex flex-col overflow-hidden relative w-full">
            <Header 
              setIsSidebarOpen={state.setIsSidebarOpen}
              searchQuery={state.searchQuery}
              setSearchQuery={state.setSearchQuery}
              showNotifications={state.showNotifications}
              setShowNotifications={state.setShowNotifications}
              unreadNotifications={state.unreadNotifications}
            />

            {state.showNotifications && (
              <NotificationCenter
                onClose={() => state.setShowNotifications(false)}
                currentUserId={currentUser!.id}
              />
            )}

            {isFacilitator && <OnboardingTour />}

            <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 relative custom-scrollbar">
              <AppErrorBoundary>
                <AppRouter 
                  view={state.view}
                  setView={state.setView}
                  currentUser={currentUser!}
                  projects={state.projects}
                  selectedProjectId={state.selectedProjectId}
                  setSelectedProjectId={state.setSelectedProjectId}
                  searchQuery={state.searchQuery}
                  navigateToProject={state.navigateToProject}
                  handleCreateProject={state.handleCreateProject}
                />
              </AppErrorBoundary>
            </div>

            {state.showProfileModal && (
              <ProfileModal 
                currentUser={currentUser!}
                onClose={() => state.setShowProfileModal(false)}
                logout={logout}
              />
            )}
          </main>
        </div>
      </AuthGate>
    </AppWrapper>
  );
};

export default App;
