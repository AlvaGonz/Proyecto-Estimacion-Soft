// seed-users.js
// Equivalent to See-users.sql
//
// NOTE: This file is a reference implementation of direct MongoDB inserts.
// However, direct inserts bypass Mongoose middleware and DO NOT hash passwords with bcrypt.
// To ensure users can properly log in, the DelphiEstimator project runs the TS Seeder
// (server/src/seed.ts) via the `estimacion-migrations` container.
// 
// If run directly, user login would fail.

print('=============================================');
print('Seed Users (Direct Mongo Script) Placeholder');
print('=============================================');

db = db.getSiblingDB('Proyecto-Estimacion-Soft');

const dummyUsers = [
  { name: 'Admin JS', email: 'admin-js@uce.edu.do', role: 'admin', isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { name: 'Facilitador JS', email: 'facil-js@uce.edu.do', role: 'facilitador', isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { name: 'Experto JS', email: 'experto-js@uce.edu.do', role: 'experto', isActive: true, createdAt: new Date(), updatedAt: new Date() }
];

// Uncomment to run directly if password hashing is not needed:
// db.users.insertMany(dummyUsers);
print('⚡ To seed users with valid BCRYPT hashes, the docker-compose "migrations" container uses "server/src/seed.ts".');
