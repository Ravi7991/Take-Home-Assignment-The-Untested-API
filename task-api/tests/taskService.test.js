const taskService = require('../src/services/taskService');

describe('taskService', () => {
  beforeEach(() => taskService._reset());

  test('creates tasks with defaults and generated metadata', () => {
    const task = taskService.create({ title: 'Write tests' });
    expect(task).toMatchObject({ title: 'Write tests', description: '', status: 'todo', priority: 'medium', dueDate: null, completedAt: null });
    expect(task.id).toEqual(expect.any(String));
    expect(new Date(task.createdAt).toString()).not.toBe('Invalid Date');
  });

  test('gets all tasks as a copy and finds by id', () => {
    const task = taskService.create({ title: 'One' });
    const all = taskService.getAll();
    expect(all).toEqual([task]);
    all.pop();
    expect(taskService.getAll()).toHaveLength(1);
    expect(taskService.findById(task.id)).toEqual(task);
    expect(taskService.findById('missing')).toBeUndefined();
  });

  test('filters by exact status', () => {
    taskService.create({ title: 'Todo', status: 'todo' });
    taskService.create({ title: 'Progress', status: 'in_progress' });
    expect(taskService.getByStatus('todo')).toHaveLength(1);
    expect(taskService.getByStatus('in')).toHaveLength(0);
  });

  test('paginates from the first page and returns empty boundary pages', () => {
    ['One', 'Two', 'Three'].forEach((title) => taskService.create({ title }));
    expect(taskService.getPaginated(1, 2).map((task) => task.title)).toEqual(['One', 'Two']);
    expect(taskService.getPaginated(2, 2).map((task) => task.title)).toEqual(['Three']);
    expect(taskService.getPaginated(3, 2)).toEqual([]);
  });

  test('updates editable fields but preserves immutable fields', () => {
    const task = taskService.create({ title: 'Old' });
    const updated = taskService.update(task.id, { title: 'New', id: 'changed', createdAt: 'changed', status: 'done' });
    expect(updated).toMatchObject({ id: task.id, title: 'New', status: 'done', createdAt: task.createdAt });
    expect(taskService.update('missing', { title: 'Nope' })).toBeNull();
  });

  test('removes existing tasks and reports missing tasks', () => {
    const task = taskService.create({ title: 'Delete me' });
    expect(taskService.remove(task.id)).toBe(true);
    expect(taskService.remove(task.id)).toBe(false);
  });

  test('completes tasks once and keeps the completion timestamp stable', () => {
    const task = taskService.create({ title: 'Complete me', priority: 'high' });
    const completed = taskService.completeTask(task.id);
    expect(completed).toMatchObject({ status: 'done', priority: 'medium' });
    expect(completed.completedAt).toEqual(expect.any(String));
    expect(taskService.completeTask(task.id)).toEqual(completed);
    expect(taskService.completeTask('missing')).toBeNull();
  });

  test('calculates status and overdue statistics', () => {
    taskService.create({ title: 'Overdue', dueDate: '2000-01-01T00:00:00.000Z' });
    taskService.create({ title: 'Future', dueDate: '2999-01-01T00:00:00.000Z', status: 'in_progress' });
    taskService.create({ title: 'Done overdue', dueDate: '2000-01-01T00:00:00.000Z', status: 'done' });
    expect(taskService.getStats()).toEqual({ todo: 1, in_progress: 1, done: 1, overdue: 1 });
  });

  test('assigns once, rejects missing tasks, and rejects reassignment', () => {
    const task = taskService.create({ title: 'Assign me' });
    expect(taskService.assignTask(task.id, 'Ravikant')).toMatchObject({ id: task.id, assignee: 'Ravikant' });
    expect(taskService.assignTask(task.id, 'Someone else')).toBe(false);
    expect(taskService.assignTask('missing', 'Ravikant')).toBeNull();
  });
});
