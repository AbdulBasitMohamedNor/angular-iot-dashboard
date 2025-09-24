import { TestBed } from '@angular/core/testing';
import { StorageService } from '../../src/app/services/storage.service';

describe('StorageService Contract Tests', () => {
  let service: StorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StorageService);
    
    // Clear all storage before each test
    service.clear();
  });

  afterEach(() => {
    service.clear();
  });

  describe('Basic Storage Operations', () => {
    it('should store and retrieve string values', () => {
      const key = 'test-string';
      const value = 'Hello World';

      service.setItem(key, value);
      const retrieved = service.getItem(key);

      expect(retrieved).toBe(value);
    });

    it('should store and retrieve object values', () => {
      const key = 'test-object';
      const value = { name: 'Test', count: 42, active: true };

      service.setItem(key, value);
      const retrieved = service.getItem(key);

      expect(retrieved).toEqual(value);
    });

    it('should store and retrieve array values', () => {
      const key = 'test-array';
      const value = ['item1', 'item2', { nested: true }];

      service.setItem(key, value);
      const retrieved = service.getItem(key);

      expect(retrieved).toEqual(value);
    });

    it('should store and retrieve null/undefined values', () => {
      const nullKey = 'test-null';
      const undefinedKey = 'test-undefined';

      service.setItem(nullKey, null);
      service.setItem(undefinedKey, undefined);

      expect(service.getItem(nullKey)).toBeNull();
      expect(service.getItem(undefinedKey)).toBeUndefined();
    });

    it('should return null for non-existent keys', () => {
      const result = service.getItem('non-existent-key');
      expect(result).toBeNull();
    });
  });

  describe('Advanced Operations', () => {
    it('should check if key exists', () => {
      const key = 'existence-test';
      
      expect(service.hasItem(key)).toBe(false);
      
      service.setItem(key, 'value');
      expect(service.hasItem(key)).toBe(true);
      
      service.removeItem(key);
      expect(service.hasItem(key)).toBe(false);
    });

    it('should remove individual items', () => {
      const key1 = 'remove-test-1';
      const key2 = 'remove-test-2';

      service.setItem(key1, 'value1');
      service.setItem(key2, 'value2');

      expect(service.getItem(key1)).toBe('value1');
      expect(service.getItem(key2)).toBe('value2');

      service.removeItem(key1);

      expect(service.getItem(key1)).toBeNull();
      expect(service.getItem(key2)).toBe('value2'); // Should remain unchanged
    });

    it('should get all keys', () => {
      const keys = ['key1', 'key2', 'key3'];
      
      keys.forEach(key => {
        service.setItem(key, `value-${key}`);
      });

      const allKeys = service.getAllKeys();
      
      keys.forEach(key => {
        expect(allKeys).toContain(key);
      });
    });

    it('should get keys with prefix', () => {
      service.setItem('todo-theme', 'dark');
      service.setItem('todo-settings', { notifications: true });
      service.setItem('user-name', 'John');
      service.setItem('app-version', '1.0.0');

      const todoKeys = service.getKeysWithPrefix('todo-');
      
      expect(todoKeys).toHaveLength(2);
      expect(todoKeys).toContain('todo-theme');
      expect(todoKeys).toContain('todo-settings');
      expect(todoKeys).not.toContain('user-name');
      expect(todoKeys).not.toContain('app-version');
    });

    it('should clear all storage', () => {
      service.setItem('key1', 'value1');
      service.setItem('key2', 'value2');
      service.setItem('key3', 'value3');

      expect(service.getAllKeys()).toHaveLength(3);

      service.clear();

      expect(service.getAllKeys()).toHaveLength(0);
    });

    it('should clear storage with prefix', () => {
      service.setItem('todo-theme', 'dark');
      service.setItem('todo-settings', {});
      service.setItem('user-data', {});
      service.setItem('temp-cache', {});

      service.clearWithPrefix('todo-');

      expect(service.hasItem('todo-theme')).toBe(false);
      expect(service.hasItem('todo-settings')).toBe(false);
      expect(service.hasItem('user-data')).toBe(true);
      expect(service.hasItem('temp-cache')).toBe(true);
    });
  });

  describe('Data Types and Serialization', () => {
    it('should handle complex nested objects', () => {
      const key = 'complex-object';
      const value = {
        user: {
          id: 1,
          profile: {
            name: 'John Doe',
            preferences: {
              theme: 'dark',
              notifications: {
                email: true,
                push: false,
                settings: {
                  frequency: 'daily',
                  topics: ['updates', 'security']
                }
              }
            }
          }
        },
        metadata: {
          created: new Date('2024-01-01'),
          version: 1.0
        }
      };

      service.setItem(key, value);
      const retrieved = service.getItem(key);

      expect(retrieved).toEqual(value);
      expect(retrieved.user.profile.name).toBe('John Doe');
      expect(retrieved.user.profile.preferences.notifications.settings.topics).toContain('updates');
    });

    it('should handle Date objects', () => {
      const key = 'date-test';
      const date = new Date('2024-01-15T10:30:00Z');

      service.setItem(key, date);
      const retrieved = service.getItem(key);

      expect(retrieved).toEqual(date);
      expect(retrieved instanceof Date).toBe(true);
    });

    it('should handle numeric values', () => {
      const testCases = [
        { key: 'int', value: 42 },
        { key: 'float', value: 3.14159 },
        { key: 'negative', value: -100 },
        { key: 'zero', value: 0 },
        { key: 'infinity', value: Infinity },
        { key: 'nan', value: NaN }
      ];

      testCases.forEach(({ key, value }) => {
        service.setItem(key, value);
        const retrieved = service.getItem(key);
        
        if (isNaN(value)) {
          expect(isNaN(retrieved)).toBe(true);
        } else {
          expect(retrieved).toBe(value);
        }
      });
    });

    it('should handle boolean values', () => {
      service.setItem('true-value', true);
      service.setItem('false-value', false);

      expect(service.getItem('true-value')).toBe(true);
      expect(service.getItem('false-value')).toBe(false);
    });
  });

  describe('Storage Backend Integration', () => {
    it('should use localStorage when available', () => {
      // Assume localStorage is available in test environment
      const key = 'backend-test';
      const value = 'localStorage-value';

      service.setItem(key, value);

      // Check if it's actually stored in localStorage
      const directAccess = localStorage.getItem(key);
      expect(directAccess).toBeDefined();
    });

    it('should handle localStorage quota exceeded gracefully', () => {
      // Mock localStorage to throw quota exceeded error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn().mockImplementation(() => {
        throw new DOMException('QuotaExceededError', 'QuotaExceededError');
      });

      try {
        expect(() => {
          service.setItem('quota-test', 'value');
        }).toThrow('Storage quota exceeded');
      } finally {
        localStorage.setItem = originalSetItem;
      }
    });

    it('should fallback to in-memory storage when localStorage fails', () => {
      // Mock localStorage as unavailable
      const originalLocalStorage = window.localStorage;
      delete (window as any).localStorage;

      try {
        const fallbackService = TestBed.inject(StorageService);
        
        fallbackService.setItem('fallback-test', 'memory-value');
        const retrieved = fallbackService.getItem('fallback-test');
        
        expect(retrieved).toBe('memory-value');
      } finally {
        (window as any).localStorage = originalLocalStorage;
      }
    });

    it('should handle corrupted localStorage data gracefully', () => {
      // Manually corrupt localStorage data
      localStorage.setItem('corrupted-data', 'invalid-json-{');

      // Should return null for corrupted data and not throw
      const result = service.getItem('corrupted-data');
      expect(result).toBeNull();
    });
  });

  describe('Performance Requirements', () => {
    it('should perform basic operations quickly', () => {
      const key = 'performance-test';
      const value = { data: 'test-value', timestamp: Date.now() };

      // Set operation
      const setStart = performance.now();
      service.setItem(key, value);
      const setDuration = performance.now() - setStart;

      // Get operation
      const getStart = performance.now();
      service.getItem(key);
      const getDuration = performance.now() - getStart;

      expect(setDuration).toBeLessThan(10); // 10ms
      expect(getDuration).toBeLessThan(5);  // 5ms
    });

    it('should handle bulk operations efficiently', () => {
      const itemCount = 100;
      const items = Array.from({ length: itemCount }, (_, i) => ({
        key: `bulk-item-${i}`,
        value: { id: i, data: `test-data-${i}`, created: new Date() }
      }));

      // Bulk set
      const setStart = performance.now();
      items.forEach(({ key, value }) => {
        service.setItem(key, value);
      });
      const setDuration = performance.now() - setStart;

      // Bulk get
      const getStart = performance.now();
      items.forEach(({ key }) => {
        service.getItem(key);
      });
      const getDuration = performance.now() - getStart;

      expect(setDuration).toBeLessThan(500); // 500ms for 100 items
      expect(getDuration).toBeLessThan(200); // 200ms for 100 items
    });

    it('should handle large objects efficiently', () => {
      const largeObject = {
        data: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: `This is a test item with ID ${i} containing some sample text to make it larger`,
          metadata: {
            created: new Date(),
            tags: [`tag-${i}`, `category-${i % 10}`, `type-${i % 5}`],
            properties: {
              priority: i % 10,
              status: i % 3 === 0 ? 'active' : 'inactive',
              nested: {
                level1: {
                  level2: {
                    level3: `deep-value-${i}`
                  }
                }
              }
            }
          }
        }))
      };

      const start = performance.now();
      service.setItem('large-object', largeObject);
      const retrieved = service.getItem('large-object');
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100); // 100ms for large object
      expect(retrieved.data).toHaveLength(1000);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid keys gracefully', () => {
      expect(() => service.setItem('', 'value')).toThrow('Invalid key');
      expect(() => service.setItem(null as any, 'value')).toThrow('Invalid key');
      expect(() => service.setItem(undefined as any, 'value')).toThrow('Invalid key');
    });

    it('should handle circular references in objects', () => {
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;

      expect(() => {
        service.setItem('circular-test', circularObj);
      }).toThrow('Cannot store circular references');
    });

    it('should validate storage operations', () => {
      const key = 'validation-test';
      
      // Valid operation should succeed
      expect(() => service.setItem(key, 'valid')).not.toThrow();
      
      // Invalid key should fail
      expect(() => service.getItem('')).toThrow('Invalid key');
      expect(() => service.removeItem('')).toThrow('Invalid key');
    });
  });
});