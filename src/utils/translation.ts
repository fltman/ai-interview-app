/**
 * Translation utilities using OpenAI Chat API
 * Preserves document formatting while translating content
 */

import { LanguageOption } from '../types';

interface TranslationOptions {
  content: string;
  sourceLang: LanguageOption;
  targetLang: LanguageOption;
  apiKey: string;
  preserveFormatting?: boolean;
}

interface TranslationResult {
  translatedContent: string;
  success: boolean;
  error?: string;
}

/**
 * Language code mapping for OpenAI
 */
const LANGUAGE_NAMES: Record<LanguageOption, string> = {
  'sv-SE': 'Swedish',
  'en-US': 'English',
  'en-GB': 'English',
  'de-DE': 'German',
  'fr-FR': 'French',
  'es-ES': 'Spanish',
  'it-IT': 'Italian',
  'pt-PT': 'Portuguese',
  'nl-NL': 'Dutch',
  'pl-PL': 'Polish',
  'ru-RU': 'Russian',
  'ja-JP': 'Japanese',
  'ko-KR': 'Korean',
  'zh-CN': 'Chinese (Simplified)',
};

/**
 * Translate document content using OpenAI Chat API
 */
export async function translateDocument(
  content: string,
  sourceLang: LanguageOption,
  targetLang: LanguageOption,
  apiKey: string
): Promise<string> {
  const result = await translateWithOpenAI({
    content,
    sourceLang,
    targetLang,
    apiKey,
    preserveFormatting: true,
  });

  if (!result.success) {
    throw new Error(result.error || 'Translation failed');
  }

  return result.translatedContent;
}

/**
 * Translate using OpenAI Chat API
 */
async function translateWithOpenAI(
  options: TranslationOptions
): Promise<TranslationResult> {
  const { content, sourceLang, targetLang, apiKey, preserveFormatting = true } = options;

  try {
    const sourceLanguage = LANGUAGE_NAMES[sourceLang] || sourceLang;
    const targetLanguage = LANGUAGE_NAMES[targetLang] || targetLang;

    const systemPrompt = preserveFormatting
      ? `You are a professional translator. Translate the following text from ${sourceLanguage} to ${targetLanguage}.
IMPORTANT: Preserve ALL formatting including:
- Markdown syntax (headers, bold, italic, lists, etc.)
- Line breaks and spacing
- Special characters and punctuation
- Template placeholders in the format {{placeholder}}

Only translate the actual text content, not formatting markers or placeholders.`
      : `You are a professional translator. Translate the following text from ${sourceLanguage} to ${targetLanguage}.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: content,
          },
        ],
        temperature: 0.3, // Lower temperature for more consistent translations
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      return {
        translatedContent: '',
        success: false,
        error: errorMessage,
      };
    }

    const data = await response.json();
    const translatedContent = data.choices?.[0]?.message?.content;

    if (!translatedContent) {
      return {
        translatedContent: '',
        success: false,
        error: 'No translation returned from API',
      };
    }

    return {
      translatedContent,
      success: true,
    };
  } catch (error) {
    return {
      translatedContent: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Check if translation is needed
 */
export function isTranslationNeeded(
  sourceLang: LanguageOption,
  targetLang: LanguageOption
): boolean {
  // Normalize language codes (en-US and en-GB are the same language)
  const normalizeCode = (lang: LanguageOption) => lang.split('-')[0];
  return normalizeCode(sourceLang) !== normalizeCode(targetLang);
}

/**
 * Estimate translation cost (tokens)
 */
export function estimateTranslationTokens(content: string): number {
  // Rough estimation: 1 token ≈ 4 characters for English, varies by language
  // We estimate both input and output tokens
  const inputTokens = Math.ceil(content.length / 4);
  const outputTokens = inputTokens; // Assume similar length for output
  return inputTokens + outputTokens;
}

/**
 * Batch translate multiple sections (for large documents)
 */
export async function batchTranslate(
  sections: string[],
  sourceLang: LanguageOption,
  targetLang: LanguageOption,
  apiKey: string,
  onProgress?: (current: number, total: number) => void
): Promise<string[]> {
  const results: string[] = [];

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    if (!section) continue;

    const translated = await translateDocument(
      section,
      sourceLang,
      targetLang,
      apiKey
    );
    results.push(translated);

    if (onProgress) {
      onProgress(i + 1, sections.length);
    }
  }

  return results;
}

/**
 * Split large document into sections for batch translation
 */
export function splitDocumentIntoSections(
  content: string,
  maxSectionLength: number = 2000
): string[] {
  const sections: string[] = [];
  const lines = content.split('\n');
  let currentSection = '';

  for (const line of lines) {
    if (currentSection.length + line.length > maxSectionLength && currentSection) {
      sections.push(currentSection.trim());
      currentSection = '';
    }
    currentSection += line + '\n';
  }

  if (currentSection.trim()) {
    sections.push(currentSection.trim());
  }

  return sections;
}
