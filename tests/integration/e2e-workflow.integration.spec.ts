import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from '../../src/app/app.component';
import { TaskService } from '../../src/app/services/task.service';
import { ThemeService } from '../../src/app/services/theme.service';
import { DatabaseService } from '../../src/app/services/database.service';
import { StorageService } from '../../src/app/services/storage.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';

describe('End-to-End Workflow Tests', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let taskService: TaskService;
  let themeService: ThemeService;
  let databaseService: jasmine.SpyObj<DatabaseService>;
  let storageService: jasmine.SpyObj<StorageService>;

  beforeEach(async () => {
    const databaseServiceSpy = jasmine.createSpyObj('DatabaseService', [
      'isConnected',
      'createTask',
      'updateTask',
      'deleteTask',
      'getAllTasks',
      'getTasksByStatus',
      'clearDatabase'
    ]);

    const storageServiceSpy = jasmine.createSpyObj('StorageService', [
      'getItem',
      'setItem',
      'hasItem',
      'removeItem',
      'clear'
    ]);

    // Configure default return values
    databaseServiceSpy.isConnected.and.returnValue(Promise.resolve(true));
    databaseServiceSpy.getAllTasks.and.returnValue(Promise.resolve([]));
    storageServiceSpy.getItem.and.returnValue(null);

    await TestBed.configureTestingModule({
      imports: [AppComponent, NoopAnimationsModule],
      providers: [
        TaskService,
        ThemeService,
        { provide: DatabaseService, useValue: databaseServiceSpy },
        { provide: StorageService, useValue: storageServiceSpy }
      ]
    }).compileComponents();

    databaseService = TestBed.inject(DatabaseService) as jasmine.SpyObj<DatabaseService>;
    storageService = TestBed.inject(StorageService) as jasmine.SpyObj<StorageService>;
    taskService = TestBed.inject(TaskService);
    themeService = TestBed.inject(ThemeService);
    
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Complete Task Management Workflow', () => {
    it('should handle full task creation workflow', async () => {
      const newTask = {
        id: '1',
        title: 'Complete Project',
        description: 'Finish the todo app project',
        completed: false,
        priority: 0,
        tags: ['work', 'urgent'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock database responses
      databaseService.createTask.and.returnValue(Promise.resolve(newTask));
      databaseService.getAllTasks.and.returnValue(Promise.resolve([newTask]));

      // Create task through the UI
      const taskForm = fixture.nativeElement.querySelector('app-task-form');
      const titleInput = taskForm.querySelector('[data-testid="task-title"]');
      const descriptionInput = taskForm.querySelector('[data-testid="task-description"]');
      const tagsInput = taskForm.querySelector('[data-testid="task-tags"]');
      const submitButton = taskForm.querySelector('[data-testid="submit-task"]');

      // Fill form
      titleInput.value = 'Complete Project';
      titleInput.dispatchEvent(new Event('input'));
      
      descriptionInput.value = 'Finish the todo app project';
      descriptionInput.dispatchEvent(new Event('input'));
      
      tagsInput.value = 'work, urgent';
      tagsInput.dispatchEvent(new Event('input'));

      // Submit form
      submitButton.click();
      fixture.detectChanges();

      // Wait for async operations
      await fixture.whenStable();

      // Verify task was created
      expect(databaseService.createTask).toHaveBeenCalledWith(jasmine.objectContaining({
        title: 'Complete Project',
        description: 'Finish the todo app project',
        tags: ['work', 'urgent']
      }));

      // Verify task appears in list
      const taskList = fixture.nativeElement.querySelector('app-task-list');
      const taskItems = taskList.querySelectorAll('.task-item');
      expect(taskItems.length).toBe(1);
      
      const taskTitle = taskItems[0].querySelector('.task-title');
      expect(taskTitle.textContent.trim()).toBe('Complete Project');
    });

    it('should handle task completion workflow', async () => {
      const existingTask = {
        id: '1',
        title: 'Existing Task',
        description: 'Task description',
        completed: false,
        priority: 0,
        tags: ['test'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const completedTask = { ...existingTask, completed: true };

      // Setup initial state
      databaseService.getAllTasks.and.returnValue(Promise.resolve([existingTask]));
      databaseService.updateTask.and.returnValue(Promise.resolve(completedTask));

      // Simulate initial load
      await taskService.loadTasks();
      fixture.detectChanges();

      // Find and click task checkbox
      const taskCheckbox = fixture.nativeElement.querySelector('.task-checkbox');
      taskCheckbox.click();
      fixture.detectChanges();

      // Wait for async operations
      await fixture.whenStable();

      // Verify task was updated
      expect(databaseService.updateTask).toHaveBeenCalledWith('1', {
        completed: true
      });

      // Verify UI reflects completion
      const taskItem = fixture.nativeElement.querySelector('.task-item');
      expect(taskItem.classList.contains('completed')).toBe(true);
    });

    it('should handle task editing workflow', async () => {
      const originalTask = {
        id: '1',
        title: 'Original Title',
        description: 'Original description',
        completed: false,
        priority: 0,
        tags: ['original'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const updatedTask = {
        ...originalTask,
        title: 'Updated Title',
        description: 'Updated description',
        tags: ['updated'],
        updatedAt: new Date()
      };

      // Setup initial state
      databaseService.getAllTasks.and.returnValue(Promise.resolve([originalTask]));
      databaseService.updateTask.and.returnValue(Promise.resolve(updatedTask));

      await taskService.loadTasks();
      fixture.detectChanges();

      // Open edit dialog
      const editButton = fixture.nativeElement.querySelector('.edit-button');
      editButton.click();
      fixture.detectChanges();

      // Edit task in dialog
      const editDialog = fixture.nativeElement.querySelector('.edit-dialog');
      expect(editDialog).toBeTruthy();

      const titleInput = editDialog.querySelector('[data-testid="edit-title"]');
      const descriptionInput = editDialog.querySelector('[data-testid="edit-description"]');
      const tagsInput = editDialog.querySelector('[data-testid="edit-tags"]');

      titleInput.value = 'Updated Title';
      titleInput.dispatchEvent(new Event('input'));

      descriptionInput.value = 'Updated description';
      descriptionInput.dispatchEvent(new Event('input'));

      tagsInput.value = 'updated';
      tagsInput.dispatchEvent(new Event('input'));

      // Save changes
      const saveButton = editDialog.querySelector('[data-testid="save-changes"]');
      saveButton.click();
      fixture.detectChanges();

      await fixture.whenStable();

      // Verify task was updated
      expect(databaseService.updateTask).toHaveBeenCalledWith('1', jasmine.objectContaining({
        title: 'Updated Title',
        description: 'Updated description',
        tags: ['updated']
      }));
    });

    it('should handle task deletion workflow', async () => {
      const taskToDelete = {
        id: '1',
        title: 'Task to Delete',
        description: 'This task will be deleted',
        completed: false,
        priority: 0,
        tags: ['delete-me'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Setup initial state
      databaseService.getAllTasks.and.returnValue(Promise.resolve([taskToDelete]));
      databaseService.deleteTask.and.returnValue(Promise.resolve());

      await taskService.loadTasks();
      fixture.detectChanges();

      // Mock confirmation dialog
      spyOn(window, 'confirm').and.returnValue(true);

      // Delete task
      const deleteButton = fixture.nativeElement.querySelector('.delete-button');
      deleteButton.click();
      fixture.detectChanges();

      await fixture.whenStable();

      // Verify confirmation was shown
      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete "Task to Delete"?'
      );

      // Verify task was deleted
      expect(databaseService.deleteTask).toHaveBeenCalledWith('1');

      // Verify task removed from UI
      const taskItems = fixture.nativeElement.querySelectorAll('.task-item');
      expect(taskItems.length).toBe(0);
    });
  });

  describe('Drag and Drop Reordering Workflow', () => {
    it('should handle complete drag and drop workflow', async () => {
      const tasks = [
        {
          id: '1',
          title: 'First Task',
          description: 'First',
          completed: false,
          priority: 0,
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          title: 'Second Task',
          description: 'Second',
          completed: false,
          priority: 1,
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '3',
          title: 'Third Task',
          description: 'Third',
          completed: false,
          priority: 2,
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const reorderedTasks = [
        { ...tasks[2], priority: 0 }, // Third becomes first
        { ...tasks[0], priority: 1 }, // First becomes second
        { ...tasks[1], priority: 2 }  // Second becomes third
      ];

      // Setup initial state
      databaseService.getAllTasks.and.returnValue(Promise.resolve(tasks));
      databaseService.updateTask.and.returnValue(Promise.resolve(reorderedTasks[0]));

      await taskService.loadTasks();
      fixture.detectChanges();

      // Simulate drag and drop (move first task to last position)
      const taskList = fixture.nativeElement.querySelector('app-task-list');
      const dropList = taskList.querySelector('cdk-drop-list');

      // Create mock drag event
      const dragEvent = {
        previousIndex: 0,
        currentIndex: 2,
        item: { data: tasks[0] },
        container: dropList,
        previousContainer: dropList
      };

      // Execute drop
      await component.onTaskReorder(dragEvent);
      fixture.detectChanges();

      await fixture.whenStable();

      // Verify reordering was called
      expect(taskService.reorderTasks).toHaveBeenCalledWith(['3', '2', '1']);

      // Verify visual feedback during drag
      const dragPreview = fixture.nativeElement.querySelector('.cdk-drag-preview');
      expect(dragPreview).toBeTruthy();
    });

    it('should handle drag and drop performance', async () => {
      // Create large list for performance testing
      const largeTasks = Array.from({ length: 100 }, (_, i) => ({
        id: `task-${i}`,
        title: `Task ${i}`,
        description: `Description ${i}`,
        completed: false,
        priority: i,
        tags: [`tag-${i % 5}`],
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      databaseService.getAllTasks.and.returnValue(Promise.resolve(largeTasks));
      await taskService.loadTasks();
      fixture.detectChanges();

      const start = performance.now();

      // Simulate drag and drop
      const dragEvent = {
        previousIndex: 0,
        currentIndex: 50,
        item: { data: largeTasks[0] },
        container: null,
        previousContainer: null
      };

      await component.onTaskReorder(dragEvent);
      fixture.detectChanges();

      const duration = performance.now() - start;

      // Should handle large list reordering efficiently
      expect(duration).toBeLessThan(200); // Under 200ms for 100 items
    });
  });

  describe('Theme Management Workflow', () => {
    it('should handle complete theme switching workflow', async () => {
      // Mock available themes
      const themes = [
        { id: 'light', name: 'Light', isDark: false, primary: '#1976d2' },
        { id: 'dark', name: 'Dark', isDark: true, primary: '#90caf9' },
        { id: 'azure', name: 'Azure Blue', isDark: false, primary: '#0078d4' }
      ];

      spyOn(themeService, 'getAvailableThemes').and.returnValue(themes);
      storageService.setItem.and.stub();
      
      // Switch to dark theme
      const themeSelector = fixture.nativeElement.querySelector('.theme-selector select');
      themeSelector.value = 'dark';
      themeSelector.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      await fixture.whenStable();

      // Verify theme was persisted
      expect(storageService.setItem).toHaveBeenCalledWith('todo-app-theme', 'dark');

      // Verify CSS classes applied
      expect(document.body.classList.contains('dark-theme')).toBe(true);
      expect(document.body.classList.contains('light-theme')).toBe(false);

      // Verify CSS custom properties updated
      const rootStyles = getComputedStyle(document.documentElement);
      expect(rootStyles.getPropertyValue('--primary-color').trim()).toBe('#90caf9');
    });

    it('should persist theme across app restarts', async () => {
      // Mock stored theme
      storageService.getItem.and.returnValue('azure');
      
      // Create new component instance (simulate app restart)
      const newFixture = TestBed.createComponent(AppComponent);
      newFixture.detectChanges();

      await newFixture.whenStable();

      // Verify Azure theme was loaded
      expect(document.body.classList.contains('azure-theme')).toBe(true);
    });

    it('should handle theme switching with animations', async () => {
      const themeSelector = fixture.nativeElement.querySelector('.theme-selector select');
      
      // Enable animations for this test
      const originalAnimations = document.body.style.transition;
      document.body.style.transition = 'all 0.3s ease';

      const start = performance.now();
      
      themeSelector.value = 'dark';
      themeSelector.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      // Wait for animation to complete
      await new Promise(resolve => setTimeout(resolve, 350));
      
      const duration = performance.now() - start;

      // Verify animation completed
      expect(duration).toBeGreaterThan(300); // Animation took expected time
      expect(document.body.classList.contains('dark-theme')).toBe(true);

      // Restore original state
      document.body.style.transition = originalAnimations;
    });
  });

  describe('Search and Filter Workflow', () => {
    it('should handle complete search workflow', async () => {
      const tasks = [
        {
          id: '1',
          title: 'Project Planning',
          description: 'Plan the project structure and timeline',
          completed: false,
          priority: 0,
          tags: ['work', 'planning'],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          title: 'Buy Groceries',
          description: 'Get food for the week',
          completed: false,
          priority: 1,
          tags: ['personal', 'shopping'],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '3',
          title: 'Project Review',
          description: 'Review project progress and adjust',
          completed: true,
          priority: 2,
          tags: ['work', 'review'],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      databaseService.getAllTasks.and.returnValue(Promise.resolve(tasks));
      await taskService.loadTasks();
      fixture.detectChanges();

      // Search for "Project"
      const searchInput = fixture.nativeElement.querySelector('.search-input');
      searchInput.value = 'Project';
      searchInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      // Verify search results
      const visibleTasks = fixture.nativeElement.querySelectorAll('.task-item:not(.hidden)');
      expect(visibleTasks.length).toBe(2); // Project Planning and Project Review

      // Clear search
      const clearButton = fixture.nativeElement.querySelector('.search-clear');
      clearButton.click();
      fixture.detectChanges();

      // Verify all tasks visible again
      const allTasks = fixture.nativeElement.querySelectorAll('.task-item');
      expect(allTasks.length).toBe(3);
    });

    it('should handle combined search and filter workflow', async () => {
      const tasks = [
        {
          id: '1',
          title: 'Work Task 1',
          description: 'Important work task',
          completed: false,
          priority: 0,
          tags: ['work', 'urgent'],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          title: 'Work Task 2',
          description: 'Another work task',
          completed: true,
          priority: 1,
          tags: ['work'],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '3',
          title: 'Personal Work',
          description: 'Personal project work',
          completed: false,
          priority: 2,
          tags: ['personal'],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      databaseService.getAllTasks.and.returnValue(Promise.resolve(tasks));
      await taskService.loadTasks();
      fixture.detectChanges();

      // Apply search filter
      const searchInput = fixture.nativeElement.querySelector('.search-input');
      searchInput.value = 'Work';
      searchInput.dispatchEvent(new Event('input'));

      // Apply completion filter
      const showCompletedCheckbox = fixture.nativeElement.querySelector('#show-completed');
      showCompletedCheckbox.checked = false;
      showCompletedCheckbox.dispatchEvent(new Event('change'));

      fixture.detectChanges();

      // Should show only incomplete tasks with "Work" in title/description
      const visibleTasks = fixture.nativeElement.querySelectorAll('.task-item:not(.hidden)');
      expect(visibleTasks.length).toBe(2); // Work Task 1 and Personal Work (both incomplete)
    });
  });

  describe('Error Handling Workflows', () => {
    it('should handle database connection failures gracefully', async () => {
      databaseService.isConnected.and.returnValue(Promise.resolve(false));
      
      // Try to create a task when database is disconnected
      const taskForm = fixture.nativeElement.querySelector('app-task-form');
      const submitButton = taskForm.querySelector('[data-testid="submit-task"]');
      
      submitButton.click();
      fixture.detectChanges();

      await fixture.whenStable();

      // Verify error message is shown
      const errorMessage = fixture.nativeElement.querySelector('.error-message');
      expect(errorMessage).toBeTruthy();
      expect(errorMessage.textContent).toContain('Unable to connect to database');
    });

    it('should handle network errors during task operations', async () => {
      databaseService.createTask.and.returnValue(
        Promise.reject(new Error('Network error'))
      );

      // Attempt to create task
      const newTaskData = {
        title: 'Network Test Task',
        description: 'Testing network error handling',
        tags: ['test']
      };

      try {
        await taskService.createTask(newTaskData);
      } catch (error) {
        // Expected error
      }

      fixture.detectChanges();

      // Verify error feedback to user
      const errorSnackbar = fixture.nativeElement.querySelector('.error-snackbar');
      expect(errorSnackbar).toBeTruthy();
      expect(errorSnackbar.textContent).toContain('Failed to create task');
    });

    it('should handle storage quota exceeded gracefully', async () => {
      storageService.setItem.and.throwError(new DOMException('QuotaExceededError'));
      
      // Try to save theme preference when storage is full
      const themeSelector = fixture.nativeElement.querySelector('.theme-selector select');
      themeSelector.value = 'dark';
      themeSelector.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      await fixture.whenStable();

      // Verify fallback behavior
      const warningMessage = fixture.nativeElement.querySelector('.warning-message');
      expect(warningMessage).toBeTruthy();
      expect(warningMessage.textContent).toContain('Storage quota exceeded');
    });
  });

  describe('Performance and Scalability Workflows', () => {
    it('should handle large dataset workflow efficiently', async () => {
      // Create 1000 tasks
      const largeTasks = Array.from({ length: 1000 }, (_, i) => ({
        id: `task-${i}`,
        title: `Task ${i}`,
        description: `Description for task ${i}`,
        completed: i % 3 === 0,
        priority: i,
        tags: [`category-${i % 10}`, `priority-${i % 5}`],
        createdAt: new Date(Date.now() - i * 60000), // Spread across time
        updatedAt: new Date()
      }));

      const start = performance.now();
      
      databaseService.getAllTasks.and.returnValue(Promise.resolve(largeTasks));
      await taskService.loadTasks();
      fixture.detectChanges();
      
      const loadDuration = performance.now() - start;

      // Verify performance metrics
      expect(loadDuration).toBeLessThan(1000); // Load 1000 tasks in under 1 second

      // Test search performance on large dataset
      const searchStart = performance.now();
      
      const searchInput = fixture.nativeElement.querySelector('.search-input');
      searchInput.value = 'Task 100';
      searchInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      
      const searchDuration = performance.now() - searchStart;
      
      expect(searchDuration).toBeLessThan(100); // Search through 1000 tasks in under 100ms
    });

    it('should handle rapid user interactions without performance issues', async () => {
      const tasks = Array.from({ length: 50 }, (_, i) => ({
        id: `task-${i}`,
        title: `Task ${i}`,
        description: `Description ${i}`,
        completed: false,
        priority: i,
        tags: [`tag-${i % 5}`],
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      databaseService.getAllTasks.and.returnValue(Promise.resolve(tasks));
      await taskService.loadTasks();
      fixture.detectChanges();

      const start = performance.now();

      // Simulate rapid interactions
      for (let i = 0; i < 10; i++) {
        // Rapid theme switching
        const themeSelector = fixture.nativeElement.querySelector('.theme-selector select');
        themeSelector.value = i % 2 === 0 ? 'dark' : 'light';
        themeSelector.dispatchEvent(new Event('change'));

        // Rapid search changes
        const searchInput = fixture.nativeElement.querySelector('.search-input');
        searchInput.value = `Task ${i}`;
        searchInput.dispatchEvent(new Event('input'));

        fixture.detectChanges();
      }

      const duration = performance.now() - start;
      
      // Should handle rapid interactions smoothly
      expect(duration).toBeLessThan(500); // 10 rapid interactions in under 500ms
    });
  });
});