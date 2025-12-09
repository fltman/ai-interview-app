/**
 * Storage utilities and constants for the AI Interview App
 */

import { Settings } from '../types/index';

/**
 * LocalStorage keys
 */
export const STORAGE_KEYS = {
  SETTINGS: 'ai-interview-settings',
  LAST_INTERVIEW_CONFIG: 'ai-interview:last-config',
  UI_PREFERENCES: 'ai-interview:ui-prefs',
} as const;

/**
 * IndexedDB configuration
 */
export const DB_CONFIG = {
  NAME: 'ai-interview-db',
  VERSION: 1,
  STORES: {
    INTERVIEWS: 'interviews',
    DOCUMENTS: 'documents',
  },
} as const;

/**
 * Default UI preferences
 */
export const DEFAULT_UI_PREFS = {
  theme: 'light' as const,
  language: 'en-US' as const,
  compactMode: false,
};

/**
 * Type for migration functions
 */
export type Migration = (db: IDBDatabase) => void | Promise<void>;

/**
 * Database migrations
 */
export const MIGRATIONS: Record<number, Migration> = {
  1: (db) => {
    // Create object stores for version 1
    if (!db.objectStoreNames.contains(DB_CONFIG.STORES.INTERVIEWS)) {
      const interviewStore = db.createObjectStore(
        DB_CONFIG.STORES.INTERVIEWS,
        { keyPath: 'id' }
      );
      interviewStore.createIndex('createdAt', 'createdAt', { unique: false });
      interviewStore.createIndex('status', 'status', { unique: false });
    }

    if (!db.objectStoreNames.contains(DB_CONFIG.STORES.DOCUMENTS)) {
      const documentStore = db.createObjectStore(
        DB_CONFIG.STORES.DOCUMENTS,
        { keyPath: 'id' }
      );
      documentStore.createIndex('interviewId', 'interviewId', {
        unique: false,
      });
    }
  },
};

/**
 * Verify if localStorage is available (handles SSR)
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const test = '__localStorage_test__';
    window.localStorage.setItem(test, test);
    window.localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Verify if IndexedDB is available
 */
export function isIndexedDBAvailable(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate settings object
 */
export function validateSettings(settings: unknown): settings is Settings {
  if (!settings || typeof settings !== 'object') {
    return false;
  }

  const s = settings as Record<string, unknown>;

  return (
    typeof s.apiKey === 'string' &&
    typeof s.voice === 'string' &&
    typeof s.systemPrompt === 'string' &&
    Array.isArray(s.questions) &&
    typeof s.documentTemplate === 'string' &&
    typeof s.language === 'string'
  );
}
