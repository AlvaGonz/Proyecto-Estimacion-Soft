import mongoose, { Schema } from 'mongoose';
import { IAuditLog } from '../../types/models.types.js';

const auditLogSchema = new Schema<IAuditLog>({
    userId: { type: String, required: true, index: true },
    action: { type: String, required: true },
    resource: { type: String, required: true },
    resourceId: { type: String },
    details: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
    timestamp: { type: Date, default: Date.now, index: true },
});

// Compound index for querying audit logs by resource
auditLogSchema.index({ resource: 1, resourceId: 1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
