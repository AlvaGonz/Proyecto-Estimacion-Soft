---
name: cosmosdb-datamodeling
description: 'Specialized guide for NoSQL data modeling (Adapted for MongoDB).'
---

# NoSQL Data Modeling (MongoDB/Mongoose)

## Core Philosophy
1. **Design for Access Patterns**: Model data based on how it is queried, not how it is related.
2. **Strategic Co-location**: Embed related data that is always accessed together (1-to-few).
3. **Keep Relationships Explicit**: Use references (1-to-many/many-to-many) for large or frequently updated sub-documents.

## Design Patterns
- **Data Binning**: Group time-series or high-frequency data into buckets.
- **Computed Pattern**: Store pre-calculated stats (like `mean`/`median` in Rounds) to avoid expensive aggregations.
- **Reference Pattern**: Use MongoDB `$lookup` or Mongoose `.populate()` for modular data.

## Mongoose Best Practices
- Define strict schemas with validation.
- Use `toJSON` transforms to hide internal fields (like `__v` or `password`).
- Implement proper indexing for search fields.
