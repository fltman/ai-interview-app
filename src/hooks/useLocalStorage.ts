/**
 * useLocalStorage Hook
 * Generic hook for managing localStorage with JSON serialization
 */

import { useState, useEffect, useCallback } from 'react';
import { isLocalStorageAvailable } from '../utils/storage';

/**
 * Type-safe hook for localStorage operations
 * Handles JSON serialization/deserialization
 * Syncs with storage events from other tabs/windows
 *
 * @param key - The localStorage key
 * @param initialValue - Default value if key doesn't exist
 * @returns [value, setValue] tuple similar to useState
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (!isLocalStorageAvailable()) {
        return initialValue;
      }

      const item = window.localStorage.getItem(key);
      if (item === null) {
        return initialValue;
      }

      return JSON.parse(item) as T;
    } catch (error) {
      console.error(
        `Error reading from localStorage key "${key}":`,
        error
      );
      return initialValue;
    }
  });

  // Update localStorage when value changes
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        if (!isLocalStorageAvailable()) {
          console.warn('localStorage not available');
          return;
        }

        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));

        // Dispatch custom event to sync across tabs
        window.dispatchEvent(
          new CustomEvent('local-storage', {
            detail: { key, newValue: valueToStore },
          })
        );
      } catch (error) {
        console.error(
          `Error writing to localStorage key "${key}":`,
          error
        );
      }
    },
    [key, storedValue]
  );

  // Sync across browser tabs/windows
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        try {
          setStoredValue(JSON.parse(event.newValue) as T);
        } catch (error) {
          console.error(`Error syncing localStorage key "${key}":`, error);
        }
      }
    };

    const handleCustomStorageEvent = (
      event: Event
    ) => {
      const customEvent = event as CustomEvent<{
        key: string;
        newValue: unknown;
      }>;
      if (customEvent.detail?.key === key) {
        setStoredValue(customEvent.detail.newValue as T);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage', handleCustomStorageEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage', handleCustomStorageEvent);
    };
  }, [key]);

  return [storedValue, setValue];
}
