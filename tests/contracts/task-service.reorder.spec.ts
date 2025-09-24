import { TestBed } from '@angular/core/testing';
import { TaskService } from '../../src/app/services/task.service';

describe('TaskService Contract Tests - Reordering Performance', () => {
  let service: TaskService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TaskService);
  });

  describe('reorderTasks Performance', () => {
    it('should reorder tasks in less than 50ms', async () => {
      // Create multiple tasks
      const tasks = [];
      for (let i = 0; i < 10; i++) {
        tasks.push(await service.createTask({ title: `Task ${i}` }));
      }

      // Reverse the order
      const taskIds = tasks.reverse().map(task => task.id);
      
      const start = performance.now();
      await service.reorderTasks(taskIds);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50);
    });

    it('should maintain correct priority order after reordering', async () => {
      const task1 = await service.createTask({ title: 'Task 1' });
      const task2 = await service.createTask({ title: 'Task 2' });
      const task3 = await service.createTask({ title: 'Task 3' });

      // Reorder to [task3, task1, task2]
      await service.reorderTasks([task3.id, task1.id, task2.id]);

      const reorderedTasks = await service.getAllTasks();
      expect(reorderedTasks[0].id).toBe(task3.id);
      expect(reorderedTasks[0].priority).toBe(0);
      expect(reorderedTasks[1].id).toBe(task1.id);
      expect(reorderedTasks[1].priority).toBe(1);
      expect(reorderedTasks[2].id).toBe(task2.id);
      expect(reorderedTasks[2].priority).toBe(2);
    });

    it('should update signals reactively after reordering', async () => {
      const task1 = await service.createTask({ title: 'Task A' });
      const task2 = await service.createTask({ title: 'Task B' });
      
      const originalOrder = service.tasks().map(t => t.id);
      expect(originalOrder).toEqual([task1.id, task2.id]);

      await service.reorderTasks([task2.id, task1.id]);

      const newOrder = service.tasks().map(t => t.id);
      expect(newOrder).toEqual([task2.id, task1.id]);
    });
  });

  describe('moveTask Performance', () => {
    it('should move single task in less than 50ms', async () => {
      // Create 5 tasks
      const tasks = [];
      for (let i = 0; i < 5; i++) {
        tasks.push(await service.createTask({ title: `Task ${i}` }));
      }

      const start = performance.now();
      await service.moveTask(tasks[0].id, 3); // Move first task to position 3
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50);
    });

    it('should correctly update priorities when moving task', async () => {
      const tasks = [];
      for (let i = 0; i < 4; i++) {
        tasks.push(await service.createTask({ title: `Task ${i}` }));
      }

      // Move first task (index 0) to position 2
      await service.moveTask(tasks[0].id, 2);

      const reorderedTasks = await service.getAllTasks();
      
      // Expected order: Task1, Task2, Task0, Task3
      expect(reorderedTasks[0].id).toBe(tasks[1].id);
      expect(reorderedTasks[1].id).toBe(tasks[2].id); 
      expect(reorderedTasks[2].id).toBe(tasks[0].id);
      expect(reorderedTasks[3].id).toBe(tasks[3].id);
    });

    it('should throw error when moving non-existent task', async () => {
      await expect(service.moveTask('non-existent-id', 0))
        .rejects.toThrow('Task not found');
    });

    it('should throw error when moving to invalid position', async () => {
      const task = await service.createTask({ title: 'Test Task' });
      
      await expect(service.moveTask(task.id, -1))
        .rejects.toThrow('Invalid position');
        
      await expect(service.moveTask(task.id, 999))
        .rejects.toThrow('Invalid position');
    });
  });

  describe('Bulk Operations Performance', () => {
    it('should handle reordering of 100 tasks within performance target', async () => {
      // Create 100 tasks
      const tasks = [];
      for (let i = 0; i < 100; i++) {
        tasks.push(await service.createTask({ title: `Task ${i}` }));
      }

      // Shuffle the order
      const shuffledIds = tasks.map(t => t.id).sort(() => Math.random() - 0.5);

      const start = performance.now();
      await service.reorderTasks(shuffledIds);
      const duration = performance.now() - start;

      // Allow slightly more time for bulk operations, but still responsive
      expect(duration).toBeLessThan(200);
    });

    it('should maintain data integrity during rapid reordering', async () => {
      const tasks = [];
      for (let i = 0; i < 5; i++) {
        tasks.push(await service.createTask({ title: `Task ${i}` }));
      }

      // Perform multiple rapid reorderings
      const operations = [];
      for (let i = 0; i < 10; i++) {
        const shuffledIds = tasks.map(t => t.id).sort(() => Math.random() - 0.5);
        operations.push(service.reorderTasks(shuffledIds));
      }

      await Promise.all(operations);

      // Verify all tasks still exist with valid priorities
      const finalTasks = await service.getAllTasks();
      expect(finalTasks).toHaveLength(5);
      
      const priorities = finalTasks.map(t => t.priority).sort();
      expect(priorities).toEqual([0, 1, 2, 3, 4]);
    });
  });
});