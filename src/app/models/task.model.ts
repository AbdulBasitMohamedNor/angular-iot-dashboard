export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  tags: string[];
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  completed?: boolean;
  tags?: string[];
}

export interface TaskFilters {
  completed?: boolean;
  tags?: string[];
  titleContains?: string;
  sortBy?: 'priority' | 'createdAt' | 'updatedAt' | 'title';
  limit?: number;
}

export interface ComplexQuery {
  completed?: boolean;
  tags?: string[];
  titleContains?: string;
  sortBy?: 'priority' | 'createdAt' | 'updatedAt' | 'title';
  limit?: number;
}

export class TaskValidator {
  static validateTask(task: Partial<Task>): void {
    if (!task.title || task.title.trim() === '') {
      throw new Error('Invalid task data: Title cannot be empty');
    }
    
    if (task.priority !== undefined && task.priority < 0) {
      throw new Error('Invalid task data: Priority cannot be negative');
    }
    
    if (task.tags && !Array.isArray(task.tags)) {
      throw new Error('Invalid task data: Tags must be an array');
    }
  }
  
  static validateCreateRequest(request: CreateTaskRequest): void {
    if (!request.title || request.title.trim() === '') {
      throw new Error('Title is required');
    }
    
    if (request.tags && !Array.isArray(request.tags)) {
      throw new Error('Tags must be an array');
    }
  }
}

export class TaskUtils {
  static generateId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  static createTask(request: CreateTaskRequest): Task {
    TaskValidator.validateCreateRequest(request);
    
    const now = new Date();
    return {
      id: TaskUtils.generateId(),
      title: request.title.trim(),
      description: request.description || '',
      completed: false,
      priority: 0,
      tags: request.tags || [],
      createdAt: now,
      updatedAt: now
    };
  }
  
  static updateTask(existing: Task, updates: UpdateTaskRequest): Task {
    const updated: Task = { ...existing, updatedAt: new Date() };
    
    if (updates.title !== undefined) {
      updated.title = updates.title.trim();
    }
    
    if (updates.description !== undefined) {
      updated.description = updates.description;
    }
    
    if (updates.completed !== undefined) {
      updated.completed = updates.completed;
    }
    
    if (updates.tags !== undefined) {
      updated.tags = updates.tags;
    }
    
    TaskValidator.validateTask(updated);
    return updated;
  }
  
  static matchesFilters(task: Task, filters: TaskFilters): boolean {
    if (filters.completed !== undefined && task.completed !== filters.completed) {
      return false;
    }
    
    if (filters.tags && filters.tags.length > 0) {
      const hasAllTags = filters.tags.every(tag => task.tags.includes(tag));
      if (!hasAllTags) {
        return false;
      }
    }
    
    if (filters.titleContains) {
      const searchTerm = filters.titleContains.toLowerCase();
      const titleMatch = task.title.toLowerCase().includes(searchTerm);
      const descriptionMatch = task.description.toLowerCase().includes(searchTerm);
      if (!titleMatch && !descriptionMatch) {
        return false;
      }
    }
    
    return true;
  }
  
  static sortTasks(tasks: Task[], sortBy: string = 'priority'): Task[] {
    return [...tasks].sort((a, b) => {
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
  }
}