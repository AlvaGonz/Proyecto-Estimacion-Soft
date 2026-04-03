import { Schema, model } from 'mongoose';
import { IRound } from '../../types/models.types.js';
import { ROUND_STATUS } from '../../config/constants.js';
import { ApiError } from '../../utils/ApiError.js';

const roundStatsSchema = new Schema({
    mean: { type: Number, required: true },
    median: { type: Number, required: true },
    stdDev: { type: Number, required: true },
    variance: { type: Number, required: true },
    cv: { type: Number, required: true },
    range: { type: [Number], required: true }, // [min, max]
    iqr: { type: Number, required: true },
    outlierEstimationIds: [{ type: Schema.Types.ObjectId, ref: 'Estimation' }],
    metricaResultados: { type: Schema.Types.Mixed, default: {} }
}, { _id: false });

const roundSchema = new Schema<IRound>(
    {
        taskId: {
            type: Schema.Types.ObjectId,
            ref: 'Task',
            required: [true, 'El taskId es requerido']
        },
        roundNumber: {
            type: Number,
            required: [true, 'El número de ronda es requerido'],
            min: 1
        },
        status: {
            type: String,
            enum: Object.values(ROUND_STATUS),
            default: ROUND_STATUS.OPEN
        },
        startTime: {
            type: Date,
            default: Date.now
        },
        endTime: {
            type: Date
        },
        stats: {
            type: roundStatsSchema
        },
        analysis: {
            level: { type: String, enum: ['Alta', 'Media', 'Baja'] },
            recommendation: { type: String },
            aiInsights: { type: String }
        }
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: (_doc, ret: any) => {
                ret.id = ret._id?.toString() || ret.id;
                delete ret._id;
                delete ret.__v;
                return ret;
            }
        }
    }
);

// Indexes
roundSchema.index({ taskId: 1, roundNumber: 1 }, { unique: true });

// Immutability Hook: Cannot modify a closed round
roundSchema.pre('save', function (next) {
    if (this.isModified() && this.status === ROUND_STATUS.CLOSED && !this.isModified('status') && !this.isModified('endTime') && !this.isModified('stats') && !this.isModified('analysis')) {
        // Allow the transition TO closed (modifying status, endTime, stats simultaneously)
        // Or modifying analysis after it's closed.
        // But block other changes.
        const originalDoc = this.toObject(); // Just checking logic
        if (originalDoc.status === ROUND_STATUS.CLOSED) {
            return next(ApiError.forbidden('Una ronda cerrada no puede ser modificada (excepto el análisis)') as any);
        }
    }
    next();
});

export const Round = model<IRound>('Round', roundSchema);
