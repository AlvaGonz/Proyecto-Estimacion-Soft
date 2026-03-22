// init-db.js
// Equivalent to Init-bd.sql for MongoDB initialization.
// This script runs automatically in docker-compose.yml via mongo entrypoint.

print('=============================================');
print('Initializing DelphiEstimator Database Auth');
print('=============================================');

db = db.getSiblingDB('Proyecto-Estimacion-Soft');

// Basic database permissions setup
try {
  db.createUser({
    user: 'admin',
    pwd: 'password123',
    roles: [{ role: 'readWrite', db: 'Proyecto-Estimacion-Soft' }],
  });
  print('✅ MongoDB Initialized with Auth User');
} catch (e) {
  print('ℹ️ User might already exist.');
}

// Optional: create collections explicitly (Mongo creates them on document insertion anyway)
db.createCollection('users');
db.createCollection('projects');
db.createCollection('tasks');
db.createCollection('rounds');
db.createCollection('estimations');
db.createCollection('comments');
db.createCollection('auditLogs');

print('✅ Collections verified.');
