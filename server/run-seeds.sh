#!/bin/sh
# run-seeds.sh
# Container script to run db migrations/seeding

echo "=========================================================="
echo "Initializing Locales and Database Seeds (DelphiEstimator)"
echo "=========================================================="

echo "⏳ Waiting for MongoDB to become ready..."
# Simple sleep to ensure MongoDB is ready
sleep 5

echo "📁 Running Seed-users and Seed-data logic..."
echo "Note: The actual seed is executed via Mongoose to enforce bcrypt password hashing and proper relationships."

# Run the TypeScript seed from the /app directory (server/src/seed.ts)
npx tsx src/seed.ts

echo "✅ Migrations and Seeding completed successfully!"
