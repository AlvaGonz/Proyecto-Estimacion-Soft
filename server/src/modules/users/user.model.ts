import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser, IUserModel } from '../types/models.types.js';

const BCRYPT_ROUNDS = 12;

const userSchema = new Schema<IUser>(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true, minlength: 8, select: false },
        role: {
            type: String,
            enum: ['admin', 'facilitador', 'experto'],
            required: true,
        },
        isActive: { type: Boolean, default: true },
        expertiseArea: { type: String, default: null, trim: true },
        refreshToken: { type: String, default: null, select: false },
        lastLogin: { type: Date },
    },
    {
        timestamps: true,
    }
);

// Pre-save hook: hash password with bcrypt (12 rounds)
// Only runs when password field is modified (not on every save)
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        this.password = await bcrypt.hash(this.password, BCRYPT_ROUNDS);
        next();
    } catch (error) {
        next(error as Error);
    }
});

// Instance method: compare candidate password against stored hash
userSchema.methods.comparePassword = async function (
    candidatePassword: string
): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

// toJSON transform: strip sensitive fields from API responses
// eslint-disable-next-line @typescript-eslint/no-explicit-any
userSchema.set('toJSON', {
    transform: (_doc, ret: any) => {
        ret.id = ret._id?.toString() || ret.id;
        delete ret._id;
        delete ret.password;
        delete ret.refreshToken;
        delete ret.__v;
        return ret;
    },
});

export const User = mongoose.model<IUser, IUserModel>('User', userSchema);
