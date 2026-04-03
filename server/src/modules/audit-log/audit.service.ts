import { AuditLog } from '../models/index.js';

interface AuditLogData {
    userId: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
}

export class AuditService {
    /**
     * Log an audit event to the database.
     * Uses fire-and-forget pattern — audit failures must NOT crash the main flow.
     */
    async log(data: AuditLogData): Promise<void> {
        try {
            await AuditLog.create({
                ...data,
                timestamp: new Date(),
            });
        } catch (error) {
            // Fire-and-forget: log error but never let audit failure break the main flow
            console.error('[AUDIT ERROR] Failed to write audit log:', error);
        }
    }

    async findByProject(projectId: string) {
        return AuditLog.find({ resourceId: projectId }).sort({ timestamp: -1 });
    }
}

export const auditService = new AuditService();
