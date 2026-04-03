import { Document, Model, Types } from 'mongoose';

// ─── User ──────────────────────────────────────────────────────────
export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'facilitador' | 'experto';
    isActive: boolean;
    expertiseArea?: string | null;
    refreshToken?: string | null;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IUserModel extends Model<IUser> {
    // Static methods can be added here in the future
}

// ─── AuditLog ──────────────────────────────────────────────────────
export interface IAuditLog extends Document {
    userId: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    timestamp: Date;
}

// ─── Project ───────────────────────────────────────────────────────
export interface IConvergenceConfig {
    cvThreshold: number;       // Default 0.25 — CV must be below this for consensus
    maxOutlierPercent: number; // Default 0.30 — max % of outliers allowed
}

export interface IProject extends Document {
    name: string;
    description: string;
    unit: 'hours' | 'storyPoints' | 'personDays';
    facilitatorId: Types.ObjectId;
    expertIds: Types.ObjectId[];
    status: 'preparation' | 'kickoff' | 'active' | 'finished' | 'archived';
    isDeleted?: boolean;
    estimationMethod: 'wideband-delphi' | 'planning-poker' | 'three-point';
    convergenceConfig: IConvergenceConfig;
    maxRounds: number;          // Added: for wideband delphi or other methods
    sprints: number;            // Added: to organize project in sprints
    createdAt: Date;
    updatedAt: Date;
}

// ─── Task ──────────────────────────────────────────────────────────
export interface ITask extends Document {
    projectId: Types.ObjectId;
    title: string;
    description: string;
    status: 'pending' | 'estimating' | 'consensus' | 'finalized';
    finalEstimate?: number;
    finalJustification?: string;
    completionPercentage?: number;
    createdAt: Date;
    updatedAt: Date;
}

// ─── Round ─────────────────────────────────────────────────────────
export interface IRoundStats {
    mean: number;
    median: number;
    stdDev: number;
    variance: number;
    coefficientOfVariation: number;
    range: [number, number]; // [min, max]
    iqr: number;
    outliers: Types.ObjectId[];
    metricaResultados?: Record<string, any>;
}

export interface IRound extends Document {
    taskId: Types.ObjectId;
    roundNumber: number;
    status: 'open' | 'closed';
    startTime: Date;
    endTime?: Date;
    stats?: IRoundStats;
    analysis?: {
        level: 'Alta' | 'Media' | 'Baja';
        recommendation: string;
        aiInsights?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

// ─── Estimation ────────────────────────────────────────────────────
export interface IEstimation extends Document {
    roundId: Types.ObjectId;
    taskId: Types.ObjectId;
    expertId: Types.ObjectId;
    value: number;
    justification: string;
    metodoData?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

// ─── Comment (Discussion) ──────────────────────────────────────────
export interface IComment extends Document {
    roundId: Types.ObjectId;
    userId: Types.ObjectId;
    content: string;
    isAnonymous: boolean;
    createdAt: Date;
    updatedAt: Date;
}
