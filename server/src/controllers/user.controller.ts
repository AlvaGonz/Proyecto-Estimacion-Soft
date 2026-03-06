import { Request, Response } from 'express';
import { User } from '../models/User.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getAllUsers = asyncHandler(async (_req: Request, res: Response) => {
    const users = await User.find({}).sort({ name: 1 });

    res.json({
        success: true,
        data: users
    });
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // TODO: Validate user exists in database
    // TODO: Validate update payload with Zod
    // TODO: Update user fields (except password — separate endpoint)
    // TODO: Log audit event (action: 'user:update')

    res.json({
        success: true,
        message: 'Usuario actualizado',
        data: { id },
    });
});
