import { Document } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'facilitador' | 'experto';
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

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
