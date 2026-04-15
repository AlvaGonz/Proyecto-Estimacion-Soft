import mongoose from 'mongoose';
import { User } from './models/User.model.js';
import { Project } from './models/Project.model.js';
import { Task } from './models/Task.model.js';
import { Round } from './models/Round.model.js';
import { Estimation } from './models/Estimation.model.js';
import { Comment } from './models/Comment.model.js';
import { AuditLog } from './models/AuditLog.model.js';
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
        const facilitator2 = await User.create(facilitator2Data);
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
        console.log('--- Starting Dummy Projects Generation ---');

        // 6. Dummy/Mock data: 10 projects + logs with visible changes
        const expertPool = [expert1, expert2, expert3, expert4, expert5];
        const facilitatorPool = [facilitator, facilitator2];
        const units: Array<'hours' | 'storyPoints' | 'personDays'> = ['hours', 'storyPoints', 'personDays'];
        const methods: Array<'wideband-delphi' | 'planning-poker' | 'three-point'> = ['wideband-delphi', 'planning-poker', 'three-point'];

        for (let i = 1; i <= 10; i++) {
            const projectName = `Proyecto Dummy ${i.toString().padStart(2, '0')}`;
            console.log(`🔨 Generating ${projectName}...`);

            const baseFacilitator = facilitatorPool[i % facilitatorPool.length];
            const updatedFacilitator = facilitatorPool[(i + 1) % facilitatorPool.length];
            const baseExperts = expertPool.slice(0, 3 + (i % 2));
            const newExpert = expertPool[(i + 2) % expertPool.length];

            const dummyProject = await Project.create({
                name: projectName,
                description: `Proyecto de prueba ${i} para validación de configuración, discusión y auditoría.`,
                unit: units[i % units.length],
                status: 'active',
                facilitatorId: baseFacilitator._id,
                expertIds: baseExperts.map((expert) => expert._id),
                estimationMethod: methods[i % methods.length],
                convergenceConfig: {
                    cvThreshold: 0.2 + (i % 3) * 0.05,
                    maxOutlierPercent: 0.25 + (i % 3) * 0.05
                },
                sprints: 1 + (i % 4)
            });

            const dummyTaskA = await Task.create({
                projectId: dummyProject._id,
                title: `Tarea A - Proyecto ${i}`,
                description: `Tarea inicial para proyecto dummy ${i}.`,
                status: 'estimating'
            });

            const dummyTaskB = await Task.create({
                projectId: dummyProject._id,
                title: `Tarea B - Proyecto ${i}`,
                description: `Tarea de refinamiento para proyecto dummy ${i}.`,
                status: 'pending'
            });

            const openRound = await Round.create({
                taskId: dummyTaskA._id,
                roundNumber: 1,
                status: 'open',
                startTime: new Date()
            });

            await Estimation.create({
                roundId: openRound._id,
                taskId: dummyTaskA._id,
                expertId: baseExperts[0]._id,
                value: 5 + i,
                justification: `Estimación inicial dummy ${i}.`
            });

            await Comment.create({
                taskId: dummyTaskA._id,
                roundId: openRound._id,
                userId: baseExperts[0]._id,
                userRole: 'experto',
                content: `Comentario anónimo de experto para ${projectName}.`,
                isAnonymous: true
            });

            await Comment.create({
                taskId: dummyTaskA._id,
                roundId: openRound._id,
                userId: baseFacilitator._id,
                userRole: 'facilitador',
                content: `Comentario de facilitación para ${projectName}.`,
                isAnonymous: true
            });

            // Apply explicit changes so logs show what changed
            const oldMethod = dummyProject.estimationMethod;
            const newMethod = methods[(i + 1) % methods.length];
            const oldSprints = dummyProject.sprints;
            const newSprints = oldSprints + 1;
            const oldExperts = dummyProject.expertIds.map((id) => String(id));

            dummyProject.estimationMethod = newMethod;
            dummyProject.facilitatorId = updatedFacilitator._id as any;
            dummyProject.expertIds = [...dummyProject.expertIds, newExpert._id as any];
            dummyProject.sprints = newSprints;
            dummyProject.convergenceConfig = {
                cvThreshold: Math.min(0.45, (dummyProject.convergenceConfig?.cvThreshold || 0.25) + 0.05),
                maxOutlierPercent: Math.min(0.5, (dummyProject.convergenceConfig?.maxOutlierPercent || 0.3) + 0.05)
            } as any;
            await dummyProject.save();

            await AuditLog.create({
                userId: String(admin._id),
                userName: admin.name,
                userEmail: admin.email,
                userRole: admin.role,
                action: 'project:create',
                resource: 'Project',
                resourceId: String(dummyProject._id),
                details: {
                    whatManaged: 'Creación de proyecto',
                    changedItems: ['nombre', 'descripción', 'unidad', 'facilitador', 'expertos iniciales']
                },
                timestamp: new Date(Date.now() - 1000 * 60 * (20 + i))
            });

            await AuditLog.create({
                userId: String(admin._id),
                userName: admin.name,
                userEmail: admin.email,
                userRole: admin.role,
                action: 'project:update',
                resource: 'Project',
                resourceId: String(dummyProject._id),
                details: {
                    whatManaged: 'Cambio de método de estimación',
                    changedItems: ['método de estimación'],
                    changes: {
                        estimationMethod: { from: oldMethod, to: newMethod }
                    }
                },
                timestamp: new Date(Date.now() - 1000 * 60 * (15 + i))
            });

            await AuditLog.create({
                userId: String(admin._id),
                userName: admin.name,
                userEmail: admin.email,
                userRole: admin.role,
                action: 'project:update',
                resource: 'Project',
                resourceId: String(dummyProject._id),
                details: {
                    whatManaged: 'Cambio de facilitador',
                    changedItems: ['facilitador'],
                    changes: {
                        facilitator: {
                            from: { id: String(baseFacilitator._id), name: baseFacilitator.name },
                            to: { id: String(updatedFacilitator._id), name: updatedFacilitator.name }
                        }
                    }
                },
                timestamp: new Date(Date.now() - 1000 * 60 * (10 + i))
            });

            await AuditLog.create({
                userId: String(baseFacilitator._id),
                userName: baseFacilitator.name,
                userEmail: baseFacilitator.email,
                userRole: baseFacilitator.role,
                action: 'project:experts_add',
                resource: 'Project',
                resourceId: String(dummyProject._id),
                details: {
                    whatManaged: 'Asignación de expertos al proyecto',
                    changedItems: ['expertos'],
                    actionType: 'add',
                    experts: [
                        { id: String(newExpert._id), name: newExpert.name, email: newExpert.email }
                    ],
                    previousExperts: oldExperts
                },
                timestamp: new Date(Date.now() - 1000 * 60 * (8 + i))
            });

            await AuditLog.create({
                userId: String(updatedFacilitator._id),
                userName: updatedFacilitator.name,
                userEmail: updatedFacilitator.email,
                userRole: updatedFacilitator.role,
                action: 'project:update',
                resource: 'Project',
                resourceId: String(dummyProject._id),
                details: {
                    whatManaged: 'Cambio de sprints del proyecto',
                    changedItems: ['sprints'],
                    changes: {
                        sprints: { from: oldSprints, to: newSprints }
                    }
                },
                timestamp: new Date(Date.now() - 1000 * 60 * (5 + i))
            });

            await AuditLog.create({
                userId: String(baseExperts[0]._id),
                userName: baseExperts[0].name,
                userEmail: baseExperts[0].email,
                userRole: baseExperts[0].role,
                action: 'comment:create',
                resource: 'Comment',
                resourceId: String(dummyTaskA._id),
                details: {
                    whatManaged: 'Mensaje enviado en debate anónimo',
                    changedItems: ['discusión'],
                    taskId: String(dummyTaskA._id),
                    isAnonymous: true
                },
                timestamp: new Date(Date.now() - 1000 * 60 * (2 + i))
            });

            // Keep taskB referenced as part of seeded structure
            void dummyTaskB;
        }

        console.log('✅ Created 10 dummy projects with task/round/comment data and rich audit logs.');

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
