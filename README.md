# Task Manager API

An Express REST API backed by an in-memory task store. The application exports a testable Express instance from `task-api/src/app.js`; `npm start` starts the HTTP server.

## Setup

```bash
cd task-api
npm install
npm start
```

The server listens on `http://localhost:3000` by default. Tests use Supertest against the exported app and do not open a network port:

```bash
npm test
npm run coverage
```

## Task Shape

```json
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "status": "todo | in_progress | done",
  "priority": "low | medium | high",
  "dueDate": "ISO date string | null",
  "completedAt": "ISO date string | null",
  "createdAt": "ISO date string",
  "assignee": "string (optional)"
}
```

## Endpoints

| Method | Path | Behavior |
| --- | --- | --- |
| `GET` | `/tasks` | Lists tasks; supports exact `status` and one-based `page`/`limit` filters. |
| `POST` | `/tasks` | Creates a task with UUID and defaults. |
| `PUT` | `/tasks/:id` | Updates editable fields only. |
| `DELETE` | `/tasks/:id` | Deletes a task and returns `204`. |
| `PATCH` | `/tasks/:id/complete` | Marks a task done and sets `completedAt`. |
| `GET` | `/tasks/stats` | Returns status counts and active overdue count. |
| `PATCH` | `/tasks/:id/assign` | Assigns an unassigned task to a trimmed name. |

### Create example

```json
POST /tasks
{ "title": "Write tests", "priority": "high" }
```

Returns `201` with the generated task. Defaults are status `todo`, priority `medium`, empty description, and `null` due date.

### Assignment example

```json
PATCH /tasks/<id>/assign
{ "assignee": "Ravikant" }
```

Invalid input returns `400`, an unknown task returns `404`, and reassignment returns `409 Conflict`.

## Validation and Errors

Invalid task fields, status filters, pagination values, empty update bodies, and malformed JSON return `400` with `{ "error": "..." }`. Missing resources return `404`; server failures return `500`. Completion is idempotent and preserves its original timestamp. PUT cannot modify `id`, `createdAt`, `completedAt`, or `assignee`.

## Test Evidence

The suite contains unit tests for every exported service function and Supertest integration tests for every endpoint. The verified coverage run reports 26 passing tests and 0 failures: 94.85% statements, 89.34% branches, 96.87% functions, and 94.23% lines.

See [task-api/BUG_REPORT.md](task-api/BUG_REPORT.md) and [SUBMISSION_NOTES.md](SUBMISSION_NOTES.md) for verified defects, the regression fix, and production questions.
