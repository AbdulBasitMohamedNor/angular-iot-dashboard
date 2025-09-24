import { TestBed } from '@angular/core/testing';
import { DatabaseService } from '../../src/app/services/database.service';
import { Task } from '../../src/app/models/task.model';

describe('DatabaseService Contract Tests', () => {
  let service: DatabaseService;

  beforeEach(async () => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DatabaseService);
    
    // Ensure clean database for each test
    await service.clearDatabase();
  });

  afterEach(async () => {
    await service.clearDatabase();
  });

  describe('Database Connection', () => {
    it('should connect to IndexedDB successfully', async () => {
      const isConnected = await service.isConnected();
      expect(isConnected).toBe(true);
    });

    it('should have correct database name and version', async () => {
      const dbInfo = await service.getDatabaseInfo();
      expect(dbInfo.name).toBe('TodoApp');
      expect(dbInfo.version).toBeGreaterThanOrEqual(1);
    });

    it('should create required object stores', async () => {
      const storeNames = await service.getObjectStoreNames();
      expect(storeNames).toContain('tasks');
      expect(storeNames).toContain('settings');
      expect(storeNames).toContain('metadata');
    });
  });

  describe('Task Operations', () => {
    it('should create task with auto-generated ID', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        completed: false,
        priority: 0,
        tags: ['test'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const task = await service.createTask(taskData);
      
      expect(task.id).toBeDefined();
      expect(task.title).toBe('Test Task');
      expect(task.completed).toBe(false);
    });

    it('should retrieve task by ID', async () => {
      const taskData = {
        title: 'Retrieve Test',
        description: 'Test',
        completed: false,
        priority: 0,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const createdTask = await service.createTask(taskData);
      const retrievedTask = await service.getTask(createdTask.id);

      expect(retrievedTask).toBeDefined();
      expect(retrievedTask?.id).toBe(createdTask.id);
      expect(retrievedTask?.title).toBe('Retrieve Test');
    });

    it('should update existing task', async () => {
      const taskData = {
        title: 'Original Title',
        description: 'Original',
        completed: false,
        priority: 0,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const task = await service.createTask(taskData);
      const updatedTask = await service.updateTask(task.id, {
        title: 'Updated Title',
        completed: true
      });

      expect(updatedTask.title).toBe('Updated Title');
      expect(updatedTask.completed).toBe(true);
      expect(updatedTask.updatedAt.getTime()).toBeGreaterThan(task.updatedAt.getTime());
    });

    it('should delete task by ID', async () => {
      const taskData = {
        title: 'To Delete',
        description: 'Test',
        completed: false,
        priority: 0,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const task = await service.createTask(taskData);
      await service.deleteTask(task.id);

      const deletedTask = await service.getTask(task.id);
      expect(deletedTask).toBeNull();
    });

    it('should get all tasks with correct ordering', async () => {
      const tasks = [];
      for (let i = 0; i < 3; i++) {
        const task = await service.createTask({
          title: `Task ${i}`,
          description: 'Test',
          completed: false,
          priority: i,
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date()
        });
        tasks.push(task);
      }

      const allTasks = await service.getAllTasks();
      expect(allTasks).toHaveLength(3);
      
      // Should be ordered by priority
      expect(allTasks[0].priority).toBe(0);
      expect(allTasks[1].priority).toBe(1);
      expect(allTasks[2].priority).toBe(2);
    });
  });

  describe('Querying and Filtering', () => {
    beforeEach(async () => {
      // Create test data
      const testTasks = [
        { title: 'Complete Project', completed: false, tags: ['work', 'urgent'], priority: 0 },
        { title: 'Buy Groceries', completed: true, tags: ['personal'], priority: 1 },
        { title: 'Call Client', completed: false, tags: ['work'], priority: 2 },
        { title: 'Exercise', completed: false, tags: ['personal', 'health'], priority: 3 }
      ];

      for (const taskData of testTasks) {
        await service.createTask({
          ...taskData,
          description: '',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    });

    it('should filter tasks by completion status', async () => {
      const completedTasks = await service.getTasksByStatus(true);
      const incompleteTasks = await service.getTasksByStatus(false);

      expect(completedTasks).toHaveLength(1);
      expect(completedTasks[0].title).toBe('Buy Groceries');
      
      expect(incompleteTasks).toHaveLength(3);
    });

    it('should filter tasks by tags', async () => {
      const workTasks = await service.getTasksByTag('work');
      const personalTasks = await service.getTasksByTag('personal');

      expect(workTasks).toHaveLength(2);
      expect(personalTasks).toHaveLength(2);
      
      const workTitles = workTasks.map(t => t.title);
      expect(workTitles).toContain('Complete Project');
      expect(workTitles).toContain('Call Client');
    });

    it('should search tasks by title and description', async () => {
      const results = await service.searchTasks('Project');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Complete Project');
    });

    it('should get tasks with multiple tags', async () => {
      const multiTagTasks = await service.getTasksWithAllTags(['personal', 'health']);
      expect(multiTagTasks).toHaveLength(1);
      expect(multiTagTasks[0].title).toBe('Exercise');
    });

    it('should handle complex queries efficiently', async () => {
      const start = performance.now();
      
      const results = await service.complexQuery({
        completed: false,
        tags: ['work'],
        titleContains: 'C',
        sortBy: 'priority',
        limit: 10
      });
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100);
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Call Client');
    });
  });

  describe('Batch Operations', () => {
    it('should create multiple tasks in batch', async () => {
      const taskData = Array.from({ length: 10 }, (_, i) => ({
        title: `Batch Task ${i}`,
        description: 'Batch test',
        completed: false,
        priority: i,
        tags: ['batch'],
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      const start = performance.now();
      const createdTasks = await service.createTasksBatch(taskData);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(200);
      expect(createdTasks).toHaveLength(10);
      createdTasks.forEach(task => {
        expect(task.id).toBeDefined();
        expect(task.tags).toContain('batch');
      });
    });

    it('should update multiple tasks in batch', async () => {
      // Create tasks first
      const tasks = [];
      for (let i = 0; i < 5; i++) {
        const task = await service.createTask({
          title: `Task ${i}`,
          description: 'Original',
          completed: false,
          priority: i,
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date()
        });
        tasks.push(task);
      }

      // Batch update
      const updates = tasks.map(task => ({
        id: task.id,
        completed: true,
        description: 'Updated in batch'
      }));

      const start = performance.now();
      await service.updateTasksBatch(updates);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(150);

      // Verify updates
      const updatedTasks = await service.getAllTasks();
      updatedTasks.forEach(task => {
        expect(task.completed).toBe(true);
        expect(task.description).toBe('Updated in batch');
      });
    });

    it('should delete multiple tasks in batch', async () => {
      // Create tasks
      const tasks = [];
      for (let i = 0; i < 5; i++) {
        const task = await service.createTask({
          title: `Task ${i}`,
          description: 'To delete',
          completed: false,
          priority: i,
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date()
        });
        tasks.push(task);
      }

      const taskIds = tasks.map(t => t.id);
      
      const start = performance.now();
      await service.deleteTasksBatch(taskIds);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);

      const remainingTasks = await service.getAllTasks();
      expect(remainingTasks).toHaveLength(0);
    });
  });

  describe('Data Integrity and Transactions', () => {
    it('should handle transaction rollback on error', async () => {
      const taskData = {
        title: 'Rollback Test',
        description: 'Test',
        completed: false,
        priority: 0,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      try {
        await service.performTransaction(async (transaction) => {
          await service.createTask(taskData);
          throw new Error('Simulated error');
        });
      } catch (error) {
        // Expected error
      }

      const tasks = await service.getAllTasks();
      expect(tasks).toHaveLength(0); // No task should be created due to rollback
    });

    it('should maintain referential integrity', async () => {
      const task = await service.createTask({
        title: 'Integrity Test',
        description: 'Test',
        completed: false,
        priority: 0,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Attempt to update non-existent task should fail
      await expect(service.updateTask('non-existent-id', { title: 'Updated' }))
        .rejects.toThrow('Task not found');
    });

    it('should validate data before storage', async () => {
      const invalidTask = {
        title: '', // Invalid: empty title
        description: 'Test',
        completed: false,
        priority: -1, // Invalid: negative priority
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await expect(service.createTask(invalidTask))
        .rejects.toThrow('Invalid task data');
    });
  });

  describe('Performance Requirements', () => {
    it('should handle large dataset efficiently', async () => {
      // Create 1000 tasks
      const largeBatch = Array.from({ length: 1000 }, (_, i) => ({
        title: `Large Task ${i}`,
        description: `Description ${i}`,
        completed: i % 3 === 0,
        priority: i,
        tags: [`tag${i % 10}`],
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      const start = performance.now();
      await service.createTasksBatch(largeBatch);
      const createDuration = performance.now() - start;
      
      expect(createDuration).toBeLessThan(2000); // 2 seconds for 1000 tasks

      const queryStart = performance.now();
      const allTasks = await service.getAllTasks();
      const queryDuration = performance.now() - queryStart;

      expect(queryDuration).toBeLessThan(500); // 500ms for retrieval
      expect(allTasks).toHaveLength(1000);
    });

    it('should maintain performance with complex queries', async () => {
      // Create diverse dataset
      for (let i = 0; i < 100; i++) {
        await service.createTask({
          title: `Performance Task ${i}`,
          description: `Description with keywords like urgent, important, meeting, call ${i}`,
          completed: i % 4 === 0,
          priority: i,
          tags: [`category${i % 5}`, `status${i % 3}`, `priority${i % 4}`],
          createdAt: new Date(Date.now() - i * 1000000), // Spread across time
          updatedAt: new Date()
        });
      }

      const start = performance.now();
      
      // Complex query
      const results = await service.complexQuery({
        completed: false,
        tags: ['category1'],
        titleContains: 'Task',
        sortBy: 'createdAt',
        limit: 20
      });
      
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(100); // Complex query under 100ms
      expect(results.length).toBeGreaterThan(0);
    });
  });
});