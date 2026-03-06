import mongoose from 'mongoose';
import { User } from './models/User.model.js'; // Added .js and named import
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env' });

const seedUsers = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) throw new Error('MONGODB_URI not found in .env');

        await mongoose.connect(mongoUri);
        console.log('🌱 Connected to MongoDB for seeding...');

        // Delete existing users to avoid conflict
        await mongoose.connection.collection('users').deleteMany({});
        console.log('🧹 Cleared existing users.');

        const users = [
            {
                name: 'Administrador UCE',
                email: 'admin@uce.edu.do',
                password: 'password123',
                role: 'admin',
                isActive: true
            },
            {
                name: 'Adrian Alvarez',
                email: 'aalvarez@uce.edu.do',
                password: 'password123',
                role: 'facilitador',
                isActive: true
            },
            {
                name: 'Experto de Prueba',
                email: 'expert@uce.edu.do',
                password: 'password123',
                role: 'experto',
                isActive: true
            }
        ];

        for (const u of users) {
            await User.create(u);
            console.log(`✅ Created user: ${u.email}`);
        }

        console.log('🚀 Seeding complete!');
        process.exit(0);
    } catch (err: any) {
        console.error('❌ Seeding failed:', err.message);
        process.exit(1);
    }
};

seedUsers();
