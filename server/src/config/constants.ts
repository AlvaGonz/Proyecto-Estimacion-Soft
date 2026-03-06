export const ROLES = {
    ADMIN: 'admin',
    FACILITADOR: 'facilitador',
    EXPERTO: 'experto',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const PERMISSIONS = {
    MANAGE_USERS: 'manage:users',
    CREATE_PROJECT: 'create:project',
    EDIT_PROJECT: 'edit:project',
    MANAGE_ROUNDS: 'manage:rounds',
    SUBMIT_ESTIMATION: 'submit:estimation',
    VIEW_ADMIN_PANEL: 'view:admin_panel',
    GENERATE_REPORT: 'generate:report',
    MODERATE_DISCUSSION: 'moderate:discussion',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
    [ROLES.ADMIN]: Object.values(PERMISSIONS),
    [ROLES.FACILITADOR]: [
        PERMISSIONS.CREATE_PROJECT,
        PERMISSIONS.EDIT_PROJECT,
        PERMISSIONS.MANAGE_ROUNDS,
        PERMISSIONS.GENERATE_REPORT,
        PERMISSIONS.MODERATE_DISCUSSION,
    ],
    [ROLES.EXPERTO]: [
        PERMISSIONS.SUBMIT_ESTIMATION,
    ],
} as const;

export const PROJECT_STATUS = {
    ACTIVE: 'active',
    FINISHED: 'finished',
    ARCHIVED: 'archived',
} as const;

export const ROUND_STATUS = {
    OPEN: 'open',
    CLOSED: 'closed',
} as const;

export const TASK_STATUS = {
    PENDING: 'pending',
    ESTIMATING: 'estimating',
    CONSENSUS: 'consensus',
} as const;
