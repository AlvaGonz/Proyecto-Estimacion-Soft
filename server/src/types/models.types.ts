import { Document, Model, Types } from 'mongoose';

// ─── User ──────────────────────────────────────────────────────────
export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'facilitador' | 'experto';
    isActive: boolean;
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
    status: 'active' | 'finished' | 'archived';
    convergenceConfig: IConvergenceConfig;
    createdAt: Date;
    updatedAt: Date;
}

// ─── Task ──────────────────────────────────────────────────────────
export interface ITask extends Document {
    projectId: Types.ObjectId;
    title: string;
    description: string;
    status: 'pending' | 'estimating' | 'consensus';
    finalEstimate?: number;
    createdAt: Date;
    updatedAt: Date;
}

// ─── Round ─────────────────────────────────────────────────────────
export interface IRoundStats {
    mean: number;
    median: number;
    stdDev: number;
    variance: number;
    cv: number;              // Coefficient of Variation
    range: [number, number]; // [min, max]
    iqr: number;
    outlierEstimationIds: Types.ObjectId[];
}

export interface IRound extends Document {
    taskId: Types.ObjectId;
    roundNumber: number;
    status: 'open' | 'closed';
    startTime: Date;
    endTime?: Date;
    stats?: IRoundStats;
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
