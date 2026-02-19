
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
  unit: 'Horas' | 'Puntos de Historia' | 'Días Persona';
  facilitatorId: string;
  expertIds: string[];
  status: 'Preparación' | 'Kickoff' | 'Activo' | 'Finalizado';
  createdAt: number;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'Pendiente' | 'Estimando' | 'Consensuada';
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
  status: 'Abierta' | 'Cerrada';
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
  outliers: string[]; // IDs of estimations
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
