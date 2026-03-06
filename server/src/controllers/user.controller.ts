import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getAllUsers = asyncHandler(async (_req: Request, res: Response) => {
    // TODO: Query users from database with pagination
    // TODO: Exclude password field using .select('-password')
    // TODO: Apply search/filter from query params

    res.json({
        success: true,
        data: {
            users: [],
            pagination: { page: 1, limit: 10, total: 0 },
        },
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
