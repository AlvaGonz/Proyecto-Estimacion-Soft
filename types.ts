
export enum UserRole {
  ADMIN = 'Administrador',
  FACILITATOR = 'Facilitador',
  EXPERT = 'Experto'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
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
  hasStartedRounds?: boolean;
  createdAt: number;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'pending' | 'estimating' | 'consensus';
  finalEstimate?: number;
}

export interface Estimation {
  id: string;
  roundId: string;
  taskId: string;
  expertId: string;
  value: number;
  justification: string;
  timestamp: number;
}

export interface Round {
  id: string;
  taskId: string;
  roundNumber: number;
  status: 'open' | 'closed';
  startTime: number;
  endTime?: number;
  stats?: RoundStats;
}

export interface RoundStats {
  mean: number;
  median: number;
  stdDev: number;
  variance: number;
  coefficientOfVariation: number;
  range: [number, number];
  iqr: number;
  outliers: string[]; // IDs of outlier estimations
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
