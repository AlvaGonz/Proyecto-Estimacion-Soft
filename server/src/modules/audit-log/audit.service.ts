import { AuditLog } from '../models/index.js';
import { User } from '../models/User.model.js';

interface AuditLogData {
    userId: string;
    userName?: string;
    userEmail?: string;
    userRole?: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: Record<string, unknown> | string;
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
            let userSnapshot = {
                userName: data.userName,
                userEmail: data.userEmail,
                userRole: data.userRole
            };

            if ((!userSnapshot.userName || !userSnapshot.userRole || !userSnapshot.userEmail) && data.userId) {
                const user = await User.findById(data.userId).select('name email role');
                if (user) {
                    userSnapshot = {
                        userName: userSnapshot.userName || user.name,
                        userEmail: userSnapshot.userEmail || user.email,
                        userRole: userSnapshot.userRole || user.role
                    };
                }
            }

            await AuditLog.create({
                ...data,
                ...userSnapshot,
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
