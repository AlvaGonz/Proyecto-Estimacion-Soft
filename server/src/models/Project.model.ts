import { Schema, model } from 'mongoose';
import { IProject } from '../types/models.types.js';
import { PROJECT_STATUS } from '../config/constants.js';

const convergenceConfigSchema = new Schema({
    cvThreshold: {
        type: Number,
        default: 0.25,
        min: 0.01,
        max: 1
    },
    maxOutlierPercent: {
        type: Number,
        default: 0.30,
        min: 0.01,
        max: 1
    }
}, { _id: false }); // No need for _id in subdocument

const attachmentSchema = new Schema({
    originalName: { type: String, required: true },
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    path: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
}, { _id: true });

const projectSchema = new Schema<IProject>(
    {
        name: {
            type: String,
            required: [true, 'El nombre del proyecto es requerido'],
            trim: true,
            minlength: 3,
            maxlength: 100
        },
        description: {
            type: String,
            required: [true, 'La descripción es requerida'],
            trim: true,
            minlength: 10,
            maxlength: 1000
        },
        unit: {
            type: String,
            enum: ['hours', 'storyPoints', 'personDays'],
            required: [true, 'La unidad de estimación es requerida']
        },
        facilitatorId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'El facilitador es requerido']
        },
        expertIds: [{
            type: Schema.Types.ObjectId,
            ref: 'User'
        }],
        status: {
            type: String,
            enum: Object.values(PROJECT_STATUS),
            default: PROJECT_STATUS.ACTIVE
        },
        isDeleted: {
            type: Boolean,
            default: false
        },
        estimationMethod: {
            type: String,
            enum: ['wideband-delphi', 'planning-poker', 'three-point'],
            default: 'wideband-delphi'
        },
        convergenceConfig: {
            type: convergenceConfigSchema,
            default: () => ({ cvThreshold: 0.25, maxOutlierPercent: 0.30 })
        },
        maxRounds: {
            type: Number,
            default: 3,
            min: 1,
            max: 10
        },
        sprints: {
            type: Number,
            default: 1,
            min: 1,
            max: 50
        },
        attachments: {
            type: [attachmentSchema],
            default: []
        }
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            versionKey: false,
            transform: (doc, ret: any) => {
                // Ensure the string id always comes from the project's own _id
                // Use doc._id because ret._id might have been transformed already
                ret.id = doc._id.toString();
                delete ret._id;
                return ret;
            }
        },
        toObject: { virtuals: true }
    }
);

// Indexes
projectSchema.index({ facilitatorId: 1 });
projectSchema.index({ status: 1 });

// Virtuals (e.g. for a future task count if needed, though we will likely query it separately or via aggregation)
projectSchema.virtual('taskCount', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'projectId',
    count: true
});

export const Project = model<IProject>('Project', projectSchema);
