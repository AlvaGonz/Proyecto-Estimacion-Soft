
export enum UserRole {
  ADMIN = 'admin',
  FACILITATOR = 'facilitador',
  EXPERT = 'experto'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  expertiseArea?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  unit: 'hours' | 'storyPoints' | 'personDays';
  facilitatorId: string;
  expertIds: string[];
  status: 'preparation' | 'kickoff' | 'active' | 'finished' | 'archived';
  estimationMethod?: EstimationMethod;
  convergenceConfig?: ConvergenceConfig;
  maxRounds: number;
  sprints: number;
  hasStartedRounds?: boolean;
  sprintIsLocked?: boolean;
  isDeleted?: boolean;
  createdAt: number;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'pending' | 'estimating' | 'consensus' | 'finalized';
  finalEstimate?: number;
  completionPercentage?: number;
}

export type NotificationType = 
  | 'project_invite' 
  | 'round_opened' 
  | 'round_closed' 
  | 'consensus_reached' 
  | 'system'
  | 'expert_submission'
  | 'results_revealed'
  | 'new_round'
  | 'reminder';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  projectId?: string;
  taskId?: string;
  targetUserId?: string;
  read: boolean;
  createdAt: number;
}

export interface Estimation {
  id: string;
  roundId: string;
  taskId: string;
  expertId: string;
  value: number;
  justification: string;
  metodoData?: any; // RF031 Extended data for specific methods
  timestamp: number;
}

export interface Round {
  id: string;
  taskId: string;
  roundNumber: number;
  status: 'open' | 'closed';
  startTime: Date;
  endTime?: Date;
  stats?: RoundStats;
  analysis?: ConvergenceAnalysis;
  maxRounds?: number;
  sprints?: number;
  estimations: Estimation[];
}

export interface RoundStats {
  mean: number;
  median: number;
  stdDev: number;
  variance: number;
  coefficientOfVariation: number;
  range: [number, number];
  iqr: number;
  outlierEstimationIds: string[]; // IDs of outlier estimations
  metricaResultados?: Record<string, any>;
}

export interface ConvergenceAnalysis {
  level: 'Alta' | 'Media' | 'Baja';
  recommendation: string;
  aiInsights?: string;
}

export interface AuditEntry {
  id: string;
  projectId: string;
  userId: string;
  action: string;
  timestamp: number;
  details: string;
}

export interface Comment {
  id: string;
  roundId: string;
  userId?: string;
  content: string;
  isAnonymous: boolean;
  timestamp: number;
}

// ─── RF031/032/034 — Estimation Methods ──────────────────────────
export type EstimationMethod = 'wideband-delphi' | 'planning-poker' | 'three-point';

export interface ConvergenceConfig {
  cvThreshold: number;       // default: 0.25
  maxOutlierPercent: number; // default: 0.30
}

export interface ThreePointEstimation {
  optimistic: number;   // O
  mostLikely: number;   // M
  pessimistic: number;  // P
  expected?: number;    // E = (O + 4M + P) / 6  — calculated, not entered
  stdDev?: number;      // σ = (P - O) / 6       — calculated, not entered
}

export const FIBONACCI_SEQUENCE = [0, 1, 2, 3, 5, 8, 13, 21, '?'] as const;
export type FibonacciCard = typeof FIBONACCI_SEQUENCE[number];

export const METHOD_LABELS: Record<string, string> = {
  'wideband-delphi': 'Wideband Delphi (Tradicional)',
  'planning-poker': 'Planning Poker (Agile)',
  'three-point': 'Estimación de Tres Puntos (PERT)'
};
