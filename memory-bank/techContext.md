# EstimaPro - Technical Context

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18.x | UI library |
| TypeScript | 5.x | Type safety |
| Vite | Latest | Build tool |
| Tailwind CSS | 3.x | Styling |
| Chart.js | 4.x | Statistical visualizations |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 18+ LTS | Runtime |
| Express.js | 4.x | REST API framework |
| TypeScript | 5.x | Type safety |
| Mongoose | 7.x | MongoDB ODM |
| JWT (jsonwebtoken) | Latest | Authentication |
| bcrypt | 12 rounds | Password hashing |
| Zod | Latest | Input validation |
| Nodemailer | Latest | Email notifications |
| Puppeteer | Latest | PDF report generation |

### Database
| Technology | Purpose |
|---|---|
| MongoDB | Document database |

### Infrastructure
| Technology | Purpose |
|---|---|
| Docker | Containerization |
| Docker Compose | Multi-container orchestration |
| Nginx | Frontend serving / reverse proxy |

## Development Setup

### Prerequisites
- Node.js 18+ LTS
- Docker and Docker Compose
- Git

### Frontend Development
```bash
npm install
npm run dev
```
Runs Vite dev server with hot reload.

### Backend Development
```bash
cd server
npm install
npm run dev
```
Runs Express with nodemon for auto-restart.

### Full Stack via Docker
```bash
docker compose up -d
```
Starts 3 containers:
- `nginx` - Frontend (port 80)
- `node` - Backend API
- `mongo` - Database

### Database Seeding
```bash
cd server
npm run seed
```
Creates initial admin user and sample data.

## Build Commands
```bash
# Frontend build
npm run build

# Backend build
cd server && npm run build

# Backend tests
cd server && npm test

# E2E tests
npx playwright test
```

## Technical Constraints

### Security
- HTTPS required (RNF001)
- Passwords hashed with bcrypt 12 rounds minimum
- JWT tokens in httpOnly cookies only (never in response body)
- RBAC enforced at middleware level
- Zod validation on all API inputs

### Data Integrity
- Round estimations immutable after round close (RNF008)
- Validation at both application and Mongoose schema level

### Scalability
- Architecture supports horizontal/vertical scaling (RNF005)
- Stateless API design (JWT-based auth)
- Database connection pooling via Mongoose

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Responsive design: desktop, tablet, mobile (RNF006)

## Environment Configuration
- `.env` file for backend configuration
- `.env.docker` for Docker-specific settings
- Environment variables: DB connection, JWT secret, SMTP config

## Dependencies Notes
- Chart.js chosen for lightweight, responsive statistical charts
- Mongoose chosen over raw MongoDB driver for schema validation and middleware
- Zod chosen for TypeScript-first validation with runtime checks
- Puppeteer chosen for server-side PDF generation with charts