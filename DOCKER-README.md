# Docker Setup for DelphiEstimator Pro

This project includes Docker Compose configurations to run the React + TypeScript frontend and the Node.js/Express backend, connected to a MongoDB instance, all running locally.

## Files

- `docker-compose.yml` - Main orchestration file for all containers
- `Dockerfile` - Builds the Vite React Frontend
- `server/Dockerfile` - Builds the Node.js Express API
- `server/Dockerfile.migrations` - Dedicated container strictly for running Database Seeding
- `init-db.js` - Counterpart to `init-db.sql`. Initializes the MongoDB database and basic user roles
- `seed-data.js` & `seed-users.js` - Counterparts to `seed-data.sql` and `see-users.sql`. Reference files for raw MongoDB inserts
- `run-seeds.sh` - Custom entrypoint script for the migrations container to execute database seeding via Mongoose (ensuring Bcrypt hashing execution)
- `server/entrypoint.sh` - Initializer script for the backend API container
- `.dockerignore` / `server/.dockerignore` - Optimizes Docker builds

## Quick Start

### For all systems (Windows/Linux/macOS):
```bash
docker-compose up -d
```

### Or in a single line (Clean Build and Restart):
```bash
docker-compose up --build --force-recreate -d
```

## Database Information

- **Server**: `localhost:27017`
- **Database**: `Proyecto-Estimacion-Soft` (automatically created on startup)
- **Auth**:
  - Username: `admin`
  - Password: `password123`

### Seed Data
The database is automatically populated with dummy data on the first run via the **migrations** container:

**Data Entities Created:**
- 1 Active Project ("Sistema de Matrícula UCE")
- 2 Tasks (e.g. "Módulo de Autenticación SSO")
- 1 Active Estimation Round
- 3 Estimations emitted by Experts

**Users & Roles (`User` collection):**
Test users are automatically created with appropriately hashed passwords using Bcrypt (12 rounds) guaranteeing successful login:

1. **Administrator**
   - Email: `admin@uce.edu.do`
   - Password: `password123`
   - Role: `admin`
   - Permissions: Manage system, users, and projects

2. **Facilitator**
   - Email: `aalvarez@uce.edu.do`
   - Password: `password123`
   - Role: `facilitador`
   - Permissions: Create/Edit projects, Manage Rounds, Generate Reports, Moderate discussions

3. **Experts (1 to 4)**
   - Email: `expert1@uce.edu.do` (up to `expert4`)
   - Password: `password123`
   - Role: `experto`
   - Permissions: Submit independent estimations during open rounds only

The seed scripts (in `server/src/seed.ts` executed by `run-seeds.sh`) are **idempotent** - they will clear existing data and insert fresh data, so restarting the migrations container will reset the database properly without dirtying collections.

## Application Access

- **Frontend (React UI)**: http://localhost:3000
- **Backend API**: http://localhost:4000/api
- **Database (MongoDB)**: mongodb://localhost:27017

## Useful Commands

### View logs
```bash
docker-compose logs -f
```

### View specifically Backend API or Frontend logs
```bash
docker-compose logs -f api
docker-compose logs -f frontend
```

### Stop containers
```bash
docker-compose down
```

### Stop and remove volumes (clean slate database)
```bash
docker-compose down -v
```

### Database Seeding & Initialization
**Data seeding runs automatically via a dedicated migrations container!**

The setup includes:
1. A `migrations` service that spins up immediately alongside the database
2. Automatically applies the `seed.ts` script to generate relationships and hashed passwords
3. No manual intervention needed to get a working environment

To manually trigger seeding (resets the data to its initial clean state) without restarting everything:
```bash
docker-compose up migrations
```

### Access MongoDB directly
```bash
docker exec -it estimacion-mongodb mongosh -u admin -p password123 --authenticationDatabase Proyecto-Estimacion-Soft Proyecto-Estimacion-Soft
```

## Notes

### First Run
On first startup:
1. MongoDB container starts and initializes (`init-db.js`)
2. **The migrations container executes `run-seeds.sh`** running the Mongoose `seed.ts` to properly enforce Bcrypt hashing.
3. **Users, Projects, Tasks, Rounds, and Estimations are created**
4. Node.js backend container starts and connects via Mongoose
5. React frontend container starts serving on port 3000
6. Total startup time: ~15-30 seconds

### Architecture
The setup uses four containers:
- **estimacion-mongodb**: MongoDB 8.0 engine
- **estimacion-api**: Node.js / Express backend framework
- **estimacion-frontend**: React / Vite development server
- **estimacion-migrations**: One-time container that runs the TS seed script (exits after completion to save resources)

### Troubleshooting

**Port already in use:**
If you see "address already in use" errors for 3000, 4000, or 27017, either stop the conflicting service or modify the port mappings (`ports:` section) in the `docker-compose.yml` file.

**Backend can't connect to database:**
Ensure the MongoDB container is healthy using `docker-compose ps` and check logs using `docker-compose logs mongodb`. Note that Mongoose automatically retries the connection in the background.

**Cannot login with seed users:**
Make sure you used `npm run seed` via the `migrations` container. Do not manually execute the direct `seed-users.js` script with `insertMany` as it will bypass Mongoose hooks, resulting in passwords that are not Bcrypt hashed.
