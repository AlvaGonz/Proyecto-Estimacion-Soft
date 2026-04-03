import { Schema, model } from 'mongoose';
import { ITask } from '../../types/models.types.js';
import { TASK_STATUS } from '../../config/constants.js';

const taskSchema = new Schema<ITask>(
    {
        projectId: {
            type: Schema.Types.ObjectId,
            ref: 'Project',
            required: [true, 'El projectId es requerido']
        },
        title: {
            type: String,
            required: [true, 'El título es requerido'],
            trim: true,
            minlength: 3,
            maxlength: 200
        },
        description: {
            type: String,
            required: [true, 'La descripción es requerida'],
            trim: true,
            minlength: 10,
            maxlength: 2000
        },
        status: {
            type: String,
            enum: Object.values(TASK_STATUS),
            default: TASK_STATUS.PENDING
        },
        finalEstimate: {
            type: Number,
            min: 0
        },
        finalJustification: {
            type: String,
            trim: true
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
taskSchema.index({ projectId: 1 });

export const Task = model<ITask>('Task', taskSchema);
