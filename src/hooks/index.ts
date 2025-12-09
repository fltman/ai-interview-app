/**
 * Export all hooks from the hooks directory
 */

export { useLocalStorage } from './useLocalStorage';
export { useIndexedDB } from './useIndexedDB';
export type { IDBOperations } from './useIndexedDB';
export { useStorage, useInterviewStorage } from './useStorage';
export type { StorageOperations } from './useStorage';
export { useRealtimeAPI } from './useRealtimeAPI';
export { useInterview, generateSystemPrompt } from './useInterview';
export type { UseInterviewReturn, InterviewPhase } from './useInterview';
export { useSettingsAssistant } from './useSettingsAssistant';
export type { UseSettingsAssistantReturn, AssistantPhase } from './useSettingsAssistant';
