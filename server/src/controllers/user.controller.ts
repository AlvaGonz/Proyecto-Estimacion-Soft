import { Request, Response } from 'express';
import { User } from '../models/User.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const query: Record<string, unknown> = {};

    // Filter by isActive if provided as query param
    if (req.query.isActive !== undefined) {
        query.isActive = req.query.isActive === 'true';
    }

    // Filter by role if provided
    if (req.query.role) {
        query.role = req.query.role;
    }

    const users = await User.find(query)
        .select('-password -refreshToken')
        .sort({ name: 1 });

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
