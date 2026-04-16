const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const UserSchema = new mongoose.Schema({}, { strict: false });
const ProjectSchema = new mongoose.Schema({}, { strict: false });

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const User = mongoose.model('User', UserSchema);
        const Project = mongoose.model('Project', ProjectSchema);
        
        const targetId = '69e0335139dc0706c2abe573';
        const user = await User.findById(targetId);
        const project = await Project.findById(targetId);
        
        console.log('SEARCHING ID:', targetId);
        if (user) console.log('FOUND AS USER:', user.get('name'), user.get('email'));
        if (project) console.log('FOUND AS PROJECT:', project.get('name'));
        if (!user && !project) console.log('NOT FOUND IN USERS OR PROJECTS');
        
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

check();
