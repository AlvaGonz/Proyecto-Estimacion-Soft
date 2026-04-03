import React from 'react';
import { LucideIcon } from 'lucide-react';
import { AppView } from '../../hooks/useAppState';

interface NavButtonProps {
  target: AppView;
  icon: LucideIcon;
  label: string;
  color?: string;
  currentView: AppView;
  onClick: (target: AppView) => void;
}

export const NavButton: React.FC<NavButtonProps> = ({ 
  target, 
  icon: Icon, 
  label, 
  color = 'keppel',
  currentView,
  onClick
}) => {
  const isActive = currentView === target || (target === 'projects' && (currentView === 'project-detail' || currentView === 'create-project'));
  
  return (
    <button
      onClick={() => onClick(target)}
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
