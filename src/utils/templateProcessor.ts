/**
 * Template processor for Handlebars-like syntax
 * Supports placeholders and loops for document generation
 */

import { Answer, Question } from '../types';

interface TemplateContext {
  date?: string;
  time?: string;
  datum?: string;
  tid?: string;
  duration?: string;
  summary?: string;
  sammanfattning?: string;
  answers?: Array<{
    questionId: string;
    question: string;
    questionText: string;
    answer: string;
    answerText: string;
    timestamp: string;
  }>;
  [key: string]: unknown;
}

/**
 * Process a template with the given context
 */
export function processTemplate(template: string, context: TemplateContext): string {
  let result = template;

  // Process each blocks (loops)
  result = processEachBlocks(result, context);

  // Process simple placeholders
  result = processPlaceholders(result, context);

  return result;
}

/**
 * Process {{#each array}}...{{/each}} blocks
 */
function processEachBlocks(template: string, context: TemplateContext): string {
  const eachRegex = /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g;

  return template.replace(eachRegex, (_match, arrayName, blockContent) => {
    const array = context[arrayName];

    if (!Array.isArray(array)) {
      return '';
    }

    return array.map((item, index) => {
      let itemContent = blockContent;

      // Replace @index with current index (1-based for readability)
      itemContent = itemContent.replace(/\{\{@index\}\}/g, String(index + 1));

      // Replace this.property references
      const thisRegex = /\{\{this\.(\w+)\}\}/g;
      itemContent = itemContent.replace(thisRegex, (_match: string, prop: string) => {
        const value = item[prop as keyof typeof item];
        return value !== undefined ? String(value) : '[Ej besvarat]';
      });

      return itemContent;
    }).join('');
  });
}

/**
 * Process simple {{placeholder}} replacements
 */
function processPlaceholders(template: string, context: TemplateContext): string {
  const placeholderRegex = /\{\{(\w+)\}\}/g;

  return template.replace(placeholderRegex, (_match, key) => {
    const value = context[key];
    return value !== undefined ? String(value) : '[Ej besvarat]';
  });
}

/**
 * Build template context from interview data
 */
export function buildTemplateContext(
  answers: Answer[],
  questions: Question[],
  metadata: {
    startTime?: number;
    endTime?: number;
    language?: string;
  },
  summary?: string
): TemplateContext {
  const startDate = metadata.startTime ? new Date(metadata.startTime) : new Date();

  // Format date and time
  const dateStr = startDate.toLocaleDateString('sv-SE');
  const timeStr = startDate.toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Calculate duration
  const durationMs = metadata.endTime && metadata.startTime
    ? metadata.endTime - metadata.startTime
    : 0;
  const durationMin = Math.floor(durationMs / 60000);
  const durationStr = `${durationMin} minuter`;

  // Build answers array with question context
  const answersWithQuestions = answers.map(answer => {
    const question = questions.find(q => q.id === answer.questionId);
    const timestamp = new Date(answer.timestamp).toLocaleTimeString('sv-SE');

    return {
      questionId: answer.questionId,
      question: question?.text || answer.questionText,
      questionText: question?.text || answer.questionText,
      answer: answer.answerText || '[Ej besvarat]',
      answerText: answer.answerText || '[Ej besvarat]',
      timestamp,
    };
  });

  return {
    date: dateStr,
    time: timeStr,
    datum: dateStr,
    tid: timeStr,
    duration: durationStr,
    summary: summary || '[Sammanfattning ej tillgänglig]',
    sammanfattning: summary || '[Sammanfattning ej tillgänglig]',
    answers: answersWithQuestions,
  };
}

/**
 * Validate template syntax
 */
export function validateTemplate(template: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for balanced each blocks
  const eachStarts = (template.match(/\{\{#each/g) || []).length;
  const eachEnds = (template.match(/\{\{\/each\}\}/g) || []).length;

  if (eachStarts !== eachEnds) {
    errors.push('Unbalanced {{#each}}...{{/each}} blocks');
  }

  // Check for malformed placeholders
  const malformedPlaceholders = template.match(/\{\{[^}]*$/g);
  if (malformedPlaceholders) {
    errors.push('Unclosed placeholder detected');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get list of available placeholders for documentation
 */
export function getAvailablePlaceholders(): string[] {
  return [
    '{{date}} / {{datum}} - Interview date',
    '{{time}} / {{tid}} - Interview time',
    '{{duration}} - Interview duration',
    '{{summary}} / {{sammanfattning}} - AI-generated summary',
    '{{#each answers}}...{{/each}} - Loop through all answers',
    '  {{@index}} - Current answer index (1-based)',
    '  {{this.questionText}} - Question text',
    '  {{this.answerText}} - Answer text',
    '  {{this.timestamp}} - Answer timestamp',
  ];
}
