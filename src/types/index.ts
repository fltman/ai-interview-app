/**
 * Core type definitions for the AI Interview App
 */

export type VoiceOption = 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'sage' | 'shimmer' | 'verse';
export type InterviewStatus = 'idle' | 'connecting' | 'active' | 'paused' | 'completed' | 'error';

export type LanguageOption =
  | 'sv-SE' // Swedish
  | 'en-US' // English (US)
  | 'en-GB' // English (UK)
  | 'de-DE' // German
  | 'fr-FR' // French
  | 'es-ES' // Spanish
  | 'it-IT' // Italian
  | 'pt-PT' // Portuguese
  | 'nl-NL' // Dutch
  | 'pl-PL' // Polish
  | 'ru-RU' // Russian
  | 'ja-JP' // Japanese
  | 'ko-KR' // Korean
  | 'zh-CN'; // Chinese (Simplified)

export interface Question {
  id: string;
  text: string;
  order: number;
}

export interface Answer {
  questionId: string;
  questionText: string;
  answerText: string;
  timestamp: number;
}

export type DocumentFormat = 'pdf' | 'markdown' | 'text';

// Interview profile - a saved configuration for a specific interview type
export interface InterviewProfile {
  id: string;
  name: string;
  voice: VoiceOption;
  systemPrompt: string;
  questions: Question[];
  documentTemplate: string;
  documentLanguage: string;
  language: LanguageOption;
  targetLanguage?: LanguageOption;
  documentFormat: DocumentFormat;
}

// App settings - global settings including API key and profiles
export interface AppSettings {
  apiKey: string;
  profiles: InterviewProfile[];
  activeProfileId: string;
}

// Legacy Settings interface for compatibility
export interface Settings {
  apiKey: string;
  voice: VoiceOption;
  systemPrompt: string;
  questions: Question[];
  documentTemplate: string;
  documentLanguage: string;
  language: LanguageOption;
  targetLanguage?: LanguageOption;
  documentFormat: DocumentFormat;
}

export interface InterviewState {
  status: InterviewStatus;
  currentQuestionIndex: number;
  answers: Answer[];
  transcript: TranscriptEntry[];
  startTime?: number;
  endTime?: number;
  error?: string;
}

export interface TranscriptEntry {
  id: string;
  speaker: 'ai' | 'user';
  text: string;
  timestamp: number;
}

export interface GeneratedDocument {
  content: string;
  format: 'markdown' | 'text' | 'pdf';
  timestamp: number;
  language: LanguageOption;
}

export interface SavedInterview {
  id: string;
  createdAt: Date;
  settings: Settings;
  answers: Answer[];
  transcript: string;
  document: string;
  status: 'draft' | 'complete';
}

export interface AudioRecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  volume: number;
}

export interface RealtimeAPIConfig {
  apiKey: string;
  voice: VoiceOption;
  model?: string;
  temperature?: number;
  instructions?: string;
}

export interface RealtimeAPIState {
  isConnected: boolean;
  isAudioActive: boolean;
  error?: string;
}

// Navigation
export type RouteType = 'home' | 'settings' | 'interview';

// Local storage keys
export const STORAGE_KEYS = {
  SETTINGS: 'ai-interview-settings',
  APP_SETTINGS: 'ai-interview-app-settings',
  INTERVIEW_STATE: 'ai-interview-state',
  GENERATED_DOCUMENTS: 'ai-interview-documents',
} as const;

// Default profile
export const DEFAULT_PROFILE: InterviewProfile = {
  id: 'default',
  name: 'General Interview',
  voice: 'alloy',
  systemPrompt: 'You are a professional interviewer conducting a voice-based interview. Ask questions clearly, listen carefully to responses, and help the interviewee provide complete answers. Be friendly and supportive.',
  questions: [
    { id: '1', text: 'Can you introduce yourself and tell me about your background?', order: 1 },
    { id: '2', text: 'What are your main goals and objectives?', order: 2 },
    { id: '3', text: 'What challenges or obstacles do you face?', order: 3 },
  ],
  documentTemplate: `# Interview Summary

**Date:** {{date}}
**Duration:** {{duration}}

## Questions and Answers

{{#each answers}}
### Question {{@index}}: {{this.questionText}}

{{this.answerText}}

{{/each}}

## Summary

{{summary}}
`,
  documentLanguage: '',
  language: 'en-US',
  documentFormat: 'pdf',
};

// Default app settings
export const DEFAULT_APP_SETTINGS: AppSettings = {
  apiKey: '',
  profiles: [DEFAULT_PROFILE],
  activeProfileId: 'default',
};

// Helper to convert profile + apiKey to Settings (for compatibility)
export function profileToSettings(profile: InterviewProfile, apiKey: string): Settings {
  return {
    apiKey,
    voice: profile.voice,
    systemPrompt: profile.systemPrompt,
    questions: profile.questions,
    documentTemplate: profile.documentTemplate,
    documentLanguage: profile.documentLanguage,
    language: profile.language,
    targetLanguage: profile.targetLanguage,
    documentFormat: profile.documentFormat,
  };
}

// Legacy default settings for compatibility
export const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  voice: 'alloy',
  systemPrompt: 'You are a professional interviewer conducting a voice-based interview. Ask questions clearly, listen carefully to responses, and help the interviewee provide complete answers. Be friendly and supportive.',
  questions: [
    { id: '1', text: 'Can you introduce yourself and tell me about your background?', order: 1 },
    { id: '2', text: 'What are your main goals and objectives?', order: 2 },
    { id: '3', text: 'What challenges or obstacles do you face?', order: 3 },
  ],
  documentTemplate: `# Interview Summary

**Date:** {{date}}
**Duration:** {{duration}}

## Questions and Answers

{{#each answers}}
### Question {{@index}}: {{this.questionText}}

{{this.answerText}}

{{/each}}

## Summary

{{summary}}
`,
  documentLanguage: '',
  language: 'en-US',
  documentFormat: 'pdf',
};

export const VOICE_OPTIONS: Array<{ value: VoiceOption; label: string }> = [
  { value: 'alloy', label: 'Alloy (Neutral)' },
  { value: 'ash', label: 'Ash (Clear)' },
  { value: 'ballad', label: 'Ballad (Warm)' },
  { value: 'coral', label: 'Coral (Friendly)' },
  { value: 'echo', label: 'Echo (Smooth)' },
  { value: 'sage', label: 'Sage (Calm)' },
  { value: 'shimmer', label: 'Shimmer (Bright)' },
  { value: 'verse', label: 'Verse (Dynamic)' },
];

export const LANGUAGE_OPTIONS: Array<{ value: LanguageOption; label: string }> = [
  { value: 'sv-SE', label: 'Swedish' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'de-DE', label: 'German' },
  { value: 'fr-FR', label: 'French' },
  { value: 'es-ES', label: 'Spanish' },
  { value: 'it-IT', label: 'Italian' },
  { value: 'pt-PT', label: 'Portuguese' },
  { value: 'nl-NL', label: 'Dutch' },
  { value: 'pl-PL', label: 'Polish' },
  { value: 'ru-RU', label: 'Russian' },
  { value: 'ja-JP', label: 'Japanese' },
  { value: 'ko-KR', label: 'Korean' },
  { value: 'zh-CN', label: 'Chinese (Simplified)' },
];
