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
    async log(data: AuditLogData): Promise<void> {
        // TODO: Create audit log entry in database
        // await AuditLog.create({ ...data, timestamp: new Date() });

        // STUB: Console log for debugging
        console.log('[AUDIT STUB]', JSON.stringify(data, null, 2));
    }
}
