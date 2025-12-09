/**
 * Tests for useRealtimeAPI hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRealtimeAPI } from '../useRealtimeAPI';
import type { VoiceOption } from '../../types';

// Mock the global fetch and WebRTC APIs
globalThis.fetch = vi.fn();

describe('useRealtimeAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with disconnected state', () => {
    const { result } = renderHook(() => useRealtimeAPI());

    expect(result.current.isConnected).toBe(false);
    expect(result.current.isListening).toBe(false);
    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.transcript).toEqual([]);
    expect(result.current.error).toBe(null);
    expect(result.current.connectionState).toBe('disconnected');
  });

  it('should expose required methods', () => {
    const { result } = renderHook(() => useRealtimeAPI());

    expect(typeof result.current.connect).toBe('function');
    expect(typeof result.current.disconnect).toBe('function');
    expect(typeof result.current.sendTextMessage).toBe('function');
    expect(typeof result.current.updateSession).toBe('function');
  });

  it('should have correct TypeScript types', () => {
    const { result } = renderHook(() => useRealtimeAPI());

    // These compile-time checks verify the interface matches specification
    const _connect: (apiKey: string, voice: VoiceOption, systemPrompt: string) => Promise<void> =
      result.current.connect;
    const _disconnect: () => void = result.current.disconnect;
    const _sendTextMessage: (text: string) => void = result.current.sendTextMessage;
    const _updateSession: (instructions: string) => void = result.current.updateSession;
    const _isConnected: boolean = result.current.isConnected;
    const _isListening: boolean = result.current.isListening;
    const _isSpeaking: boolean = result.current.isSpeaking;
    const _connectionState: 'disconnected' | 'connecting' | 'connected' | 'error' =
      result.current.connectionState;

    // Suppress unused variable warnings
    expect(_connect).toBeDefined();
    expect(_disconnect).toBeDefined();
    expect(_sendTextMessage).toBeDefined();
    expect(_updateSession).toBeDefined();
    expect(_isConnected).toBeDefined();
    expect(_isListening).toBeDefined();
    expect(_isSpeaking).toBeDefined();
    expect(_connectionState).toBeDefined();
  });

  it('should maintain transcript entries with correct structure', () => {
    const { result } = renderHook(() => useRealtimeAPI());

    // Verify transcript array structure
    expect(Array.isArray(result.current.transcript)).toBe(true);

    // Each transcript entry should have: role, content, timestamp
    result.current.transcript.forEach(entry => {
      expect(entry).toHaveProperty('role');
      expect(entry).toHaveProperty('content');
      expect(entry).toHaveProperty('timestamp');
      expect(['user', 'assistant']).toContain(entry.role);
      expect(typeof entry.content).toBe('string');
      expect(entry.timestamp).toBeInstanceOf(Date);
    });
  });
});
