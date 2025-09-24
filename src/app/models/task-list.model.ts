import { computed, signal, Signal } from '@angular/core';
import { Task, TaskFilters } from './task.model';

export interface TaskListStats {
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
}

export interface TaskListState {
  tasks: Task[];
  filters: TaskFilters;
  searchTerm: string;
  loading: boolean;
  error: string | null;
}

export class TaskList {
  private _tasks = signal<Task[]>([]);
  private _filters = signal<TaskFilters>({});
  private _searchTerm = signal<string>('');
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);

  // Computed properties
  readonly tasks: Signal<Task[]> = this._tasks.asReadonly();
  readonly filters: Signal<TaskFilters> = this._filters.asReadonly();
  readonly searchTerm: Signal<string> = this._searchTerm.asReadonly();
  readonly loading: Signal<boolean> = this._loading.asReadonly();
  readonly error: Signal<string | null> = this._error.asReadonly();

  readonly filteredTasks = computed(() => {
    const tasks = this._tasks();
    const filters = this._filters();
    const searchTerm = this._searchTerm().toLowerCase();

    let filtered = tasks;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchTerm) ||
        task.description.toLowerCase().includes(searchTerm) ||
        task.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Apply status filter
    if (filters.completed !== undefined) {
      filtered = filtered.filter(task => task.completed === filters.completed);
    }

    // Apply tag filters
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(task =>
        filters.tags!.every(filterTag => task.tags.includes(filterTag))
      );
    }

    // Apply title contains filter
    if (filters.titleContains) {
      const contains = filters.titleContains.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(contains) ||
        task.description.toLowerCase().includes(contains)
      );
    }

    // Apply sorting
    const sortBy = filters.sortBy || 'priority';
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return a.priority - b.priority;
        case 'createdAt':
          return a.createdAt.getTime() - b.createdAt.getTime();
        case 'updatedAt':
          return b.updatedAt.getTime() - a.updatedAt.getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return a.priority - b.priority;
      }
    });

    // Apply limit
    if (filters.limit && filters.limit > 0) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  });

  readonly stats = computed((): TaskListStats => {
    const tasks = this._tasks();
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      pending,
      completionRate
    };
  });

  readonly availableTags = computed(() => {
    const tasks = this._tasks();
    const tagSet = new Set<string>();
    
    tasks.forEach(task => {
      task.tags.forEach(tag => tagSet.add(tag));
    });
    
    return Array.from(tagSet).sort();
  });

  readonly isEmpty = computed(() => this._tasks().length === 0);

  readonly hasFilters = computed(() => {
    const filters = this._filters();
    const searchTerm = this._searchTerm();
    
    return !!(
      searchTerm ||
      filters.completed !== undefined ||
      (filters.tags && filters.tags.length > 0) ||
      filters.titleContains
    );
  });

  readonly state = computed((): TaskListState => ({
    tasks: this._tasks(),
    filters: this._filters(),
    searchTerm: this._searchTerm(),
    loading: this._loading(),
    error: this._error()
  }));

  // Mutator methods
  setTasks(tasks: Task[]): void {
    this._tasks.set(tasks);
    this._error.set(null);
  }

  addTask(task: Task): void {
    const currentTasks = this._tasks();
    this._tasks.set([...currentTasks, task]);
  }

  updateTask(taskId: string, updatedTask: Task): void {
    const currentTasks = this._tasks();
    const updatedTasks = currentTasks.map(task =>
      task.id === taskId ? updatedTask : task
    );
    this._tasks.set(updatedTasks);
  }

  removeTask(taskId: string): void {
    const currentTasks = this._tasks();
    const filteredTasks = currentTasks.filter(task => task.id !== taskId);
    this._tasks.set(filteredTasks);
  }

  reorderTasks(taskIds: string[]): void {
    const currentTasks = this._tasks();
    const taskMap = new Map(currentTasks.map(task => [task.id, task]));
    
    const reorderedTasks = taskIds
      .map(id => taskMap.get(id))
      .filter((task): task is Task => task !== undefined)
      .map((task, index) => ({
        ...task,
        priority: index,
        updatedAt: new Date()
      }));
    
    this._tasks.set(reorderedTasks);
  }

  setFilters(filters: TaskFilters): void {
    this._filters.set(filters);
  }

  updateFilters(partialFilters: Partial<TaskFilters>): void {
    const currentFilters = this._filters();
    this._filters.set({ ...currentFilters, ...partialFilters });
  }

  clearFilters(): void {
    this._filters.set({});
    this._searchTerm.set('');
  }

  setSearchTerm(term: string): void {
    this._searchTerm.set(term);
  }

  setLoading(loading: boolean): void {
    this._loading.set(loading);
  }

  setError(error: string | null): void {
    this._error.set(error);
  }

  clearError(): void {
    this._error.set(null);
  }

  // Utility methods
  getTaskById(taskId: string): Task | undefined {
    return this._tasks().find(task => task.id === taskId);
  }

  getTasksByTag(tag: string): Task[] {
    return this._tasks().filter(task => task.tags.includes(tag));
  }

  getCompletedTasks(): Task[] {
    return this._tasks().filter(task => task.completed);
  }

  getPendingTasks(): Task[] {
    return this._tasks().filter(task => !task.completed);
  }

  getTasksCreatedAfter(date: Date): Task[] {
    return this._tasks().filter(task => task.createdAt > date);
  }

  getTasksUpdatedAfter(date: Date): Task[] {
    return this._tasks().filter(task => task.updatedAt > date);
  }

  clone(): TaskList {
    const newTaskList = new TaskList();
    newTaskList.setTasks([...this._tasks()]);
    newTaskList.setFilters({ ...this._filters() });
    newTaskList.setSearchTerm(this._searchTerm());
    newTaskList.setLoading(this._loading());
    newTaskList.setError(this._error());
    return newTaskList;
  }

  // Batch operations
  markAllCompleted(): void {
    const currentTasks = this._tasks();
    const updatedTasks = currentTasks.map(task => ({
      ...task,
      completed: true,
      updatedAt: new Date()
    }));
    this._tasks.set(updatedTasks);
  }

  markAllPending(): void {
    const currentTasks = this._tasks();
    const updatedTasks = currentTasks.map(task => ({
      ...task,
      completed: false,
      updatedAt: new Date()
    }));
    this._tasks.set(updatedTasks);
  }

  deleteAllCompleted(): void {
    const currentTasks = this._tasks();
    const pendingTasks = currentTasks.filter(task => !task.completed);
    this._tasks.set(pendingTasks);
  }

  addTagToAll(tag: string): void {
    const currentTasks = this._tasks();
    const updatedTasks = currentTasks.map(task => ({
      ...task,
      tags: task.tags.includes(tag) ? task.tags : [...task.tags, tag],
      updatedAt: new Date()
    }));
    this._tasks.set(updatedTasks);
  }

  removeTagFromAll(tag: string): void {
    const currentTasks = this._tasks();
    const updatedTasks = currentTasks.map(task => ({
      ...task,
      tags: task.tags.filter(t => t !== tag),
      updatedAt: new Date()
    }));
    this._tasks.set(updatedTasks);
  }
}