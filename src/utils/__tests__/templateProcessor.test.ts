/**
 * Tests for template processing utilities
 */

import { describe, it, expect } from 'vitest';
import {
  processTemplate,
  buildTemplateContext,
  validateTemplate,
  getAvailablePlaceholders,
} from '../templateProcessor';
import type { Answer, Question } from '../../types';

describe('templateProcessor', () => {
  describe('processTemplate', () => {
    it('should replace simple placeholders', () => {
      const template = 'Hello {{name}}, today is {{date}}';
      const context = { name: 'John', date: '2024-01-15' };
      const result = processTemplate(template, context);
      expect(result).toBe('Hello John, today is 2024-01-15');
    });

    it('should handle missing placeholders', () => {
      const template = 'Hello {{name}}, age {{age}}';
      const context = { name: 'John' };
      const result = processTemplate(template, context);
      expect(result).toContain('John');
      expect(result).toContain('[Ej besvarat]');
    });

    it('should process each blocks', () => {
      const template = '{{#each items}}Item: {{this.name}}\n{{/each}}';
      const context = {
        items: [{ name: 'First' }, { name: 'Second' }],
      };
      const result = processTemplate(template, context);
      expect(result).toContain('Item: First');
      expect(result).toContain('Item: Second');
    });

    it('should handle @index in each blocks', () => {
      const template = '{{#each items}}{{@index}}. {{this.name}}\n{{/each}}';
      const context = {
        items: [{ name: 'First' }, { name: 'Second' }],
      };
      const result = processTemplate(template, context);
      expect(result).toContain('1. First');
      expect(result).toContain('2. Second');
    });

    it('should handle empty arrays', () => {
      const template = '{{#each items}}Item{{/each}}Done';
      const context = { items: [] };
      const result = processTemplate(template, context);
      expect(result).toBe('Done');
    });
  });

  describe('buildTemplateContext', () => {
    const mockQuestions: Question[] = [
      { id: '1', text: 'Question 1?', order: 1 },
      { id: '2', text: 'Question 2?', order: 2 },
    ];

    const mockAnswers: Answer[] = [
      {
        questionId: '1',
        questionText: 'Question 1?',
        answerText: 'Answer 1',
        timestamp: Date.now(),
      },
    ];

    const mockMetadata = {
      startTime: new Date('2024-01-15T14:30:00').getTime(),
      endTime: new Date('2024-01-15T14:45:00').getTime(),
      language: 'en-US',
    };

    it('should build context with all required fields', () => {
      const context = buildTemplateContext(
        mockAnswers,
        mockQuestions,
        mockMetadata,
        'Summary'
      );

      expect(context).toHaveProperty('date');
      expect(context).toHaveProperty('time');
      expect(context).toHaveProperty('datum');
      expect(context).toHaveProperty('tid');
      expect(context).toHaveProperty('duration');
      expect(context).toHaveProperty('summary');
      expect(context).toHaveProperty('sammanfattning');
      expect(context).toHaveProperty('answers');
    });

    it('should format date correctly', () => {
      const context = buildTemplateContext(
        mockAnswers,
        mockQuestions,
        mockMetadata
      );
      expect(context.date).toBe('2024-01-15');
    });

    it('should calculate duration', () => {
      const context = buildTemplateContext(
        mockAnswers,
        mockQuestions,
        mockMetadata
      );
      expect(context.duration).toBe('15 minuter');
    });

    it('should include answers with question context', () => {
      const context = buildTemplateContext(
        mockAnswers,
        mockQuestions,
        mockMetadata
      );
      expect(context.answers).toHaveLength(1);
      expect(context.answers?.[0]).toHaveProperty('questionText');
      expect(context.answers?.[0]).toHaveProperty('answerText');
    });
  });

  describe('validateTemplate', () => {
    it('should validate correct template', () => {
      const template = '{{#each items}}{{this.name}}{{/each}}';
      const result = validateTemplate(template);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect unbalanced each blocks', () => {
      const template = '{{#each items}}{{this.name}}';
      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Unbalanced {{#each}}...{{/each}} blocks');
    });

    it('should detect unclosed placeholders', () => {
      const template = 'Hello {{name';
      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('getAvailablePlaceholders', () => {
    it('should return list of placeholders', () => {
      const placeholders = getAvailablePlaceholders();
      expect(Array.isArray(placeholders)).toBe(true);
      expect(placeholders.length).toBeGreaterThan(0);
      expect(placeholders.some(p => p.includes('{{date}}'))).toBe(true);
      expect(placeholders.some(p => p.includes('{{summary}}'))).toBe(true);
    });
  });
});
