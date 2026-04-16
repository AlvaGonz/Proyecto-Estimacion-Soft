import mongoose from 'mongoose';
import { User } from '../models/User.model.js';
import { Project } from '../models/Project.model.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function check() {
    await mongoose.connect(process.env.MONGODB_URI!);
    const admin = await User.findOne({ email: 'admin@uce.edu.do' });
    const projects = await Project.find().limit(5);
    
    console.log('ADMIN:', admin?.id, admin?.name);
    projects.forEach(p => console.log('PROJECT:', p.id, p.name));
    
    process.exit(0);
}

check();
