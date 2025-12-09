/**
 * useSettingsAssistant Hook
 * A "meta-interview" that guides users through configuring their interview settings via voice
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRealtimeAPI, RealtimeEventCallbacks } from './useRealtimeAPI';
import type { Settings, Question, LanguageOption } from '../types';

export type AssistantPhase =
  | 'idle'
  | 'asking-purpose'
  | 'asking-questions'
  | 'asking-template'
  | 'asking-language'
  | 'confirming'
  | 'complete';

export interface TranscriptEntry {
  id: string;
  speaker: 'ai' | 'user';
  text: string;
  timestamp: number;
}

export interface UseSettingsAssistantReturn {
  startAssistant: (apiKey: string) => Promise<void>;
  stopAssistant: () => void;
  isActive: boolean;
  phase: AssistantPhase;
  transcript: TranscriptEntry[];
  suggestedSettings: Partial<Settings> | null;
  applySettings: () => void;
  error: Error | null;
}

const SYSTEM_PROMPT = `You are a friendly and helpful assistant that helps users configure their interview app.

IMPORTANT: Always respond in the same language that the user speaks to you. If they speak English, respond in English. If they speak Swedish, respond in Swedish. Etc.

Your task is to have a natural conversation to understand:

1. **Purpose**: What type of interviews do they want to conduct? (e.g., job interviews, user studies, medical histories, customer interviews, etc.)

2. **Questions**: What specific questions do they need to ask? Offer suggestions based on their purpose.

3. **Voice preference**: What voice style they prefer (professional, friendly, warm, etc.)

4. **Document format**: How should the final document look? What export format (PDF, Markdown, plain text)?

5. **Language**: What language for the interview and document output?

Be conversational and ask follow-up questions when needed. When you have enough information, summarize what you understood and ask if it's correct.

When the user confirms, produce ONE JSON block with the settings in exactly this format:
\`\`\`json
{
  "questions": [
    {"text": "Question 1 here"},
    {"text": "Question 2 here"}
  ],
  "documentTemplate": "# Interview Summary\\n\\n**Date:** {{date}}\\n\\n## Questions and Answers\\n\\n{{#each answers}}\\n### {{this.questionText}}\\n\\n{{this.answerText}}\\n\\n{{/each}}",
  "documentLanguage": "English",
  "documentFormat": "pdf",
  "voice": "alloy",
  "systemPrompt": "You are a professional interviewer who..."
}
\`\`\`

IMPORTANT:
- Use ONLY this JSON format
- documentLanguage should be a human-readable language name (English, Swedish, German, etc.)
- documentFormat must be one of: "pdf", "markdown", "text"
- voice must be one of: "alloy" (neutral), "ash" (clear), "ballad" (warm), "coral" (friendly), "echo" (smooth), "sage" (calm), "shimmer" (bright), "verse" (dynamic)
- systemPrompt should describe the AI's role based on the interview type
- documentTemplate should use Handlebars syntax: {{date}}, {{duration}}, {{#each answers}}{{this.questionText}}{{this.answerText}}{{/each}}
- Be friendly and encouraging throughout the conversation
- Start by greeting the user in English and asking what type of interviews they want to conduct`;

/**
 * Settings Assistant Hook
 * Uses the Realtime API to conduct a voice-based settings configuration session
 */
export function useSettingsAssistant(
  onSettingsComplete?: (settings: Partial<Settings>) => void
): UseSettingsAssistantReturn {
  const [phase, setPhase] = useState<AssistantPhase>('idle');
  const [suggestedSettings, setSuggestedSettings] = useState<Partial<Settings> | null>(null);
  const [assistantTranscript, setAssistantTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isActive, setIsActive] = useState(false);

  const realtimeAPI = useRealtimeAPI();
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout>>();

  /**
   * Parse JSON from AI response
   */
  const parseSettingsFromJSON = useCallback((text: string): Partial<Settings> | null => {
    try {
      // Extract JSON from markdown code block
      const jsonMatch = text.match(/```json\s*\n([\s\S]*?)\n```/);
      if (!jsonMatch) {
        console.log('No JSON block found in text');
        return null;
      }

      const jsonStr = jsonMatch[1];
      if (!jsonStr) {
        console.log('Empty JSON block');
        return null;
      }

      const parsed = JSON.parse(jsonStr);

      // Validate and transform
      const settings: Partial<Settings> = {};

      if (parsed.questions && Array.isArray(parsed.questions)) {
        settings.questions = parsed.questions.map((q: { text: string }, index: number): Question => ({
          id: `${Date.now()}-${index}`,
          text: q.text || '',
          order: index + 1,
        }));
      }

      if (parsed.documentTemplate && typeof parsed.documentTemplate === 'string') {
        settings.documentTemplate = parsed.documentTemplate;
      }

      if (parsed.documentLanguage && typeof parsed.documentLanguage === 'string') {
        settings.documentLanguage = parsed.documentLanguage;
      }

      if (parsed.interviewLanguage && typeof parsed.interviewLanguage === 'string') {
        settings.language = parsed.interviewLanguage as LanguageOption;
      }

      if (parsed.outputLanguage && typeof parsed.outputLanguage === 'string') {
        settings.targetLanguage = parsed.outputLanguage as LanguageOption;
      }

      if (parsed.systemPrompt && typeof parsed.systemPrompt === 'string') {
        settings.systemPrompt = parsed.systemPrompt;
      }

      if (parsed.voice && typeof parsed.voice === 'string') {
        const validVoices = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse'];
        if (validVoices.includes(parsed.voice)) {
          settings.voice = parsed.voice as Settings['voice'];
        }
      }

      if (parsed.documentFormat && typeof parsed.documentFormat === 'string') {
        const validFormats = ['pdf', 'markdown', 'text'];
        if (validFormats.includes(parsed.documentFormat)) {
          settings.documentFormat = parsed.documentFormat as Settings['documentFormat'];
        }
      }

      console.log('Parsed settings:', settings);
      return settings;
    } catch (err) {
      console.error('Failed to parse settings JSON:', err);
      return null;
    }
  }, []);

  /**
   * Detect phase transitions based on transcript content
   */
  const detectPhase = useCallback((text: string): AssistantPhase => {
    const lower = text.toLowerCase();

    if (lower.includes('question') && (lower.includes('ask') || lower.includes('need'))) {
      return 'asking-questions';
    } else if (lower.includes('document') && (lower.includes('format') || lower.includes('look'))) {
      return 'asking-template';
    } else if (lower.includes('language')) {
      return 'asking-language';
    } else if (lower.includes('summar') || lower.includes('correct') || lower.includes('confirm')) {
      return 'confirming';
    }

    return 'asking-purpose';
  }, []);

  /**
   * Create callbacks for Realtime API events
   */
  const createCallbacks = useCallback((): RealtimeEventCallbacks => ({
    onUserTranscript: (text: string) => {
      console.log('Settings Assistant - User said:', text);

      setAssistantTranscript(prev => [...prev, {
        id: `user-${Date.now()}`,
        speaker: 'user',
        text,
        timestamp: Date.now(),
      }]);
    },

    onAITranscript: (text: string) => {
      console.log('Settings Assistant - AI said:', text);

      setAssistantTranscript(prev => [...prev, {
        id: `ai-${Date.now()}`,
        speaker: 'ai',
        text,
        timestamp: Date.now(),
      }]);

      // Check for settings JSON in AI response
      const settings = parseSettingsFromJSON(text);
      if (settings && Object.keys(settings).length > 0) {
        console.log('Found settings in AI response!', settings);
        setSuggestedSettings(settings);
        setPhase('complete');
        return;
      }

      // Auto-detect phase based on what AI is saying
      if (phaseTimerRef.current) {
        clearTimeout(phaseTimerRef.current);
      }
      phaseTimerRef.current = setTimeout(() => {
        const newPhase = detectPhase(text);
        if (newPhase !== 'asking-purpose') {
          setPhase(newPhase);
        }
      }, 500);
    },

    onResponseDone: () => {
      console.log('Settings Assistant - AI response done');
    },

    onError: (err: Error) => {
      console.error('Settings Assistant error:', err);
      setError(err);
      setPhase('idle');
      setIsActive(false);
    },
  }), [parseSettingsFromJSON, detectPhase]);

  /**
   * Start the settings assistant
   */
  const startAssistant = useCallback(async (apiKey: string) => {
    try {
      setPhase('asking-purpose');
      setSuggestedSettings(null);
      setAssistantTranscript([]);
      setError(null);
      setIsActive(true);

      await realtimeAPI.connect(apiKey, 'alloy', SYSTEM_PROMPT, createCallbacks());

    } catch (err) {
      console.error('Failed to start assistant:', err);
      setPhase('idle');
      setIsActive(false);
      setError(err as Error);
      throw err;
    }
  }, [realtimeAPI, createCallbacks]);

  /**
   * Stop the settings assistant
   */
  const stopAssistant = useCallback(() => {
    realtimeAPI.disconnect();
    setPhase('idle');
    setIsActive(false);
    if (phaseTimerRef.current) {
      clearTimeout(phaseTimerRef.current);
    }
  }, [realtimeAPI]);

  /**
   * Apply the suggested settings
   */
  const applySettings = useCallback(() => {
    if (suggestedSettings && onSettingsComplete) {
      onSettingsComplete(suggestedSettings);
    }
    stopAssistant();
  }, [suggestedSettings, onSettingsComplete, stopAssistant]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (phaseTimerRef.current) {
        clearTimeout(phaseTimerRef.current);
      }
    };
  }, []);

  return {
    startAssistant,
    stopAssistant,
    isActive,
    phase,
    transcript: assistantTranscript,
    suggestedSettings,
    applySettings,
    error,
  };
}
