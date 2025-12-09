/**
 * useStorage Hook
 * High-level hook combining localStorage and IndexedDB for application data
 */

import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { useIndexedDB } from './useIndexedDB';
import {
  STORAGE_KEYS,
  DB_CONFIG,
  DEFAULT_UI_PREFS,
  generateId,
  validateSettings,
} from '../utils/storage';
import { Settings, SavedInterview, DEFAULT_SETTINGS } from '../types/index';

/**
 * UI preferences stored in localStorage
 */
interface UIPreferences {
  theme: 'light' | 'dark';
  language: string;
  compactMode: boolean;
}

/**
 * High-level storage operations for the app
 */
export interface StorageOperations {
  // Settings
  saveSettings: (settings: Settings) => void;
  loadSettings: () => Settings;
  resetSettings: () => void;

  // Interviews
  saveInterview: (interview: Omit<SavedInterview, 'id'>) => Promise<string>;
  getInterviews: () => Promise<SavedInterview[]>;
  getInterview: (id: string) => Promise<SavedInterview | undefined>;
  deleteInterview: (id: string) => Promise<void>;
  updateInterview: (interview: SavedInterview) => Promise<void>;

  // UI Preferences
  saveUIPreferences: (prefs: UIPreferences) => void;
  loadUIPreferences: () => UIPreferences;

  // Utility
  clearAllData: () => Promise<void>;
  exportData: () => Promise<string>;
}

/**
 * Hook combining localStorage and IndexedDB
 * Provides a simple interface for all storage operations
 *
 * @returns Object with all storage operations
 */
export function useStorage(): StorageOperations {
  // LocalStorage hooks
  const [settings, setSettings] = useLocalStorage<Settings>(
    STORAGE_KEYS.SETTINGS,
    DEFAULT_SETTINGS
  );
  const [uiPrefs, setUIPrefs] = useLocalStorage<UIPreferences>(
    'ai-interview:ui-prefs',
    DEFAULT_UI_PREFS
  );

  // IndexedDB hook
  const interviewsDB = useIndexedDB<SavedInterview>(
    DB_CONFIG.STORES.INTERVIEWS
  );

  // Settings operations
  const saveSettings = useCallback(
    (newSettings: Settings) => {
      if (!validateSettings(newSettings)) {
        console.error('Invalid settings object');
        return;
      }
      setSettings(newSettings);
    },
    [setSettings]
  );

  const loadSettings = useCallback((): Settings => {
    return settings;
  }, [settings]);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, [setSettings]);

  // Interview operations
  const saveInterview = useCallback(
    async (
      interview: Omit<SavedInterview, 'id'>
    ): Promise<string> => {
      const id = generateId();
      const newInterview: SavedInterview = {
        ...interview,
        id,
      };
      await interviewsDB.put(newInterview);
      return id;
    },
    [interviewsDB]
  );

  const getInterviews = useCallback(async (): Promise<SavedInterview[]> => {
    return interviewsDB.getAll();
  }, [interviewsDB]);

  const getInterview = useCallback(
    async (id: string): Promise<SavedInterview | undefined> => {
      return interviewsDB.get(id);
    },
    [interviewsDB]
  );

  const deleteInterview = useCallback(
    async (id: string): Promise<void> => {
      // Show confirmation dialog in a real app
      const confirmed = window.confirm(
        'Är du säker på att du vill ta bort denna intervju?'
      );
      if (confirmed) {
        await interviewsDB.delete(id);
      }
    },
    [interviewsDB]
  );

  const updateInterview = useCallback(
    async (interview: SavedInterview): Promise<void> => {
      await interviewsDB.put(interview);
    },
    [interviewsDB]
  );

  // UI preferences
  const saveUIPreferences = useCallback(
    (prefs: UIPreferences) => {
      setUIPrefs(prefs);
    },
    [setUIPrefs]
  );

  const loadUIPreferences = useCallback((): UIPreferences => {
    return uiPrefs;
  }, [uiPrefs]);

  // Utility operations
  const clearAllData = useCallback(async (): Promise<void> => {
    const confirmed = window.confirm(
      'Vill du verkligen radera all data? Den här åtgärden kan inte ångras.'
    );
    if (!confirmed) {
      return;
    }

    try {
      // Clear localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(STORAGE_KEYS.SETTINGS);
        window.localStorage.removeItem(STORAGE_KEYS.LAST_INTERVIEW_CONFIG);
        window.localStorage.removeItem(STORAGE_KEYS.UI_PREFERENCES);
        window.localStorage.removeItem('ai-interview:ui-prefs');
      }

      // Clear IndexedDB
      await interviewsDB.clear();

      // Reset to defaults
      setSettings(DEFAULT_SETTINGS);
      setUIPrefs(DEFAULT_UI_PREFS);

      console.log('All data cleared successfully');
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }, [interviewsDB, setSettings, setUIPrefs]);

  const exportData = useCallback(async (): Promise<string> => {
    try {
      const interviews = await getInterviews();
      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        settings,
        interviews,
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }, [settings, getInterviews]);

  return {
    // Settings
    saveSettings,
    loadSettings,
    resetSettings,

    // Interviews
    saveInterview,
    getInterviews,
    getInterview,
    deleteInterview,
    updateInterview,

    // UI Preferences
    saveUIPreferences,
    loadUIPreferences,

    // Utility
    clearAllData,
    exportData,
  };
}

/**
 * Hook to access interview-specific storage
 * Useful for interview flow and management
 */
export function useInterviewStorage() {
  const storage = useStorage();

  const getCompletedInterviews = useCallback(async () => {
    const interviews = await storage.getInterviews();
    return interviews.filter((i) => i.status === 'complete');
  }, [storage]);

  const getDraftInterviews = useCallback(async () => {
    const interviews = await storage.getInterviews();
    return interviews.filter((i) => i.status === 'draft');
  }, [storage]);

  const saveCompletedInterview = useCallback(
    async (interview: Omit<SavedInterview, 'id'>) => {
      return storage.saveInterview({
        ...interview,
        status: 'complete',
      });
    },
    [storage]
  );

  return {
    ...storage,
    getCompletedInterviews,
    getDraftInterviews,
    saveCompletedInterview,
  };
}
