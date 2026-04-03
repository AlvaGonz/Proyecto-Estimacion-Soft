import React from 'react';
import { User } from '../../../types';
import { Login, RegisterPage } from '../../../features/auth';

interface AuthGateProps {
  currentUser: User | null;
  authView: 'login' | 'register';
  setAuthView: (view: 'login' | 'register') => void;
  login: (user: User) => void;
  children: React.ReactNode;
  AppWrapper: React.FC<{ children: React.ReactNode }>;
}

export const AuthGate: React.FC<AuthGateProps> = ({
  currentUser,
  authView,
  setAuthView,
  login,
  children,
  AppWrapper
}) => {
  if (!currentUser) {
    if (authView === 'register') {
      return (
        <AppWrapper>
          <RegisterPage
            onRegister={async (u) => login(u)}
            onGoToLogin={() => setAuthView('login')}
          />
        </AppWrapper>
      );
    }
    return (
      <AppWrapper>
        <Login onGoToRegister={() => setAuthView('register')} onLogin={async (u) => login(u)} />
      </AppWrapper>
    );
  }

  return <>{children}</>;
};
