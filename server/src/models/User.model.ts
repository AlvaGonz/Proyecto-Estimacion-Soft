import mongoose, { Schema } from 'mongoose';
import { IUser } from '../types/models.types.js';

const userSchema = new Schema<IUser>(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true },
        password: { type: String, required: true, minlength: 8 },
        role: {
            type: String,
            enum: ['admin', 'facilitador', 'experto'],
            required: true,
        },
        isActive: { type: Boolean, default: true },
    },
    {
        timestamps: true,
    }
);

// TODO: Add pre-save hook to hash password with bcrypt (12 rounds)
// userSchema.pre('save', async function (next) {
//   if (!this.isModified('password')) return next();
//   this.password = await bcrypt.hash(this.password, 12);
//   next();
// });

// TODO: Add instance method to compare password
// userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
//   return bcrypt.compare(candidate, this.password);
// };

// TODO: Add toJSON transform to exclude password from API responses
// userSchema.set('toJSON', {
//   transform: (_doc, ret) => {
//     delete ret.password;
//     return ret;
//   },
// });

export const User = mongoose.model<IUser>('User', userSchema);
