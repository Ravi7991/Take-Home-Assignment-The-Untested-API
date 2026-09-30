const request = require('supertest');
const app = require('../src/app');
const taskService = require('../src/services/taskService');

const createTask = (overrides = {}) => request(app).post('/tasks').send({ title: 'Test task', ...overrides });

describe('Task API', () => {
  beforeEach(() => taskService._reset());

  describe('GET /tasks', () => {
    test('returns an array and supports exact status filtering', async () => {
      await createTask({ status: 'todo' });
      await createTask({ status: 'done' });
      const response = await request(app).get('/tasks?status=todo');
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({ title: 'Test task', status: 'todo' });
    });

    test('returns empty collections and rejects invalid filters', async () => {
      expect((await request(app).get('/tasks')).body).toEqual([]);
      expect((await request(app).get('/tasks?status=invalid')).status).toBe(400);
    });

    test('paginates correctly and rejects invalid values', async () => {
      for (let index = 1; index <= 3; index += 1) await createTask({ title: `Task ${index}` });
      expect((await request(app).get('/tasks?page=1&limit=2')).body).toHaveLength(2);
      expect((await request(app).get('/tasks?page=2&limit=2')).body[0].title).toBe('Task 3');
      for (const query of ['page=0', 'page=-1', 'limit=0', 'limit=abc', 'page=1.5']) {
        expect((await request(app).get(`/tasks?${query}`)).status).toBe(400);
      }
      expect((await request(app).get('/tasks?page=4&limit=2')).body).toEqual([]);
    });
  });

  describe('POST /tasks', () => {
    test('creates a task with defaults and UUID', async () => {
      const response = await createTask();
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({ title: 'Test task', status: 'todo', priority: 'medium', completedAt: null });
      expect(response.body.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(response.body.createdAt).toEqual(expect.any(String));
    });

    test.each([
      [{}, 'title'],
      [{ title: '   ' }, 'title'],
      [{ title: 'x', status: 'bad' }, 'status'],
      [{ title: 'x', priority: 'bad' }, 'priority'],
      [{ title: 'x', dueDate: 'bad' }, 'dueDate'],
    ])('rejects invalid task data %#', async (body, field) => {
      const response = await request(app).post('/tasks').send(body);
      expect(response.status).toBe(400);
      expect(response.body.error).toContain(field);
    });

    test('returns JSON for malformed request bodies', async () => {
      const response = await request(app).post('/tasks').set('Content-Type', 'application/json').send('{bad');
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Malformed JSON request body' });
    });
  });

  describe('PUT /tasks/:id', () => {
    test('updates fields without changing id or createdAt', async () => {
      const created = (await createTask()).body;
      const response = await request(app).put(`/tasks/${created.id}`).send({ title: 'Updated', id: 'bad', createdAt: 'bad' });
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ id: created.id, title: 'Updated', createdAt: created.createdAt });
    });

    test('rejects empty bodies and missing tasks', async () => {
      const created = (await createTask()).body;
      expect((await request(app).put(`/tasks/${created.id}`).send({})).status).toBe(400);
      expect((await request(app).put('/tasks/missing').send({ title: 'x' })).status).toBe(404);
    });
  });

  test('DELETE /tasks/:id deletes a task and returns 404 when absent', async () => {
    const created = (await createTask()).body;
    expect((await request(app).delete(`/tasks/${created.id}`)).status).toBe(204);
    expect((await request(app).get('/tasks')).body).toEqual([]);
    expect((await request(app).delete(`/tasks/${created.id}`)).status).toBe(404);
  });

  test('PATCH /tasks/:id/complete completes once with a stable timestamp', async () => {
    const created = (await createTask()).body;
    const first = await request(app).patch(`/tasks/${created.id}/complete`);
    const second = await request(app).patch(`/tasks/${created.id}/complete`);
    expect(first.status).toBe(200);
    expect(first.body.status).toBe('done');
    expect(second.body.completedAt).toBe(first.body.completedAt);
    expect((await request(app).patch('/tasks/missing/complete')).status).toBe(404);
  });

  test('GET /tasks/stats is resolved before the id route', async () => {
    await createTask({ status: 'todo', dueDate: '2000-01-01T00:00:00.000Z' });
    await createTask({ status: 'done' });
    const response = await request(app).get('/tasks/stats');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ todo: 1, in_progress: 0, done: 1, overdue: 1 });
  });

  describe('PATCH /tasks/:id/assign', () => {
    test('trims and stores an assignee', async () => {
      const created = (await createTask()).body;
      const response = await request(app).patch(`/tasks/${created.id}/assign`).send({ assignee: '  Ravikant  ' });
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ id: created.id, assignee: 'Ravikant' });
    });

    test('rejects invalid input, missing tasks, and reassignment', async () => {
      const created = (await createTask()).body;
      for (const body of [{}, { assignee: '' }, { assignee: '  ' }, { assignee: 42 }]) {
        expect((await request(app).patch(`/tasks/${created.id}/assign`).send(body)).status).toBe(400);
      }
      expect((await request(app).patch('/tasks/missing/assign').send({ assignee: 'Ravikant' })).status).toBe(404);
      await request(app).patch(`/tasks/${created.id}/assign`).send({ assignee: 'Ravikant' });
      const conflict = await request(app).patch(`/tasks/${created.id}/assign`).send({ assignee: 'Other' });
      expect(conflict.status).toBe(409);
      expect(conflict.body).toEqual({ error: 'Task is already assigned' });
    });
  });
});
