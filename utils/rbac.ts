export type Role = 'admin' | 'facilitador' | 'experto';

export type Permission =
  | 'manage:users'
  | 'create:project'
  | 'edit:project'
  | 'manage:rounds'
  | 'submit:estimation'
  | 'view:admin_panel'
  | 'generate:report'
  | 'moderate:discussion';

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'manage:users',
    'create:project',
    'edit:project',
    'manage:rounds',
    'submit:estimation',
    'view:admin_panel',
    'generate:report',
    'moderate:discussion'
  ],
  facilitador: [
    'create:project',
    'edit:project',
    'manage:rounds',
    'generate:report',
    'moderate:discussion'
  ],
  experto: [
    'submit:estimation'
  ]
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
