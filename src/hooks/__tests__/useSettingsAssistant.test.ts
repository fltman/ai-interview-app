/**
 * Tests for useSettingsAssistant hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSettingsAssistant } from '../useSettingsAssistant';
import * as realtimeAPI from '../useRealtimeAPI';

// Mock the useRealtimeAPI hook
vi.mock('../useRealtimeAPI', () => ({
  useRealtimeAPI: vi.fn(),
}));

describe('useSettingsAssistant', () => {
  const mockRealtimeAPI = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    sendTextMessage: vi.fn(),
    updateSession: vi.fn(),
    isConnected: false,
    isListening: false,
    isSpeaking: false,
    transcript: [],
    error: null,
    connectionState: 'disconnected' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock state
    mockRealtimeAPI.isConnected = false;
    mockRealtimeAPI.transcript = [];
    mockRealtimeAPI.error = null;
    mockRealtimeAPI.connectionState = 'disconnected';
    vi.mocked(realtimeAPI.useRealtimeAPI).mockReturnValue(mockRealtimeAPI);
  });

  it('should initialize with idle state', () => {
    const { result } = renderHook(() => useSettingsAssistant());

    expect(result.current.isActive).toBe(false);
    expect(result.current.phase).toBe('idle');
    expect(result.current.transcript).toEqual([]);
    expect(result.current.suggestedSettings).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should start assistant with API key', async () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useSettingsAssistant(onComplete));

    // Mock connect to return immediately
    mockRealtimeAPI.connect.mockResolvedValue(undefined);

    await result.current.startAssistant('test-api-key');

    expect(mockRealtimeAPI.connect).toHaveBeenCalledWith(
      'test-api-key',
      'nova',
      expect.stringContaining('Din uppgift är att ha en naturlig konversation')
    );

    // Wait a bit for the timeout to fire
    await new Promise(resolve => setTimeout(resolve, 1100));

    expect(mockRealtimeAPI.sendTextMessage).toHaveBeenCalled();
    expect(result.current.phase).toBe('asking-purpose');
  });

  it('should stop assistant and reset state', async () => {
    const { result } = renderHook(() => useSettingsAssistant());

    // Start first
    mockRealtimeAPI.isConnected = true;
    await result.current.startAssistant('test-api-key');

    // Then stop
    result.current.stopAssistant();

    expect(mockRealtimeAPI.disconnect).toHaveBeenCalled();
    expect(result.current.phase).toBe('idle');
  });

  it('should parse settings from AI JSON response', async () => {
    const onComplete = vi.fn();
    const { result, rerender } = renderHook(() => useSettingsAssistant(onComplete));

    // Simulate AI response with JSON
    const aiResponse = {
      role: 'assistant' as const,
      content: `Här är dina inställningar:
\`\`\`json
{
  "questions": [
    {"text": "Vad heter du?"},
    {"text": "Var bor du?"}
  ],
  "documentTemplate": "# Intervju\\n\\n{{#each answers}}{{this.questionText}}\\n{{this.answerText}}\\n{{/each}}",
  "interviewLanguage": "sv-SE",
  "outputLanguage": "en-US",
  "systemPrompt": "Du är en professionell intervjuare"
}
\`\`\``,
      timestamp: new Date(),
    };

    // Update mock to include the AI response
    mockRealtimeAPI.transcript = [aiResponse];
    mockRealtimeAPI.isConnected = true;

    rerender();

    await waitFor(() => {
      expect(result.current.suggestedSettings).not.toBeNull();
    });

    expect(result.current.suggestedSettings).toMatchObject({
      questions: expect.arrayContaining([
        expect.objectContaining({ text: 'Vad heter du?' }),
        expect.objectContaining({ text: 'Var bor du?' }),
      ]),
      documentTemplate: expect.stringContaining('# Intervju'),
      language: 'sv-SE',
      targetLanguage: 'en-US',
      systemPrompt: 'Du är en professionell intervjuare',
    });

    expect(result.current.phase).toBe('complete');
  });

  it('should handle invalid JSON gracefully', async () => {
    const { result, rerender } = renderHook(() => useSettingsAssistant());

    // Simulate AI response with invalid JSON (no code block)
    mockRealtimeAPI.transcript = [
      {
        role: 'assistant' as const,
        content: 'Låt mig tänka...',
        timestamp: new Date(),
      },
    ];
    mockRealtimeAPI.isConnected = true;

    rerender();

    // Give time for processing
    await new Promise(resolve => setTimeout(resolve, 600));

    // Should not crash, settings should remain null
    expect(result.current.suggestedSettings).toBeNull();
  });

  it('should convert transcript from Realtime API format', async () => {
    const { result, rerender } = renderHook(() => useSettingsAssistant());

    mockRealtimeAPI.transcript = [
      {
        role: 'assistant' as const,
        content: 'Hej!',
        timestamp: new Date(),
      },
      {
        role: 'user' as const,
        content: 'Hej på dig!',
        timestamp: new Date(),
      },
    ];
    mockRealtimeAPI.isConnected = true;

    rerender();

    await waitFor(() => {
      expect(result.current.transcript.length).toBe(2);
    });

    expect(result.current.transcript[0]).toMatchObject({
      speaker: 'ai',
      text: 'Hej!',
    });

    expect(result.current.transcript[1]).toMatchObject({
      speaker: 'user',
      text: 'Hej på dig!',
    });
  });

  it('should apply settings and call onComplete callback', async () => {
    const onComplete = vi.fn();
    const { result, rerender } = renderHook(() => useSettingsAssistant(onComplete));

    // Simulate having suggested settings
    mockRealtimeAPI.transcript = [
      {
        role: 'assistant' as const,
        content: `\`\`\`json
{
  "questions": [{"text": "Test?"}],
  "systemPrompt": "Test"
}
\`\`\``,
        timestamp: new Date(),
      },
    ];
    mockRealtimeAPI.isConnected = true;

    rerender();

    await waitFor(() => {
      expect(result.current.suggestedSettings).not.toBeNull();
    });

    result.current.applySettings();

    expect(onComplete).toHaveBeenCalledWith(result.current.suggestedSettings);
    expect(mockRealtimeAPI.disconnect).toHaveBeenCalled();
  });

  it('should detect phase transitions based on conversation', async () => {
    const { result, rerender } = renderHook(() => useSettingsAssistant());

    mockRealtimeAPI.isConnected = true;

    // Simulate asking about questions (without triggering completion)
    mockRealtimeAPI.transcript = [
      {
        role: 'user' as const,
        content: 'Jag vill göra jobbintervjuer',
        timestamp: new Date(),
      },
      {
        role: 'assistant' as const,
        content: 'Bra! Vilka frågor vill du ställa i intervjun?',
        timestamp: new Date(),
      },
    ];

    rerender();

    // Give time for phase detection timer
    await new Promise(resolve => setTimeout(resolve, 600));

    expect(result.current.phase).toBe('asking-questions');
  });

  it('should propagate errors from Realtime API', async () => {
    const { result, rerender } = renderHook(() => useSettingsAssistant());

    const testError = new Error('Connection failed');
    mockRealtimeAPI.error = testError;

    rerender();

    expect(result.current.error).toBe(testError);
  });
});
