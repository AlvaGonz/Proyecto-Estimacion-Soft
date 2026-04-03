import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Project } from '../../types';

interface BreadcrumbsProps {
  view: 'dashboard' | 'projects' | 'project-detail' | 'reports' | 'create-project' | 'admin';
  projects?: Project[];
  selectedProjectId?: string | null;
  onNavigate: (view: any) => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ 
  view, 
  projects = [], 
  selectedProjectId,
  onNavigate 
}) => {
  if (view === 'dashboard') return null;

  const getProjectName = () => {
    const project = projects.find(p => p.id === selectedProjectId);
    return project?.name || 'Proyecto';
  };

  const breadcrumbs = [];

  // Always add Home
  breadcrumbs.push({
    label: 'Dashboard',
    view: 'dashboard',
    icon: <Home className="w-3.5 h-3.5" />
  });

  if (view === 'projects') {
    breadcrumbs.push({ label: 'Proyectos', view: 'projects' });
  } else if (view === 'project-detail') {
    breadcrumbs.push({ label: 'Proyectos', view: 'projects' });
    breadcrumbs.push({ label: getProjectName(), view: 'project-detail', active: true });
  } else if (view === 'create-project') {
    breadcrumbs.push({ label: 'Proyectos', view: 'projects' });
    breadcrumbs.push({ label: 'Nuevo Proyecto', view: 'create-project', active: true });
  } else if (view === 'reports') {
    breadcrumbs.push({ label: 'Reportes', view: 'reports', active: true });
  } else if (view === 'admin') {
    breadcrumbs.push({ label: 'Administración', view: 'admin', active: true });
  }

  return (
    <nav className="flex items-center space-x-2 text-xs font-medium text-slate-500 mb-6 animate-in fade-in slide-in-from-left-2 duration-300">
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRight className="w-3 h-3 text-slate-300" />}
          <button
            onClick={() => onNavigate(crumb.view)}
            disabled={crumb.active}
            className={`flex items-center gap-1.5 transition-colors ${
              crumb.active 
                ? 'text-slate-900 font-bold pointer-events-none' 
                : 'hover:text-delphi-keppel cursor-pointer'
            }`}
          >
            {crumb.icon}
            {crumb.label}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
};
