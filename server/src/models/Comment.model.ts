import { Schema, model } from 'mongoose';
import { IComment } from '../types/models.types.js';

const commentSchema = new Schema<IComment>(
    {
        roundId: {
            type: Schema.Types.ObjectId,
            ref: 'Round',
            required: false // Optional for task-level discussions
        },
        taskId: {
            type: Schema.Types.ObjectId,
            ref: 'Task',
            index: true
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'El userId es requerido']
        },
        userRole: {
            type: String, // 'admin', 'facilitador', 'experto'
            required: false
        },
        content: {
            type: String,
            required: [true, 'El contenido del comentario es requerido'],
            trim: true,
            minlength: 1,
            maxlength: 2000
        },
        isAnonymous: {
            type: Boolean,
            default: true // Crucial for Wideband Delphi anonymity during estimations
        }
    },
    {
        timestamps: true
    }
);

// Indexes
commentSchema.index({ roundId: 1, createdAt: 1 });
commentSchema.index({ taskId: 1, createdAt: 1 });

export const Comment = model<IComment>('Comment', commentSchema);
