---
name: sql-optimization
description: 'Universal performance tuner for queries and indexing.'
---

# Query Optimization

## Techniques
1. **Analyze Execution Plan**: Use `EXPLAIN` (SQL) or `.explain()` (MongoDB) to see query costs.
2. **Index Strategy**: Identify missing indexes or unused indexes.
3. **Partitioning/Sharding**: For massive datasets, analyze partition keys.
4. **Batch Operations**: Use bulk writes/updates for high-throughput tasks.

## Checklist
- [ ] Query uses an index.
- [ ] No full table/collection scans.
- [ ] JOINs are optimized and use indexed keys.
- [ ] Aggregations are efficient and use `$match` early (MongoDB).
