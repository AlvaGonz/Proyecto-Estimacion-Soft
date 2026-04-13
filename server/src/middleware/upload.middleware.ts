import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { ApiError } from '../utils/ApiError.js';

// Setup storage folder
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Allowed MIME types config
const allowedMiMeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        // Generate a random string to avoid name collisions
        const uniqueSuffix = crypto.randomBytes(16).toString('hex');
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (allowedMiMeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(ApiError.badRequest('Invalid file type. Only PDF and Word documents are allowed.') as any, false);
    }
};

// 100 MB limit
const limits = {
    fileSize: 100 * 1024 * 1024
};

export const upload = multer({
    storage,
    fileFilter,
    limits
});
