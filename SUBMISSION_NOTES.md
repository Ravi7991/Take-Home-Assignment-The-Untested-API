# Submission Notes

## What I'd Test Next

- Concurrent updates and assignment attempts, once storage supports concurrency.
- ISO date boundaries, timezone behavior, and very large pagination limits.
- Property-based validation for task payloads and malformed JSON content types.
- Process-level startup and graceful shutdown checks.

## What Surprised Me

The API had a usable separation between the Express app, routes, validators, and service, but no tests. Pagination skipped the first page, and the generic update spread allowed clients to mutate identity and audit metadata.

## Questions Before Production

- **Authentication and authorization:** Who may create, update, assign, complete, or delete tasks, and can users view only their own tasks?
- **Persistence:** What database and durability requirements replace the process-local array, and what migration or retention policy is needed?
- **Input validation:** What are the maximum field and pagination sizes, and must dates be strict ISO 8601 values?
- **Rate limiting:** Which clients and routes need quotas, especially writes and assignments?
- **Logging and monitoring:** Which structured logs, metrics, request IDs, and alerts are required?
- **API versioning:** Should this contract use `/v1`, and how will status values evolve?
- **Concurrency:** What should happen when two clients update or assign one task simultaneously?
- **Data consistency:** Should completion, assignment, and status transitions be audited or transactional?
- **Deployment:** Which environment variables, health checks, process manager, and scaling model will be used?
