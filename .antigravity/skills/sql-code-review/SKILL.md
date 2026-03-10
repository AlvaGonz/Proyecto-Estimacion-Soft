---
name: sql-code-review
description: 'Universal SQL/NoSQL assistant for auditing queries and schemas for security and quality.'
---

# Schema & Query Review

## Security (SQL/NoSQL Injection)
- **Parameterized Queries**: Always use parameters or ORM methods instead of string concatenation.
- **Input Sanitization**: Validate all user-provided fields before using them in filters.

## Performance
- **Index Usage**: Ensure queries are covered by appropriate indexes.
- **N+1 Problems**: Use join/populate strategies to fetch related data in bulk.
- **Projection**: Only fetch the fields needed (don't use `SELECT *` or return full documents if only names are needed).

## Quality
- **Naming**: Use consistent snake_case or camelCase across the DB.
- **Schema Validation**: Ensure required fields and types are enforced at the DB/ORM level.
