import React, { ReactNode } from 'react';
import { hasPermission, Permission, Role } from '../utils/rbac';
import { UserRole } from '../../../types';

interface PermissionGateProps {
  userRole: UserRole;
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

const mapUserRoleToRbacRole = (role: UserRole): Role => {
  switch (role) {
    case UserRole.ADMIN: return 'admin';
    case UserRole.FACILITATOR: return 'facilitador';
    case UserRole.EXPERT: return 'experto';
    default: return 'experto';
  }
};

export const PermissionGate: React.FC<PermissionGateProps> = ({ 
  userRole, 
  permission, 
  children, 
  fallback = null 
}) => {
  const rbacRole = mapUserRoleToRbacRole(userRole);
  
  if (hasPermission(rbacRole, permission)) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
};
