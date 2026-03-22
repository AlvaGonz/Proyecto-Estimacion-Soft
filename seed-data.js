// seed-data.js
// Equivalent to Seed-data.sql
//
// NOTE: This file is a reference implementation of direct MongoDB inserts.
// The DelphiEstimator project creates related data (Projects -> Tasks -> Rounds -> Estimations)
// using 'server/src/seed.ts' through the Mongoose ORM to maintain strict schema typing and logic.
// This ensures that the Wideband Delphi Rules are followed perfectly on initialization.

print('=============================================');
print('Seed Data (Direct Mongo Script) Placeholder');
print('=============================================');

db = db.getSiblingDB('Proyecto-Estimacion-Soft');

const dummyProjects = [
  { 
    name: 'Dummy Project JS', 
    unit: 'storyPoints', 
    status: 'active', 
    convergenceConfig: { cvThreshold: 0.25, maxOutlierPercent: 0.3 },
    createdAt: new Date(),
    updatedAt: new Date() 
  }
];

// Uncomment to run directly:
// db.projects.insertMany(dummyProjects);
print('⚡ To seed linked projects, tasks, and rounds correctly, the docker-compose "migrations" container uses "server/src/seed.ts".');
