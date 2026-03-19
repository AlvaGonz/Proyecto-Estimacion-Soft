import mongoose from 'mongoose';
import { User } from './models/User.model.js';
import { Project } from './models/Project.model.js';
import { Task } from './models/Task.model.js';
import { Round } from './models/Round.model.js';
import { Estimation } from './models/Estimation.model.js';
import { Comment } from './models/Comment.model.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar .env local si existe, si no usar las vars de entorno ya inyectadas (Docker)
// Las variables de process.env inyectadas por Docker tienen prioridad automáticamente
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.docker') });

const seedDatabase = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) throw new Error('MONGODB_URI not found in environment');

        await mongoose.connect(mongoUri);
        console.log('🌱 Connected to MongoDB for seeding...');

        // Clear existing data
        await mongoose.connection.collection('users').deleteMany({});
        await mongoose.connection.collection('projects').deleteMany({});
        await mongoose.connection.collection('tasks').deleteMany({});
        await mongoose.connection.collection('rounds').deleteMany({});
        await mongoose.connection.collection('estimations').deleteMany({});
        await mongoose.connection.collection('comments').deleteMany({});

        console.log('🧹 Cleared existing data.');

        // 1. Create Users
        const adminData = { name: 'Administrador UCE', email: 'admin@uce.edu.do', password: 'password123', role: 'admin', isActive: true };
        const facilitatorData = { name: 'Adrian Alvarez', email: 'aalvarez@uce.edu.do', password: 'password123', role: 'facilitador', isActive: true };
        const facilitator2Data = { name: 'Facilitador 2', email: 'facilitador2@uce.edu.do', password: 'password123', role: 'facilitador', isActive: true };
        const expert1Data = { name: 'Experto 1', email: 'expert1@uce.edu.do', password: 'password123', role: 'experto', isActive: true, expertiseArea: 'Backend' };
        const expert2Data = { name: 'Experto 2', email: 'expert2@uce.edu.do', password: 'password123', role: 'experto', isActive: true, expertiseArea: 'Frontend' };
        const expert3Data = { name: 'Experto 3', email: 'expert3@uce.edu.do', password: 'password123', role: 'experto', isActive: true, expertiseArea: 'DevOps' };
        const expert4Data = { name: 'Experto 4', email: 'expert4@uce.edu.do', password: 'password123', role: 'experto', isActive: true, expertiseArea: 'QA' };
        const expert5Data = { name: 'Experto 5', email: 'expert5@uce.edu.do', password: 'password123', role: 'experto', isActive: true, expertiseArea: 'Base de Datos' };

        const admin = await User.create(adminData);
        const facilitator = await User.create(facilitatorData);
        await User.create(facilitator2Data);
        const expert1 = await User.create(expert1Data);
        const expert2 = await User.create(expert2Data);
        const expert3 = await User.create(expert3Data);
        const expert4 = await User.create(expert4Data);
        const expert5 = await User.create(expert5Data);

        console.log(`✅ Created users (Admin, 2 Facilitators, 5 Experts)`);

        // 2. Create Project
        const project = await Project.create({
            name: 'Sistema de Matrícula UCE',
            description: 'Refactorización del backend del sistema de matrículas usando Node.js y MongoDB.',
            unit: 'storyPoints',
            status: 'active',
            facilitatorId: facilitator._id,
            expertIds: [expert1._id, expert2._id, expert3._id, expert4._id, expert5._id],
            convergenceConfig: {
                cvThreshold: 0.25,
                maxOutlierPercent: 0.30
            }
        });

        console.log(`✅ Created project: ${project.name}`);

        // 3. Create Tasks
        const task1 = await Task.create({
            projectId: project._id,
            title: 'Módulo de Autenticación SSO',
            description: 'Implementación del Single Sign-On usando Azure AD y JWT para docentes y estudiantes.',
            status: 'estimating'
        });

        const task2 = await Task.create({
            projectId: project._id,
            title: 'Migración de Tabla Pagos a MongoDB',
            description: 'Refactorizar consultas de la tabla de pagos hacia la nueva estructura documental.',
            status: 'pending'
        });

        console.log(`✅ Created 2 tasks for project.`);

        // 4. Create an Open Round for task1
        const round1 = await Round.create({
            taskId: task1._id,
            roundNumber: 1,
            status: 'open',
            startTime: new Date()
        });

        console.log(`✅ Created Round 1 for Task 1.`);

        // 5. Add estimations for round1 (Simulating all experts have estimated except expert 4)
        await Estimation.create({
            roundId: round1._id,
            taskId: task1._id,
            expertId: expert1._id,
            value: 8,
            justification: 'Es una refactorización compleja, requiere pruebas.'
        });

        await Estimation.create({
            roundId: round1._id,
            taskId: task1._id,
            expertId: expert2._id,
            value: 5,
            justification: 'Ya hicimos esto el semestre pasado.'
        });

        await Estimation.create({
            roundId: round1._id,
            taskId: task1._id,
            expertId: expert3._id,
            value: 13,
            justification: 'La integración con Azure AD suele traer problemas técnicos pesados.'
        });

        console.log(`✅ Created 3 estimations. (Ready to be closed when expert 4 finishes, or force-closed)`);

        // Cerrar conexión explícitamente para que el contenedor termine
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed.');
        console.log('🚀 Seeding complete! 🎉');
        process.exit(0);
    } catch (err: any) {
        console.error('❌ Seeding failed:', err.message);
        process.exit(1);
    }
};

seedDatabase();
