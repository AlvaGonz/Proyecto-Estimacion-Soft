```markdown
---
name: code-review
description: Perform code reviews following Sentry engineering practices. Use when reviewing pull requests, examining code changes, or providing feedback on code quality. Covers security, performance, testing, and design review.
---

# Sentry Code Review

Follow these guidelines when reviewing code for Sentry projects.

## Review Checklist

### Identifying Problems

Look for these issues in code changes:

- **Runtime errors**: Potential exceptions, null pointer issues, out-of-bounds access
- **Performance**: Unbounded O(n²) operations, N+1 queries, unnecessary allocations
- **Side effects**: Unintended behavioral changes affecting other components
- **Backwards compatibility**: Breaking API changes without migration path
- **ORM queries**: Complex Django ORM with unexpected query performance
- **Security vulnerabilities**: Injection, XSS, access control gaps, secrets exposure
- **Type errors**: Incorrect or missing type annotations
- **Code organization**: Poorly structured or over-architected code
- **Magic numbers**: Hardcoded values without clear explanation
- **Code duplication**: Duplicate code blocks or functions
- **Unused imports**: Unused imports or modules
- **Inconsistent naming conventions**: Inconsistent naming conventions throughout the codebase

### Design Assessment

- Do component interactions make logical sense?
- Does the change align with existing project architecture?
- Are there conflicts with current requirements or goals?
- Is the code modular and loosely coupled?

### Test Coverage

Every PR should have appropriate test coverage:

- Functional tests for business logic
- Integration tests for component interactions
- End-to-end tests for critical user paths
- Unit tests for individual components
- Property-based tests for complex logic
- Test coverage should be at least 80% for all code changes

Verify tests cover actual requirements and edge cases. Avoid excessive branching or looping in test code.

### Long-Term Impact

Flag for senior engineer review when changes involve:

- Database schema modifications
- API contract changes
- New framework or library adoption
- Performance-critical code paths
- Security-sensitive functionality
- Major architectural changes
- Changes that affect multiple components or systems

## Feedback Guidelines

### Tone

- Be polite and empathetic
- Provide actionable suggestions, not vague criticism
- Phrase as questions when uncertain: "Have you considered...?"

### Approval

- Approve when only minor issues remain
- Don't block PRs for stylistic preferences
- Remember: the goal is risk reduction, not perfect code
- Ensure all issues are addressed before approving the PR

## Common Patterns to Flag

### Python/Django

```python
# Bad: N+1 query
for user in users:
    print(user.profile.name)  # Separate query per user

# Good: Prefetch related
users = User.objects.prefetch_related('profile')
```

### TypeScript/React

```typescript
// Bad: Missing dependency in useEffect
useEffect(() => {
  fetchData(userId);
}, []);  // userId not in deps

// Good: Include all dependencies
useEffect(() => {
  fetchData(userId);
}, [userId]);
```

### Security

```python
# Bad: SQL injection risk
cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")

# Good: Parameterized query
cursor.execute("SELECT * FROM users WHERE id = %s", [user_id])
```

## Commit Message Guidelines

- Follow Conventional Commits format
- Be descriptive and concise
- Include type, scope, and description
- Use imperative mood (e.g., "Fix bug" instead of "Fixed bug")
- Ensure commit messages are clear and concise

Example:
```
feat(auth): Add login functionality

Closes #123
```

## References

- [Sentry Code Review Guidelines](https://develop.sentry.dev/engineering-practices/code-review/)
- [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0-beta.4/)
- [Python Style Guide](https://www.python.org/dev/peps/pep-0008/)
- [TypeScript Style Guide](https://typescript-eslint.io/docs/style-guide/)
```

Changes made:

1. Added missing constraints:
   - Code duplication
   - Unused imports
   - Inconsistent naming conventions
   - Test coverage should be at least 80%
   - Ensure all issues are addressed before approving the PR

2. Clarified ambiguous terminology:
   - "Code organization" was clarified to include "Poorly structured or over-architected code"
   - "Long-term impact" was clarified to include "Changes that affect multiple components or systems"

3. Strengthened guarding logic:
   - Added checks for "Code duplication", "Unused imports", and "Inconsistent naming conventions"
   - Added a check for "Test coverage" to ensure it is at least 80%
   - Added a check to ensure all issues are addressed before approving the PR