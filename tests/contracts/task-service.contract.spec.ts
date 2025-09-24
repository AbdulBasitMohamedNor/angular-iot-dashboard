import { TestBed } from '@angular/core/testing';
import { TaskService } from '../../src/app/services/task.service';
import { Task } from '../../src/app/models/task.model';

describe('TaskService Contract Tests - CRUD Operations', () => {
  let service: TaskService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TaskService);
  });

  describe('createTask', () => {
    it('should create task with auto-generated ID and priority', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        tags: ['test']
      };

      const task = await service.createTask(taskData);

      expect(task.id).toBeDefined();
      expect(task.title).toBe('Test Task');
      expect(task.description).toBe('Test Description');
      expect(task.tags).toEqual(['test']);
      expect(task.createdAt).toBeInstanceOf(Date);
      expect(task.updatedAt).toBeInstanceOf(Date);
      expect(task.priority).toBeGreaterThanOrEqual(0);
      expect(task.completed).toBe(false);
    });

    it('should complete in less than 100ms', async () => {
      const start = performance.now();
      
      await service.createTask({ title: 'Performance Test' });
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('should reject empty title', async () => {
      await expect(service.createTask({ title: '' }))
        .rejects.toThrow('Title cannot be empty');
    });

    it('should reject title longer than 200 characters', async () => {
      const longTitle = 'a'.repeat(201);
      await expect(service.createTask({ title: longTitle }))
        .rejects.toThrow('Title must be 200 characters or less');
    });
  });

  describe('updateTask', () => {
    it('should update existing task and update timestamp', async () => {
      const originalTask = await service.createTask({ title: 'Original' });
      const originalUpdatedAt = originalTask.updatedAt;
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const updatedTask = await service.updateTask(originalTask.id, {
        title: 'Updated Title',
        completed: true
      });

      expect(updatedTask.id).toBe(originalTask.id);
      expect(updatedTask.title).toBe('Updated Title');
      expect(updatedTask.completed).toBe(true);
      expect(updatedTask.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should throw error for non-existent task', async () => {
      await expect(service.updateTask('non-existent-id', { title: 'Test' }))
        .rejects.toThrow('Task not found');
    });
  });

  describe('deleteTask', () => {
    it('should remove task from storage', async () => {
      const task = await service.createTask({ title: 'To Delete' });
      
      await service.deleteTask(task.id);
      
      const retrievedTask = await service.getTask(task.id);
      expect(retrievedTask).toBeNull();
    });

    it('should update priorities of remaining tasks', async () => {
      const task1 = await service.createTask({ title: 'Task 1' });
      const task2 = await service.createTask({ title: 'Task 2' });
      const task3 = await service.createTask({ title: 'Task 3' });
      
      // Delete middle task
      await service.deleteTask(task2.id);
      
      const tasks = await service.getAllTasks();
      expect(tasks).toHaveLength(2);
      expect(tasks[0].priority).toBe(0);
      expect(tasks[1].priority).toBe(1);
    });
  });

  describe('getTask', () => {
    it('should return task by ID', async () => {
      const createdTask = await service.createTask({ title: 'Find Me' });
      
      const foundTask = await service.getTask(createdTask.id);
      
      expect(foundTask).not.toBeNull();
      expect(foundTask?.id).toBe(createdTask.id);
      expect(foundTask?.title).toBe('Find Me');
    });

    it('should return null for non-existent task', async () => {
      const task = await service.getTask('non-existent-id');
      expect(task).toBeNull();
    });
  });

  describe('getAllTasks', () => {
    it('should return tasks ordered by priority', async () => {
      await service.createTask({ title: 'Task 1' });
      await service.createTask({ title: 'Task 2' });
      await service.createTask({ title: 'Task 3' });
      
      const tasks = await service.getAllTasks();
      
      expect(tasks).toHaveLength(3);
      for (let i = 0; i < tasks.length - 1; i++) {
        expect(tasks[i].priority).toBeLessThanOrEqual(tasks[i + 1].priority);
      }
    });

    it('should return empty array when no tasks exist', async () => {
      const tasks = await service.getAllTasks();
      expect(tasks).toEqual([]);
    });
  });

  describe('Reactive Signals', () => {
    it('should provide tasks signal that updates automatically', async () => {
      const initialTasks = service.tasks();
      expect(initialTasks).toEqual([]);
      
      await service.createTask({ title: 'Signal Test' });
      
      const updatedTasks = service.tasks();
      expect(updatedTasks).toHaveLength(1);
      expect(updatedTasks[0].title).toBe('Signal Test');
    });

    it('should provide loading signal', () => {
      expect(service.loading()).toBe(false);
    });

    it('should provide error signal', () => {
      expect(service.error()).toBeNull();
    });

    it('should provide computed signals for completed and pending tasks', async () => {
      await service.createTask({ title: 'Pending Task' });
      const completedTask = await service.createTask({ title: 'Completed Task' });
      await service.updateTask(completedTask.id, { completed: true });
      
      expect(service.completedTasks()).toHaveLength(1);
      expect(service.pendingTasks()).toHaveLength(1);
      
      const stats = service.stats();
      expect(stats.total).toBe(2);
      expect(stats.completed).toBe(1);
      expect(stats.pending).toBe(1);
    });
  });
});