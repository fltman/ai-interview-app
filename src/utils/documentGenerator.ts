/**
 * Document generation utilities
 * Generates formatted documents from interview data using templates
 */

import { Answer, Question } from '../types';
import { processTemplate, buildTemplateContext } from './templateProcessor';

export interface DocumentGeneratorOptions {
  template: string;
  answers: Answer[];
  questions: Question[];
  metadata: {
    startTime?: number;
    endTime?: number;
    language?: string;
  };
  summary?: string;
}

/**
 * Generate a document from interview data using the provided template
 */
export function generateDocument(options: DocumentGeneratorOptions): string {
  const context = buildTemplateContext(
    options.answers,
    options.questions,
    options.metadata,
    options.summary
  );

  return processTemplate(options.template, context);
}

/**
 * Generate a Markdown document (default format)
 */
export function generateMarkdown(options: DocumentGeneratorOptions): string {
  // If the template is already markdown, use it directly
  if (options.template.includes('#') || options.template.includes('**')) {
    return generateDocument(options);
  }

  // Otherwise, use a default markdown template
  const markdownTemplate = `# Interview Summary

**Date:** {{date}}
**Time:** {{time}}
**Duration:** {{duration}}

## Questions and Answers

{{#each answers}}
### Question {{@index}}: {{this.questionText}}

{{this.answerText}}

{{/each}}

## Summary

{{summary}}
`;

  return generateDocument({ ...options, template: markdownTemplate });
}

/**
 * Generate a plain text document
 */
export function generatePlainText(options: DocumentGeneratorOptions): string {
  const context = buildTemplateContext(
    options.answers,
    options.questions,
    options.metadata,
    options.summary
  );

  let text = 'INTERVIEW SUMMARY\n';
  text += '='.repeat(50) + '\n\n';
  text += `Date: ${context.date}\n`;
  text += `Time: ${context.time}\n`;
  text += `Duration: ${context.duration}\n\n`;
  text += 'QUESTIONS AND ANSWERS\n';
  text += '-'.repeat(50) + '\n\n';

  options.answers.forEach((answer, index) => {
    const question = options.questions.find(q => q.id === answer.questionId);
    text += `Question ${index + 1}: ${question?.text || answer.questionText}\n\n`;
    text += `${answer.answerText || '[No answer provided]'}\n\n`;
    text += '-'.repeat(50) + '\n\n';
  });

  if (options.summary) {
    text += 'SUMMARY\n';
    text += '-'.repeat(50) + '\n\n';
    text += options.summary + '\n';
  }

  return text;
}

/**
 * Format document filename based on interview metadata
 */
export function formatFilename(
  metadata: { startTime?: number; endTime?: number },
  format: 'markdown' | 'text' | 'pdf' = 'markdown'
): string {
  const date = metadata.startTime
    ? new Date(metadata.startTime)
    : new Date();

  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const timeStr = date.toTimeString().slice(0, 5).replace(':', ''); // HHMM

  const extension = {
    markdown: 'md',
    text: 'txt',
    pdf: 'pdf'
  }[format];

  return `intervju-${dateStr}-${timeStr}.${extension}`;
}

/**
 * Estimate document word count
 */
export function getWordCount(content: string): number {
  return content
    .split(/\s+/)
    .filter(word => word.length > 0)
    .length;
}

/**
 * Estimate reading time in minutes
 */
export function getReadingTime(content: string): number {
  const wordCount = getWordCount(content);
  const wordsPerMinute = 200; // Average reading speed
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Extract summary statistics from interview
 */
export function getDocumentStats(options: DocumentGeneratorOptions) {
  const content = generateDocument(options);
  const wordCount = getWordCount(content);
  const readingTime = getReadingTime(content);

  const duration = options.metadata.endTime && options.metadata.startTime
    ? Math.floor((options.metadata.endTime - options.metadata.startTime) / 60000)
    : 0;

  return {
    questionCount: options.questions.length,
    answerCount: options.answers.length,
    wordCount,
    readingTime,
    interviewDuration: duration,
  };
}
