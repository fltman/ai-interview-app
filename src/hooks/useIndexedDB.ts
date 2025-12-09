/**
 * useIndexedDB Hook
 * Manages IndexedDB operations with TypeScript support
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import {
  DB_CONFIG,
  MIGRATIONS,
  isIndexedDBAvailable,
} from '../utils/storage';
import { SavedInterview } from '../types/index';

/**
 * Define the database schema
 */
interface InterviewDBSchema extends DBSchema {
  [DB_CONFIG.STORES.INTERVIEWS]: {
    key: string;
    value: SavedInterview;
    indexes: {
      createdAt: Date;
      status: 'draft' | 'complete';
    };
  };
  [DB_CONFIG.STORES.DOCUMENTS]: {
    key: string;
    value: {
      id: string;
      interviewId: string;
      content: string;
      createdAt: Date;
    };
    indexes: {
      interviewId: string;
    };
  };
}

type DB = IDBPDatabase<InterviewDBSchema>;

/**
 * Initialize and get IndexedDB instance
 */
async function initializeDB(): Promise<DB> {
  return openDB<InterviewDBSchema>(DB_CONFIG.NAME, DB_CONFIG.VERSION, {
    upgrade(db) {
      // Run all migrations
      for (let version = 1; version <= DB_CONFIG.VERSION; version++) {
        const migration = MIGRATIONS[version];
        if (migration && !db.objectStoreNames.contains(
          DB_CONFIG.STORES.INTERVIEWS
        )) {
          migration(db as unknown as IDBDatabase);
        }
      }
    },
  });
}

/**
 * CRUD operations interface
 */
export interface IDBOperations<T> {
  get: (id: string) => Promise<T | undefined>;
  put: (value: T) => Promise<string>;
  delete: (id: string) => Promise<void>;
  getAll: () => Promise<T[]>;
  getAllByIndex: (
    indexName: string,
    value: unknown
  ) => Promise<T[]>;
  clear: () => Promise<void>;
  isAvailable: boolean;
}

/**
 * Hook for IndexedDB operations
 * Handles all CRUD operations for a specific object store
 *
 * @param storeName - The object store name
 * @returns Object with CRUD methods
 */
export function useIndexedDB<T extends { id: string }>(
  storeName: string
): IDBOperations<T> {
  const dbRef = useRef<DB | null>(null);
  const [isAvailable] = useState(() => isIndexedDBAvailable());

  // Initialize database on mount
  useEffect(() => {
    const init = async () => {
      try {
        if (isIndexedDBAvailable()) {
          dbRef.current = await initializeDB();
        }
      } catch (error) {
        console.error('Failed to initialize IndexedDB:', error);
      }
    };

    init();
  }, []);

  // Get a single record by ID
  const get = useCallback(
    async (id: string): Promise<T | undefined> => {
      try {
        if (!dbRef.current) {
          return undefined;
        }
        return await dbRef.current.get(
          storeName as never,
          id
        ) as T | undefined;
      } catch (error) {
        console.error(`Error getting record from ${storeName}:`, error);
        return undefined;
      }
    },
    [storeName]
  );

  // Create or update a record
  const put = useCallback(
    async (value: T): Promise<string> => {
      try {
        if (!dbRef.current) {
          throw new Error('IndexedDB not initialized');
        }
        const result = await dbRef.current.put(
          storeName as never,
          value as never
        );
        return String(result);
      } catch (error) {
        console.error(`Error putting record in ${storeName}:`, error);
        throw error;
      }
    },
    [storeName]
  );

  // Delete a record
  const deleteRecord = useCallback(
    async (id: string): Promise<void> => {
      try {
        if (!dbRef.current) {
          return;
        }
        await dbRef.current.delete(storeName as never, id as never);
      } catch (error) {
        console.error(`Error deleting record from ${storeName}:`, error);
        throw error;
      }
    },
    [storeName]
  );

  // Get all records
  const getAll = useCallback(async (): Promise<T[]> => {
    try {
      if (!dbRef.current) {
        return [];
      }
      return await dbRef.current.getAll(storeName as never) as T[];
    } catch (error) {
      console.error(`Error getting all records from ${storeName}:`, error);
      return [];
    }
  }, [storeName]);

  // Get records by index
  const getAllByIndex = useCallback(
    async (indexName: string, value: unknown): Promise<T[]> => {
      try {
        if (!dbRef.current) {
          return [];
        }
        return await dbRef.current.getAllFromIndex(
          storeName as never,
          indexName as never,
          value as never
        ) as T[];
      } catch (error) {
        console.error(
          `Error getting records by index from ${storeName}:`,
          error
        );
        return [];
      }
    },
    [storeName]
  );

  // Clear all records
  const clear = useCallback(async (): Promise<void> => {
    try {
      if (!dbRef.current) {
        return;
      }
      await dbRef.current.clear(storeName as never);
    } catch (error) {
      console.error(`Error clearing ${storeName}:`, error);
      throw error;
    }
  }, [storeName]);

  return {
    get,
    put,
    delete: deleteRecord,
    getAll,
    getAllByIndex,
    clear,
    isAvailable,
  };
}
