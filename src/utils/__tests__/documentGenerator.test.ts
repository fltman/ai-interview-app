/**
 * Tests for document generation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  generateDocument,
  generateMarkdown,
  generatePlainText,
  formatFilename,
  getWordCount,
  getReadingTime,
  type DocumentGeneratorOptions,
} from '../documentGenerator';
import type { Answer, Question } from '../../types';

describe('documentGenerator', () => {
  const mockQuestions: Question[] = [
    { id: '1', text: 'What is your name?', order: 1 },
    { id: '2', text: 'What is your background?', order: 2 },
  ];

  const mockAnswers: Answer[] = [
    {
      questionId: '1',
      questionText: 'What is your name?',
      answerText: 'My name is John Doe.',
      timestamp: Date.now(),
    },
    {
      questionId: '2',
      questionText: 'What is your background?',
      answerText: 'I have 10 years of experience in software development.',
      timestamp: Date.now(),
    },
  ];

  const mockMetadata = {
    startTime: new Date('2024-01-15T14:30:00').getTime(),
    endTime: new Date('2024-01-15T14:45:00').getTime(),
    language: 'en-US',
  };

  const mockSummary = 'This was a good interview with detailed answers.';

  const mockOptions: DocumentGeneratorOptions = {
    template: `# Interview
{{#each answers}}
Q: {{this.questionText}}
A: {{this.answerText}}
{{/each}}`,
    answers: mockAnswers,
    questions: mockQuestions,
    metadata: mockMetadata,
    summary: mockSummary,
  };

  describe('generateDocument', () => {
    it('should generate document from template', () => {
      const result = generateDocument(mockOptions);
      expect(result).toContain('Interview');
      expect(result).toContain('What is your name?');
      expect(result).toContain('John Doe');
    });

    it('should replace placeholders', () => {
      const options = {
        ...mockOptions,
        template: 'Date: {{date}}, Summary: {{summary}}',
      };
      const result = generateDocument(options);
      expect(result).toContain('Date: 2024-01-15');
      expect(result).toContain('Summary: This was a good interview');
    });
  });

  describe('generateMarkdown', () => {
    it('should generate markdown format', () => {
      // Pass a markdown template or use the default
      const markdownOptions = {
        ...mockOptions,
        template: '', // Empty template triggers default markdown template
      };
      const result = generateMarkdown(markdownOptions);
      expect(result).toContain('# Interview Summary');
      expect(result).toContain('**Date:**');
      expect(result).toContain('## Questions and Answers');
    });

    it('should use provided template if it contains markdown', () => {
      const result = generateMarkdown(mockOptions);
      // With a markdown template, it should use it directly
      expect(result).toContain('# Interview');
      expect(result).toContain('What is your name?');
    });
  });

  describe('generatePlainText', () => {
    it('should generate plain text format', () => {
      const result = generatePlainText(mockOptions);
      expect(result).toContain('INTERVIEW SUMMARY');
      expect(result).toContain('Question 1:');
      expect(result).not.toContain('#');
      expect(result).not.toContain('**');
    });
  });

  describe('formatFilename', () => {
    it('should format filename with date and time', () => {
      const filename = formatFilename(mockMetadata, 'markdown');
      expect(filename).toMatch(/^intervju-\d{4}-\d{2}-\d{2}-\d{4}\.md$/);
    });

    it('should use correct extension for format', () => {
      expect(formatFilename(mockMetadata, 'markdown')).toMatch(/\.md$/);
      expect(formatFilename(mockMetadata, 'text')).toMatch(/\.txt$/);
      expect(formatFilename(mockMetadata, 'pdf')).toMatch(/\.pdf$/);
    });
  });

  describe('getWordCount', () => {
    it('should count words correctly', () => {
      const text = 'This is a test document with ten words here.';
      expect(getWordCount(text)).toBe(9);
    });

    it('should handle empty string', () => {
      expect(getWordCount('')).toBe(0);
    });
  });

  describe('getReadingTime', () => {
    it('should estimate reading time', () => {
      const text = 'word '.repeat(200); // 200 words
      expect(getReadingTime(text)).toBe(1);
    });

    it('should round up reading time', () => {
      const text = 'word '.repeat(250); // 250 words
      expect(getReadingTime(text)).toBe(2);
    });
  });
});
