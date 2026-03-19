# EstimaPro - System Patterns

## Architecture Overview
Three-Tier Architecture (N-Tier) with clear separation of concerns:
- **Presentation Layer:** React 18 SPA with TypeScript
- **Business Logic Layer:** Node.js + Express REST API
- **Data Layer:** MongoDB with Mongoose ODM

## Key Design Patterns

### Strategy Pattern (Estimation Engine)
The estimation engine uses the Strategy Pattern to encapsulate each estimation method as an interchangeable strategy. Each method implements a common interface:

```typescript
interface IBaseEstimationMethod {
  calculate(estimations: Estimation[]): MethodMetrics;
  validateInput(input: unknown): boolean;
  evaluateConvergence(metrics: MethodMetrics): ConvergenceResult;
}
```

**Implementations:**
- `DelphiMethod.ts` - Wideband Delphi (mean, median, std dev, variance, CV, IQR)
- `PlanningPokerMethod.ts` - Planning Poker (mode, frequency, consensus %)
- `ThreePointMethod.ts` - Three-Point PERT (E = (O+4M+P)/6, sigma, confidence ranges)

This pattern enables adding new estimation methods without modifying existing code (Open/Closed Principle).

### Data Access Object (DAO) Pattern
Mongoose models serve as DAOs, encapsulating data access logic:
- `User.model.ts`
- `Project.model.ts`
- `Round.model.ts`
- `Estimation.model.ts`
- `Task.model.ts`
- `Comment.model.ts`
- `AuditLog.model.ts`

Business logic layer never directly accesses MongoDB - all queries go through Mongoose models.

### Role-Based Access Control (RBAC)
Three roles with distinct permission sets:
- **Administrator:** User management, global configuration
- **Facilitator:** Project creation, round management, report generation
- **Expert:** Estimation submission, discussion participation

Middleware chain: `auth.middleware.ts` -> `rbac.middleware.ts` -> controller

### Request Validation Pattern
Zod schemas in `server/src/types/api.types.ts` validate all API inputs before processing.

## Component Relationships

```
Frontend (React SPA)
    |
    v
Express REST API
    |
    +---> Auth Controller -> Auth Service -> User Model
    |
    +---> Project Controller -> Project Service -> Project Model
    |
    +---> Round Controller -> Round Service -> Round Model
    |
    +---> Estimation Controller -> Estimation Service -> Estimation Model
    |                          |
    |                          +---> Statistics Service (calculations)
    |                          +---> Convergence Service (evaluation)
    |
    +---> Discussion Controller -> Discussion Service -> Comment Model
    |
    +---> Admin Controller -> Admin Service -> User/Config Models
    |
    v
MongoDB (via Mongoose ODM)
```

## Critical Implementation Paths

### Estimation Submission Flow
1. Expert submits estimation via frontend
2. Frontend calls POST /api/estimations
3. Auth middleware validates JWT
4. RBAC middleware checks Expert role
5. Zod schema validates input
6. Estimation service stores estimation
7. Round service checks if all experts submitted
8. On round close: Statistics service calculates metrics
9. Convergence service evaluates consensus
10. Frontend receives updated data

### Round Lifecycle
1. Facilitator creates round (status: open)
2. Experts submit anonymous estimates
3. Facilitator closes round
4. System calculates statistics per task
5. System evaluates convergence
6. System generates recommendation (continue/conclude)
7. Facilitator reviews and decides next action

## Database Document Structure
```
Project {
  facilitator: ObjectId -> User
  method: 'delphi' | 'poker' | 'threepoint'
  parameters: { method-specific config }
  rounds: [Round]
}

Round {
  project: ObjectId -> Project
  number: Int
  status: 'open' | 'closed'
  estimations: [Estimation]
}

Estimation {
  round: ObjectId -> Round
  task: ObjectId -> Task
  expert: ObjectId -> User (hidden until round closes)
  value: Number (or O/M/P for three-point)
  justification: String
}
```

## Patterns to Follow
- Async/await everywhere (no callbacks)
- Error handling via ApiError class + asyncHandler wrapper
- Services contain business logic, controllers handle HTTP
- Frontend services mirror backend services
- Components use functional style with hooks