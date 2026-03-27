# Chore Audit — 2026-03-26
| Domain       | src/features/ | components/ file    | Status        |
|-------------|---------------|----------------------|---------------|
| auth         | ❌ MISSING   | Login.tsx, RegisterPage.tsx | MIGRATE       |
| projects     | ❌ MISSING   | ProjectForm.tsx, ProjectList.tsx, ProjectDetail.tsx | MIGRATE       |
| rounds       | ❌ MISSING   | EstimationRounds.tsx, EstimationCharts.tsx | MIGRATE       |
| estimations  | ❌ MISSING   | (inside App.tsx rendering) | EXTRACT+MIGRATE |
| discussion   | ❌ MISSING   | DiscussionSpace.tsx  | MIGRATE       |
| reports      | ❌ MISSING   | ReportGenerator.tsx  | MIGRATE       |
| users        | ❌ MISSING   | AdminPanel.tsx, TeamPanel.tsx | MIGRATE       |
| notifications| ❌ MISSING   | NotificationCenter.tsx | MIGRATE    |
| tasks        | ❌ MISSING   | (inside App.tsx handlers) | EXTRACT+MIGRATE |
| audit-log    | ❌ MISSING   | ProjectAuditLog.tsx  | MIGRATE       |

## App.tsx Decomposition Map
| Responsibility          | Lines (approx) | Target Feature         |
|------------------------|----------------|------------------------|
| Auth state + login     | 46–119         | src/features/auth/     |
| Notifications Polling  | 120–137        | src/features/notifications/ |
| Navigation / View State| 175–180        | App.tsx (Router)       |
| Project Creation Handler| 181–222        | src/features/projects/ |
| Project Detail Handler | 175–180, 532–542| src/features/projects/ |
| Sidebar Navigation View| 276–334        | src/app/Shell.tsx      |
| Navbar Search / Notifs | 338–377        | src/app/Shell.tsx      |
| Dashboard View         | 390–510        | src/features/projects/ |
| Project List View      | 512–530        | src/features/projects/ |

## services/ root-level audit
| Service                | Classification        | Final Destination           |
|------------------------|-----------------------|-----------------------------|
| authService.ts         | [FRONTEND-SERVICE]    | src/features/auth/services/ |
| projectService.ts      | [FRONTEND-SERVICE]    | src/features/projects/services/ |
| roundService.ts        | [FRONTEND-SERVICE]    | src/features/rounds/services/ |
| notificationService.ts | [FRONTEND-SERVICE]    | src/features/notifications/services/ |
| adminService.ts        | [FRONTEND-SERVICE]    | src/features/users/services/ |
| userService.ts         | [FRONTEND-SERVICE]    | src/features/users/services/ |
| reportService.ts       | [FRONTEND-SERVICE]    | src/features/reports/services/ |
| discussionService.ts   | [FRONTEND-SERVICE]    | src/features/discussion/services/ |
| estimationService.ts   | [FRONTEND-SERVICE]    | src/features/estimations/services/ |
| taskService.ts         | [FRONTEND-SERVICE]    | src/features/tasks/services/ |
| geminiService.ts       | [FRONTEND-SERVICE]    | src/features/estimations/services/ |
| api.ts                 | [FRONTEND-CORE]       | src/shared/api/             |
| convergence.service.ts | [FRONTEND-SERVICE]    | src/features/rounds/services/ |
