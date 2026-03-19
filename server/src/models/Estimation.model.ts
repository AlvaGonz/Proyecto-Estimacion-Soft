import { Schema, model } from 'mongoose';
import { IEstimation } from '../types/models.types.js';
import { ApiError } from '../utils/ApiError.js';
import { ROUND_STATUS } from '../config/constants.js';

const estimationSchema = new Schema<IEstimation>(
    {
        roundId: {
            type: Schema.Types.ObjectId,
            ref: 'Round',
            required: [true, 'El roundId es requerido']
        },
        taskId: {
            type: Schema.Types.ObjectId,
            ref: 'Task',
            required: [true, 'El taskId es requerido']
        },
        expertId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'El expertId es requerido']
        },
        value: {
            type: Number,
            required: [true, 'El valor estimado es requerido'],
            min: 0
        },
        justification: {
            type: String,
            required: [true, 'La justificación es requerida'],
            trim: true,
            minlength: 5,
            maxlength: 2000
        },
        metodoData: {
            type: Schema.Types.Mixed,
            default: {}
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
// Un experto solo puede emitir una estimación por ronda
estimationSchema.index({ roundId: 1, expertId: 1 }, { unique: true });

export const Estimation = model<IEstimation>('Estimation', estimationSchema);
