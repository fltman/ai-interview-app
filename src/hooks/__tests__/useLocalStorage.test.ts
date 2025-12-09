/**
 * Tests for useLocalStorage hook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should return initial value when localStorage is empty', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', { count: 0 })
    );
    const [value] = result.current;
    expect(value).toEqual({ count: 0 });
  });

  it('should retrieve stored value from localStorage', () => {
    const initialValue = { count: 5, name: 'test' };
    localStorage.setItem('test-key', JSON.stringify(initialValue));

    const { result } = renderHook(() =>
      useLocalStorage('test-key', { count: 0, name: '' })
    );
    const [value] = result.current;
    expect(value).toEqual(initialValue);
  });

  it('should update localStorage when value changes', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', { count: 0 })
    );

    act(() => {
      const [, setValue] = result.current;
      setValue({ count: 1 });
    });

    const stored = JSON.parse(localStorage.getItem('test-key') || '{}');
    expect(stored).toEqual({ count: 1 });
  });

  it('should support functional updates', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', { count: 0 })
    );

    act(() => {
      const [, setValue] = result.current;
      setValue((prev) => ({ count: prev.count + 1 }));
    });

    const [value] = result.current;
    expect(value.count).toBe(1);
  });

  it('should sync value when localStorage changes externally', () => {
    const { result, rerender } = renderHook(() =>
      useLocalStorage('test-key', { count: 0 })
    );

    act(() => {
      localStorage.setItem('test-key', JSON.stringify({ count: 10 }));
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'test-key',
          newValue: JSON.stringify({ count: 10 }),
        })
      );
    });

    rerender();

    const [value] = result.current;
    expect(value.count).toBe(10);
  });

  it('should handle invalid JSON gracefully', () => {
    localStorage.setItem('test-key', 'invalid-json');

    const { result } = renderHook(() =>
      useLocalStorage('test-key', { count: 0 })
    );
    const [value] = result.current;
    expect(value).toEqual({ count: 0 });
  });

  it('should work with different data types', () => {
    const { result: arrayResult } = renderHook(() =>
      useLocalStorage('array-key', [1, 2, 3])
    );
    expect(arrayResult.current[0]).toEqual([1, 2, 3]);

    const { result: stringResult } = renderHook(() =>
      useLocalStorage('string-key', 'hello')
    );
    expect(stringResult.current[0]).toBe('hello');

    const { result: numberResult } = renderHook(() =>
      useLocalStorage('number-key', 42)
    );
    expect(numberResult.current[0]).toBe(42);
  });
});
