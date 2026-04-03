# Git Conventions — EstimaPro

## 1. Branch Naming Strategy
All new work must be performed on a branch. Use the following prefixes:

- `feature/`: New features (e.g., `feature/login-system`)
- `fix/`: Bug fixes (e.g., `fix/cv-calculation`)
- `refactor/`: Code improvements without behavior changes
- `chore/`: Maintenance, dependency updates
- `docs/`: Documentation only
- `test/`: Adding or updating tests
- `ci/`: Continuous Integration changes

## 2. Conventional Commits (MANDATORY)
Commit messages must follow the format: `<type>(<scope>): <short summary>`

### Registered Types
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Refactoring
- `perf`: Performance
- `docs`: Documentation
- `test`: Testing
- `build`: Build system or deps
- `ci`: CI config
- `chore`: Chores
- `style`: Formatting

### Scopes
Use the directory name in `src/features/` or `server/src/modules/` as the scope.
Example: `feat(auth): Add Google OAuth support`

## 3. Formatting Rules
- Header: Max 70 chars, imperative mood, no ending period.
- Body: Optional but recommended for complex changes. Explain "why".
- Footer: Use `Fixes #123` or `Refs #456`.
