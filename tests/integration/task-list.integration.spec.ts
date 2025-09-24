import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskListComponent } from '../../src/app/components/task-list/task-list.component';
import { TaskService } from '../../src/app/services/task.service';
import { ThemeService } from '../../src/app/services/theme.service';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';

describe('TaskList Integration Tests', () => {
  let component: TaskListComponent;
  let fixture: ComponentFixture<TaskListComponent>;
  let taskService: jasmine.SpyObj<TaskService>;
  let themeService: jasmine.SpyObj<ThemeService>;

  const mockTasks = [
    {
      id: '1',
      title: 'First Task',
      description: 'First description',
      completed: false,
      priority: 0,
      tags: ['work'],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      id: '2',
      title: 'Second Task',
      description: 'Second description',
      completed: true,
      priority: 1,
      tags: ['personal'],
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02')
    },
    {
      id: '3',
      title: 'Third Task',
      description: 'Third description',
      completed: false,
      priority: 2,
      tags: ['urgent'],
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-03')
    }
  ];

  beforeEach(async () => {
    const taskServiceSpy = jasmine.createSpyObj('TaskService', [
      'getAllTasks',
      'createTask',
      'updateTask',
      'deleteTask',
      'reorderTasks',
      'moveTask'
    ], {
      tasks: signal(mockTasks),
      loading: signal(false)
    });

    const themeServiceSpy = jasmine.createSpyObj('ThemeService', [
      'getCurrentTheme'
    ], {
      currentTheme: signal({
        id: 'light',
        name: 'Light',
        primary: '#1976d2',
        accent: '#ff4081',
        warn: '#f44336',
        background: '#fafafa',
        surface: '#ffffff',
        surfaceVariant: '#f5f5f5',
        onPrimary: '#ffffff',
        onSurface: '#212121',
        isDark: false
      })
    });

    await TestBed.configureTestingModule({
      imports: [TaskListComponent, NoopAnimationsModule],
      providers: [
        { provide: TaskService, useValue: taskServiceSpy },
        { provide: ThemeService, useValue: themeServiceSpy }
      ]
    }).compileComponents();

    taskService = TestBed.inject(TaskService) as jasmine.SpyObj<TaskService>;
    themeService = TestBed.inject(ThemeService) as jasmine.SpyObj<ThemeService>;
    
    fixture = TestBed.createComponent(TaskListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create component successfully', () => {
      expect(component).toBeTruthy();
    });

    it('should display all tasks from service', () => {
      const taskElements = fixture.nativeElement.querySelectorAll('.task-item');
      expect(taskElements.length).toBe(3);
    });

    it('should display task titles correctly', () => {
      const taskTitles = fixture.nativeElement.querySelectorAll('.task-title');
      
      expect(taskTitles[0].textContent.trim()).toBe('First Task');
      expect(taskTitles[1].textContent.trim()).toBe('Second Task');
      expect(taskTitles[2].textContent.trim()).toBe('Third Task');
    });

    it('should display task completion status correctly', () => {
      const checkboxes = fixture.nativeElement.querySelectorAll('.task-checkbox');
      
      expect(checkboxes[0].checked).toBe(false);
      expect(checkboxes[1].checked).toBe(true);
      expect(checkboxes[2].checked).toBe(false);
    });

    it('should apply appropriate CSS classes based on completion', () => {
      const taskItems = fixture.nativeElement.querySelectorAll('.task-item');
      
      expect(taskItems[0].classList.contains('completed')).toBe(false);
      expect(taskItems[1].classList.contains('completed')).toBe(true);
      expect(taskItems[2].classList.contains('completed')).toBe(false);
    });
  });

  describe('Task Interactions', () => {
    it('should toggle task completion when checkbox clicked', async () => {
      const checkbox = fixture.nativeElement.querySelector('.task-checkbox');
      
      taskService.updateTask.and.returnValue(Promise.resolve({
        ...mockTasks[0],
        completed: true
      }));

      checkbox.click();
      fixture.detectChanges();

      expect(taskService.updateTask).toHaveBeenCalledWith('1', {
        completed: true
      });
    });

    it('should open edit dialog when edit button clicked', () => {
      spyOn(component, 'openEditDialog');
      
      const editButton = fixture.nativeElement.querySelector('.edit-button');
      editButton.click();

      expect(component.openEditDialog).toHaveBeenCalledWith(mockTasks[0]);
    });

    it('should delete task when delete button clicked', async () => {
      spyOn(window, 'confirm').and.returnValue(true);
      taskService.deleteTask.and.returnValue(Promise.resolve());
      
      const deleteButton = fixture.nativeElement.querySelector('.delete-button');
      deleteButton.click();

      expect(window.confirm).toHaveBeenCalled();
      expect(taskService.deleteTask).toHaveBeenCalledWith('1');
    });

    it('should not delete task when confirmation canceled', async () => {
      spyOn(window, 'confirm').and.returnValue(false);
      
      const deleteButton = fixture.nativeElement.querySelector('.delete-button');
      deleteButton.click();

      expect(window.confirm).toHaveBeenCalled();
      expect(taskService.deleteTask).not.toHaveBeenCalled();
    });
  });

  describe('Drag and Drop Functionality', () => {
    it('should handle drag and drop reordering', async () => {
      taskService.reorderTasks.and.returnValue(Promise.resolve());
      
      const dragEvent: CdkDragDrop<any[]> = {
        previousIndex: 0,
        currentIndex: 2,
        item: null as any,
        container: null as any,
        previousContainer: null as any,
        isPointerOverContainer: true,
        distance: { x: 0, y: 100 },
        dropPoint: { x: 0, y: 100 }
      };

      await component.onTaskDrop(dragEvent);

      // Should reorder tasks: [2nd, 3rd, 1st]
      expect(taskService.reorderTasks).toHaveBeenCalledWith(['2', '3', '1']);
    });

    it('should not call reorderTasks when dropping in same position', async () => {
      const dragEvent: CdkDragDrop<any[]> = {
        previousIndex: 1,
        currentIndex: 1,
        item: null as any,
        container: null as any,
        previousContainer: null as any,
        isPointerOverContainer: true,
        distance: { x: 0, y: 0 },
        dropPoint: { x: 0, y: 0 }
      };

      await component.onTaskDrop(dragEvent);

      expect(taskService.reorderTasks).not.toHaveBeenCalled();
    });

    it('should show drag preview during drag operation', () => {
      const taskElement = fixture.nativeElement.querySelector('.task-item');
      
      // Simulate drag start
      const dragStartEvent = new DragEvent('dragstart');
      taskElement.dispatchEvent(dragStartEvent);
      fixture.detectChanges();

      expect(taskElement.classList.contains('cdk-drag-preview')).toBe(true);
    });

    it('should apply drag placeholder styling', () => {
      const dragList = fixture.nativeElement.querySelector('cdk-drop-list');
      expect(dragList).toBeTruthy();
      
      // Verify drag list is configured correctly
      expect(dragList.getAttribute('cdkDropList')).toBeDefined();
    });
  });

  describe('Filtering and Sorting', () => {
    it('should filter completed tasks when filter applied', () => {
      component.filterCompleted = true;
      fixture.detectChanges();

      const visibleTasks = fixture.nativeElement.querySelectorAll('.task-item:not(.hidden)');
      expect(visibleTasks.length).toBe(1); // Only completed task should be visible
    });

    it('should filter incomplete tasks when filter applied', () => {
      component.filterIncomplete = true;
      fixture.detectChanges();

      const visibleTasks = fixture.nativeElement.querySelectorAll('.task-item:not(.hidden)');
      expect(visibleTasks.length).toBe(2); // Only incomplete tasks should be visible
    });

    it('should filter by tag when tag filter applied', () => {
      component.selectedTag = 'work';
      fixture.detectChanges();

      const visibleTasks = fixture.nativeElement.querySelectorAll('.task-item:not(.hidden)');
      expect(visibleTasks.length).toBe(1); // Only work-tagged task should be visible
    });

    it('should show all tasks when no filters applied', () => {
      component.filterCompleted = false;
      component.filterIncomplete = false;
      component.selectedTag = '';
      fixture.detectChanges();

      const visibleTasks = fixture.nativeElement.querySelectorAll('.task-item');
      expect(visibleTasks.length).toBe(3);
    });
  });

  describe('Search Functionality', () => {
    it('should filter tasks by search term', () => {
      component.searchTerm = 'First';
      fixture.detectChanges();

      const visibleTasks = fixture.nativeElement.querySelectorAll('.task-item:not(.hidden)');
      expect(visibleTasks.length).toBe(1);
      
      const visibleTitle = visibleTasks[0].querySelector('.task-title');
      expect(visibleTitle.textContent.trim()).toBe('First Task');
    });

    it('should search in both title and description', () => {
      component.searchTerm = 'description';
      fixture.detectChanges();

      const visibleTasks = fixture.nativeElement.querySelectorAll('.task-item:not(.hidden)');
      expect(visibleTasks.length).toBe(3); // All tasks have "description" in description
    });

    it('should handle case-insensitive search', () => {
      component.searchTerm = 'FIRST';
      fixture.detectChanges();

      const visibleTasks = fixture.nativeElement.querySelectorAll('.task-item:not(.hidden)');
      expect(visibleTasks.length).toBe(1);
    });

    it('should clear search results when search term is empty', () => {
      component.searchTerm = 'First';
      fixture.detectChanges();
      
      let visibleTasks = fixture.nativeElement.querySelectorAll('.task-item:not(.hidden)');
      expect(visibleTasks.length).toBe(1);

      component.searchTerm = '';
      fixture.detectChanges();
      
      visibleTasks = fixture.nativeElement.querySelectorAll('.task-item');
      expect(visibleTasks.length).toBe(3);
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner when tasks are loading', () => {
      taskService.loading.set(true);
      fixture.detectChanges();

      const loadingSpinner = fixture.nativeElement.querySelector('.loading-spinner');
      expect(loadingSpinner).toBeTruthy();
    });

    it('should hide loading spinner when tasks are loaded', () => {
      taskService.loading.set(false);
      fixture.detectChanges();

      const loadingSpinner = fixture.nativeElement.querySelector('.loading-spinner');
      expect(loadingSpinner).toBeFalsy();
    });

    it('should disable interactions during loading', () => {
      taskService.loading.set(true);
      fixture.detectChanges();

      const taskItems = fixture.nativeElement.querySelectorAll('.task-item');
      taskItems.forEach((item: HTMLElement) => {
        expect(item.classList.contains('disabled')).toBe(true);
      });
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no tasks exist', () => {
      taskService.tasks.set([]);
      fixture.detectChanges();

      const emptyState = fixture.nativeElement.querySelector('.empty-state');
      expect(emptyState).toBeTruthy();
      expect(emptyState.textContent).toContain('No tasks found');
    });

    it('should show filtered empty state when no tasks match filters', () => {
      component.searchTerm = 'nonexistent';
      fixture.detectChanges();

      const emptyState = fixture.nativeElement.querySelector('.empty-state');
      expect(emptyState).toBeTruthy();
      expect(emptyState.textContent).toContain('No tasks match your search');
    });
  });

  describe('Performance Requirements', () => {
    it('should handle large task lists without performance degradation', () => {
      const largeTasks = Array.from({ length: 1000 }, (_, i) => ({
        id: `task-${i}`,
        title: `Task ${i}`,
        description: `Description ${i}`,
        completed: i % 3 === 0,
        priority: i,
        tags: [`tag-${i % 10}`],
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      const start = performance.now();
      taskService.tasks.set(largeTasks);
      fixture.detectChanges();
      const renderTime = performance.now() - start;

      expect(renderTime).toBeLessThan(1000); // Should render 1000 tasks in under 1 second
    });

    it('should handle rapid filter changes efficiently', () => {
      const start = performance.now();
      
      // Rapidly change filters
      for (let i = 0; i < 100; i++) {
        component.searchTerm = `search-${i}`;
        fixture.detectChanges();
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(500); // 100 filter changes in under 500ms
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on interactive elements', () => {
      const checkboxes = fixture.nativeElement.querySelectorAll('.task-checkbox');
      const editButtons = fixture.nativeElement.querySelectorAll('.edit-button');
      const deleteButtons = fixture.nativeElement.querySelectorAll('.delete-button');

      checkboxes.forEach((checkbox: HTMLElement) => {
        expect(checkbox.getAttribute('aria-label')).toBeTruthy();
      });

      editButtons.forEach((button: HTMLElement) => {
        expect(button.getAttribute('aria-label')).toBeTruthy();
      });

      deleteButtons.forEach((button: HTMLElement) => {
        expect(button.getAttribute('aria-label')).toBeTruthy();
      });
    });

    it('should support keyboard navigation', () => {
      const firstTask = fixture.nativeElement.querySelector('.task-item');
      const focusableElements = firstTask.querySelectorAll('[tabindex="0"]');
      
      expect(focusableElements.length).toBeGreaterThan(0);
    });

    it('should announce drag and drop operations to screen readers', () => {
      const dragList = fixture.nativeElement.querySelector('cdk-drop-list');
      expect(dragList.getAttribute('aria-describedby')).toBeTruthy();
    });
  });
});