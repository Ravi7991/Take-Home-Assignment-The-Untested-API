# Bug Report

## BUG-001: First pagination page skipped

**Severity:** High  
**Affected Endpoint:** `GET /tasks?page=1&limit=10`, `taskService.getPaginated`  
**Expected Behavior:** Page 1 starts at the first task.  
**Actual Behavior:** The original offset was `page * limit`, so page 1 started at item 11.  
**Steps to Reproduce:** Create three tasks, request `GET /tasks?page=1&limit=2`, and observe an empty result.  
**Discovery Method:** Regression test in `tests/taskService.test.js` and integration test in `tests/tasks.integration.test.js`.  
**Root Cause:** Zero-based slice offsets were calculated from a one-based API page number.  
**Suggested Fix:** Use `(page - 1) * limit`.  
**Status:** Fixed

## BUG-002: Status filtering matched partial values

**Severity:** Medium  
**Affected Endpoint:** `GET /tasks?status=...`, `taskService.getByStatus`  
**Expected Behavior:** Only tasks with the requested status are returned.  
**Actual Behavior:** The original implementation used `includes`, allowing partial values such as `in` to match `in_progress`.  
**Steps to Reproduce:** Create an `in_progress` task and call `taskService.getByStatus('in')` or use an equivalent route value.  
**Discovery Method:** Unit test for exact filtering.  
**Root Cause:** Substring matching was used instead of equality.  
**Suggested Fix:** Compare `task.status === status` and validate route values.  
**Status:** Fixed

## BUG-003: PUT could overwrite immutable task fields

**Severity:** High  
**Affected Endpoint:** `PUT /tasks/:id`, `taskService.update`  
**Expected Behavior:** A task update changes editable fields only; `id` and `createdAt` remain stable.  
**Actual Behavior:** Spreading the entire request body allowed callers to replace `id`, `createdAt`, `completedAt`, or other internal fields.  
**Steps to Reproduce:** Create a task and PUT `{ "title": "Updated", "id": "changed", "createdAt": "changed" }`.  
**Discovery Method:** Unit and integration tests asserting immutable metadata.  
**Root Cause:** The service merged all supplied fields without an allowlist.  
**Suggested Fix:** Copy only documented editable fields.  
**Status:** Fixed

## BUG-004: Invalid pagination values were silently coerced

**Severity:** Medium  
**Affected Endpoint:** `GET /tasks?page=...&limit=...`  
**Expected Behavior:** Invalid, zero, negative, or non-integer pagination values return 400.  
**Actual Behavior:** `parseInt(...) || default` converted invalid values to defaults, hiding client errors.  
**Steps to Reproduce:** Request `GET /tasks?page=abc` or `GET /tasks?limit=0`.  
**Discovery Method:** Integration tests for invalid pagination.  
**Root Cause:** Fallback coercion occurred before validation.  
**Suggested Fix:** Parse with `Number`, validate positive integers, then paginate.  
**Status:** Fixed
