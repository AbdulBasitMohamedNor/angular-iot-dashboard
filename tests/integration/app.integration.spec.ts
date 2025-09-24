import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from '../../src/app/app.component';
import { TaskService } from '../../src/app/services/task.service';
import { ThemeService } from '../../src/app/services/theme.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';

describe('App Integration Tests', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let taskService: jasmine.SpyObj<TaskService>;
  let themeService: jasmine.SpyObj<ThemeService>;

  const mockTasks = [
    {
      id: '1',
      title: 'Test Task 1',
      description: 'Description 1',
      completed: false,
      priority: 0,
      tags: ['work'],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      id: '2',
      title: 'Test Task 2',
      description: 'Description 2',
      completed: true,
      priority: 1,
      tags: ['personal'],
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02')
    }
  ];

  const mockThemes = [
    {
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
    },
    {
      id: 'dark',
      name: 'Dark',
      primary: '#90caf9',
      accent: '#f48fb1',
      warn: '#f44336',
      background: '#121212',
      surface: '#1e1e1e',
      surfaceVariant: '#2e2e2e',
      onPrimary: '#000000',
      onSurface: '#ffffff',
      isDark: true
    },
    {
      id: 'azure',
      name: 'Azure Blue',
      primary: '#0078d4',
      accent: '#40e0d0',
      warn: '#d13438',
      background: '#f8f9fa',
      surface: '#ffffff',
      surfaceVariant: '#f1f3f4',
      onPrimary: '#ffffff',
      onSurface: '#323130',
      isDark: false
    }
  ];

  beforeEach(async () => {
    const taskServiceSpy = jasmine.createSpyObj('TaskService', [
      'getAllTasks',
      'createTask',
      'updateTask',
      'deleteTask',
      'reorderTasks'
    ], {
      tasks: signal(mockTasks),
      loading: signal(false)
    });

    const themeServiceSpy = jasmine.createSpyObj('ThemeService', [
      'setTheme',
      'getAvailableThemes'
    ], {
      currentTheme: signal(mockThemes[0])
    });

    // Configure spy return values
    themeServiceSpy.getAvailableThemes.and.returnValue(mockThemes);

    await TestBed.configureTestingModule({
      imports: [AppComponent, NoopAnimationsModule],
      providers: [
        { provide: TaskService, useValue: taskServiceSpy },
        { provide: ThemeService, useValue: themeServiceSpy }
      ]
    }).compileComponents();

    taskService = TestBed.inject(TaskService) as jasmine.SpyObj<TaskService>;
    themeService = TestBed.inject(ThemeService) as jasmine.SpyObj<ThemeService>;
    
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Application Initialization', () => {
    it('should create the app component', () => {
      expect(component).toBeTruthy();
    });

    it('should have correct title', () => {
      expect(component.title).toBe('Personal Todo App');
    });

    it('should render main layout elements', () => {
      const headerElement = fixture.nativeElement.querySelector('.app-header');
      const mainContent = fixture.nativeElement.querySelector('.app-main');
      const sidebar = fixture.nativeElement.querySelector('.app-sidebar');

      expect(headerElement).toBeTruthy();
      expect(mainContent).toBeTruthy();
      expect(sidebar).toBeTruthy();
    });

    it('should display app title in header', () => {
      const titleElement = fixture.nativeElement.querySelector('.app-title');
      expect(titleElement).toBeTruthy();
      expect(titleElement.textContent.trim()).toBe('Personal Todo App');
    });

    it('should initialize with proper theme', () => {
      expect(component.currentTheme()).toEqual(mockThemes[0]);
      
      const bodyElement = document.body;
      expect(bodyElement.classList.contains('light-theme')).toBe(true);
    });
  });

  describe('Theme Integration', () => {
    it('should display theme selector in header', () => {
      const themeSelector = fixture.nativeElement.querySelector('.theme-selector');
      expect(themeSelector).toBeTruthy();
    });

    it('should show all available themes in selector', () => {
      const themeOptions = fixture.nativeElement.querySelectorAll('.theme-option');
      expect(themeOptions.length).toBe(3);
      
      expect(themeOptions[0].textContent.trim()).toBe('Light');
      expect(themeOptions[1].textContent.trim()).toBe('Dark');
      expect(themeOptions[2].textContent.trim()).toBe('Azure Blue');
    });

    it('should switch theme when theme selector used', async () => {
      themeService.setTheme.and.returnValue(Promise.resolve());
      
      const themeSelector = fixture.nativeElement.querySelector('.theme-selector select');
      themeSelector.value = 'dark';
      themeSelector.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      expect(themeService.setTheme).toHaveBeenCalledWith('dark');
    });

    it('should update theme reactively when theme service changes', () => {
      themeService.currentTheme.set(mockThemes[1]); // Dark theme
      fixture.detectChanges();

      const bodyElement = document.body;
      expect(bodyElement.classList.contains('dark-theme')).toBe(true);
      expect(bodyElement.classList.contains('light-theme')).toBe(false);
    });

    it('should apply CSS custom properties based on theme', () => {
      themeService.currentTheme.set(mockThemes[1]); // Dark theme
      fixture.detectChanges();

      const rootElement = document.documentElement;
      const primaryColor = getComputedStyle(rootElement).getPropertyValue('--primary-color').trim();
      
      expect(primaryColor).toBe(mockThemes[1].primary);
    });
  });

  describe('Task Management Integration', () => {
    it('should display task list component', () => {
      const taskList = fixture.nativeElement.querySelector('app-task-list');
      expect(taskList).toBeTruthy();
    });

    it('should display task creation form', () => {
      const taskForm = fixture.nativeElement.querySelector('app-task-form');
      expect(taskForm).toBeTruthy();
    });

    it('should show task statistics in sidebar', () => {
      const statsContainer = fixture.nativeElement.querySelector('.task-stats');
      expect(statsContainer).toBeTruthy();
      
      const totalTasks = fixture.nativeElement.querySelector('.total-tasks');
      const completedTasks = fixture.nativeElement.querySelector('.completed-tasks');
      const pendingTasks = fixture.nativeElement.querySelector('.pending-tasks');

      expect(totalTasks.textContent).toContain('2');
      expect(completedTasks.textContent).toContain('1');
      expect(pendingTasks.textContent).toContain('1');
    });

    it('should update statistics when tasks change', () => {
      const newTasks = [
        ...mockTasks,
        {
          id: '3',
          title: 'New Task',
          description: 'New Description',
          completed: false,
          priority: 2,
          tags: ['new'],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      taskService.tasks.set(newTasks);
      fixture.detectChanges();

      const totalTasks = fixture.nativeElement.querySelector('.total-tasks');
      const pendingTasks = fixture.nativeElement.querySelector('.pending-tasks');

      expect(totalTasks.textContent).toContain('3');
      expect(pendingTasks.textContent).toContain('2');
    });

    it('should handle task creation from form', async () => {
      const newTask = {
        id: '3',
        title: 'Created Task',
        description: 'Created Description',
        completed: false,
        priority: 2,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      taskService.createTask.and.returnValue(Promise.resolve(newTask));
      
      await component.onTaskCreate({
        title: 'Created Task',
        description: 'Created Description',
        tags: []
      });

      expect(taskService.createTask).toHaveBeenCalled();
    });
  });

  describe('Sidebar Functionality', () => {
    it('should toggle sidebar when menu button clicked', () => {
      const menuButton = fixture.nativeElement.querySelector('.menu-toggle');
      const sidebar = fixture.nativeElement.querySelector('.app-sidebar');

      expect(menuButton).toBeTruthy();
      expect(sidebar.classList.contains('open')).toBe(true); // Default state

      menuButton.click();
      fixture.detectChanges();

      expect(sidebar.classList.contains('open')).toBe(false);
    });

    it('should display filter options in sidebar', () => {
      const filterOptions = fixture.nativeElement.querySelector('.filter-options');
      expect(filterOptions).toBeTruthy();

      const showCompleted = fixture.nativeElement.querySelector('#show-completed');
      const showPending = fixture.nativeElement.querySelector('#show-pending');
      const tagFilter = fixture.nativeElement.querySelector('.tag-filter');

      expect(showCompleted).toBeTruthy();
      expect(showPending).toBeTruthy();
      expect(tagFilter).toBeTruthy();
    });

    it('should apply filters to task list', () => {
      const showCompletedCheckbox = fixture.nativeElement.querySelector('#show-completed');
      
      showCompletedCheckbox.checked = false;
      showCompletedCheckbox.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      expect(component.filterOptions.showCompleted).toBe(false);
    });

    it('should display available tags in filter', () => {
      const tagOptions = fixture.nativeElement.querySelectorAll('.tag-option');
      
      // Should show unique tags from all tasks
      const expectedTags = ['work', 'personal'];
      expect(tagOptions.length).toBeGreaterThanOrEqual(expectedTags.length);
    });
  });

  describe('Search Functionality', () => {
    it('should display search input in header', () => {
      const searchInput = fixture.nativeElement.querySelector('.search-input');
      expect(searchInput).toBeTruthy();
      expect(searchInput.placeholder).toContain('Search tasks');
    });

    it('should filter tasks based on search input', () => {
      const searchInput = fixture.nativeElement.querySelector('.search-input');
      
      searchInput.value = 'Task 1';
      searchInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(component.searchTerm).toBe('Task 1');
    });

    it('should clear search when clear button clicked', () => {
      component.searchTerm = 'test search';
      fixture.detectChanges();

      const clearButton = fixture.nativeElement.querySelector('.search-clear');
      expect(clearButton).toBeTruthy();

      clearButton.click();
      fixture.detectChanges();

      expect(component.searchTerm).toBe('');
    });

    it('should show search suggestions when typing', () => {
      const searchInput = fixture.nativeElement.querySelector('.search-input');
      
      searchInput.value = 'Tes';
      searchInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      const suggestions = fixture.nativeElement.querySelector('.search-suggestions');
      expect(suggestions).toBeTruthy();
    });
  });

  describe('Responsive Layout', () => {
    it('should adapt layout for mobile screens', () => {
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 768 });
      window.dispatchEvent(new Event('resize'));
      fixture.detectChanges();

      const appContainer = fixture.nativeElement.querySelector('.app-container');
      expect(appContainer.classList.contains('mobile-layout')).toBe(true);
    });

    it('should collapse sidebar on mobile by default', () => {
      Object.defineProperty(window, 'innerWidth', { value: 600 });
      window.dispatchEvent(new Event('resize'));
      fixture.detectChanges();

      const sidebar = fixture.nativeElement.querySelector('.app-sidebar');
      expect(sidebar.classList.contains('collapsed')).toBe(true);
    });

    it('should show overlay when sidebar open on mobile', () => {
      Object.defineProperty(window, 'innerWidth', { value: 600 });
      component.sidebarOpen = true;
      fixture.detectChanges();

      const overlay = fixture.nativeElement.querySelector('.sidebar-overlay');
      expect(overlay).toBeTruthy();
    });

    it('should close sidebar when overlay clicked on mobile', () => {
      Object.defineProperty(window, 'innerWidth', { value: 600 });
      component.sidebarOpen = true;
      fixture.detectChanges();

      const overlay = fixture.nativeElement.querySelector('.sidebar-overlay');
      overlay.click();
      fixture.detectChanges();

      expect(component.sidebarOpen).toBe(false);
    });
  });

  describe('Accessibility Features', () => {
    it('should have proper heading hierarchy', () => {
      const h1 = fixture.nativeElement.querySelector('h1');
      const h2Elements = fixture.nativeElement.querySelectorAll('h2');

      expect(h1).toBeTruthy();
      expect(h2Elements.length).toBeGreaterThan(0);
    });

    it('should have skip to content link', () => {
      const skipLink = fixture.nativeElement.querySelector('.skip-to-content');
      expect(skipLink).toBeTruthy();
      expect(skipLink.getAttribute('href')).toBe('#main-content');
    });

    it('should have proper ARIA landmarks', () => {
      const header = fixture.nativeElement.querySelector('[role="banner"]');
      const main = fixture.nativeElement.querySelector('[role="main"]');
      const sidebar = fixture.nativeElement.querySelector('[role="complementary"]');

      expect(header).toBeTruthy();
      expect(main).toBeTruthy();
      expect(sidebar).toBeTruthy();
    });

    it('should support keyboard navigation for menu toggle', () => {
      const menuButton = fixture.nativeElement.querySelector('.menu-toggle');
      
      expect(menuButton.getAttribute('tabindex')).toBe('0');
      expect(menuButton.getAttribute('role')).toBe('button');
      expect(menuButton.getAttribute('aria-label')).toBeTruthy();
    });

    it('should announce dynamic content changes', () => {
      const liveRegion = fixture.nativeElement.querySelector('[aria-live]');
      expect(liveRegion).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('should render initial view quickly', () => {
      const start = performance.now();
      
      const testBed = TestBed.createComponent(AppComponent);
      testBed.detectChanges();
      
      const renderTime = performance.now() - start;
      expect(renderTime).toBeLessThan(100); // Should render in under 100ms
    });

    it('should handle theme switching without delay', async () => {
      const start = performance.now();
      
      themeService.setTheme.and.returnValue(Promise.resolve());
      await component.onThemeChange('dark');
      fixture.detectChanges();
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(50); // Theme switch under 50ms
    });

    it('should efficiently update when task count changes', () => {
      const largeTasks = Array.from({ length: 1000 }, (_, i) => ({
        id: `task-${i}`,
        title: `Task ${i}`,
        description: `Description ${i}`,
        completed: i % 2 === 0,
        priority: i,
        tags: [`tag-${i % 5}`],
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      const start = performance.now();
      taskService.tasks.set(largeTasks);
      fixture.detectChanges();
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(200); // Handle 1000 tasks in under 200ms
    });
  });

  describe('Error Handling', () => {
    it('should handle task service errors gracefully', async () => {
      taskService.createTask.and.returnValue(Promise.reject(new Error('Service unavailable')));
      
      spyOn(component, 'showErrorMessage');
      
      await component.onTaskCreate({
        title: 'Test Task',
        description: 'Test',
        tags: []
      });

      expect(component.showErrorMessage).toHaveBeenCalledWith('Failed to create task');
    });

    it('should handle theme service errors gracefully', async () => {
      themeService.setTheme.and.returnValue(Promise.reject(new Error('Theme not found')));
      
      spyOn(component, 'showErrorMessage');
      
      await component.onThemeChange('invalid-theme');

      expect(component.showErrorMessage).toHaveBeenCalledWith('Failed to change theme');
    });

    it('should display error messages to user', () => {
      component.showErrorMessage('Test error message');
      fixture.detectChanges();

      const errorMessage = fixture.nativeElement.querySelector('.error-message');
      expect(errorMessage).toBeTruthy();
      expect(errorMessage.textContent).toContain('Test error message');
    });
  });
});