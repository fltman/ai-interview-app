# Document Generation and Export

This document describes the implementation of document generation and export functionality for the AI Interview App.

## Overview

The document generation system allows users to:
1. Generate formatted documents from interview data using customizable templates
2. Export documents in multiple formats (Markdown, Plain Text, PDF)
3. Translate documents to different languages using OpenAI
4. Share or download documents via Web Share API or direct download

## Architecture

### Core Components

#### 1. Template Processor (`src/utils/templateProcessor.ts`)
Handles template parsing and processing with Handlebars-like syntax.

**Features:**
- Simple placeholders: `{{date}}`, `{{time}}`, `{{summary}}`
- Loop blocks: `{{#each answers}}...{{/each}}`
- Index access: `{{@index}}`
- Property access: `{{this.questionText}}`
- Missing value handling: Shows `[Ej besvarat]` for undefined values

**API:**
```typescript
processTemplate(template: string, context: TemplateContext): string
buildTemplateContext(answers, questions, metadata, summary): TemplateContext
validateTemplate(template: string): { valid: boolean; errors: string[] }
getAvailablePlaceholders(): string[]
```

**Example Template:**
```markdown
# Interview Summary

**Date:** {{date}}
**Duration:** {{duration}}

## Questions and Answers

{{#each answers}}
### Question {{@index}}: {{this.questionText}}

{{this.answerText}}

{{/each}}

## Summary
{{summary}}
```

#### 2. Document Generator (`src/utils/documentGenerator.ts`)
Generates documents in different formats.

**API:**
```typescript
generateDocument(options: DocumentGeneratorOptions): string
generateMarkdown(options: DocumentGeneratorOptions): string
generatePlainText(options: DocumentGeneratorOptions): string
formatFilename(metadata, format): string
getWordCount(content: string): number
getReadingTime(content: string): number
getDocumentStats(options: DocumentGeneratorOptions): Stats
```

**Formats:**
- **Markdown**: Rich formatting with headers, bold, lists
- **Plain Text**: Clean text without formatting markers
- **PDF**: Via separate PDF generator

#### 3. Translation Service (`src/utils/translation.ts`)
Translates documents using OpenAI Chat API.

**API:**
```typescript
translateDocument(
  content: string,
  sourceLang: LanguageOption,
  targetLang: LanguageOption,
  apiKey: string
): Promise<string>

isTranslationNeeded(sourceLang, targetLang): boolean
estimateTranslationTokens(content: string): number
batchTranslate(sections, sourceLang, targetLang, apiKey, onProgress?): Promise<string[]>
splitDocumentIntoSections(content: string, maxSectionLength?): string[]
```

**Features:**
- Uses GPT-4o-mini for cost-effective translation
- Preserves all markdown formatting
- Low temperature (0.3) for consistency
- Batch translation support for large documents
- Progress callbacks

#### 4. PDF Generator (`src/utils/pdfGenerator.ts`)
Generates PDFs using jsPDF library.

**API:**
```typescript
generatePDF(content: string, filename: string): void
generatePDFWithOptions(options: PDFOptions): void
generatePDFBlob(content: string): Blob
estimatePageCount(content: string): number
isPDFSupported(): boolean
stripMarkdownForPDF(content: string): string
```

**Features:**
- Supports Swedish characters (UTF-8)
- Automatic page breaks
- Markdown rendering (headers, bold, lists)
- Text wrapping
- Configurable styling

#### 5. Share & Export (`src/utils/share.ts`)
Handles document export via multiple methods.

**API:**
```typescript
shareDocument(title: string, content: string, file?: File): Promise<boolean>
downloadDocument(content: string, filename: string, mimeType: string): void
downloadBlob(blob: Blob, filename: string): void
copyToClipboard(content: string): Promise<boolean>
getExportCapabilities(): ExportCapabilities
exportDocument(content, filename, format, title): Promise<ShareResult>
```

**Export Methods:**
1. **Web Share API**: Mobile-first sharing (if supported)
2. **Download**: Fallback for desktop browsers
3. **Clipboard**: Copy to clipboard for easy pasting

**Capability Detection:**
- `canShare()`: Check if Web Share API is available
- `canShare({ files })`: Check if file sharing is supported
- `supportsDownload()`: Check if downloads are supported
- `supportsClipboard()`: Check if clipboard API is available

#### 6. DocumentPreview Component (`src/components/interview/DocumentPreview.tsx`)
React component for previewing and exporting documents.

**Props:**
```typescript
interface DocumentPreviewProps {
  answers: Answer[];
  questions: Question[];
  template: string;
  summary?: string;
  metadata: {
    startTime?: number;
    endTime?: number;
    language?: string;
  };
  apiKey?: string;
  onClose?: () => void;
}
```

**Features:**
- Format selector (Markdown/Text/PDF)
- Live preview with statistics
- Translation UI (if API key provided)
- Export buttons (Share/Download/Copy)
- Loading states and error handling
- Responsive design

## Usage Examples

### Basic Document Generation

```typescript
import { generateMarkdown, formatFilename } from './utils/documentGenerator';

const options = {
  template: templateString,
  answers: interviewAnswers,
  questions: interviewQuestions,
  metadata: {
    startTime: Date.now(),
    endTime: Date.now() + 900000,
    language: 'en-US',
  },
  summary: 'Interview went well with detailed answers.',
};

const document = generateMarkdown(options);
const filename = formatFilename(options.metadata, 'markdown');
```

### Translation

```typescript
import { translateDocument } from './utils/translation';

const translated = await translateDocument(
  markdownContent,
  'en-US',
  'sv-SE',
  apiKey
);
```

### Export

```typescript
import { exportDocument } from './utils/share';

const result = await exportDocument(
  content,
  'intervju-2024-01-15-1430.md',
  'markdown',
  'Interview Document'
);

if (result.success) {
  console.log(`Exported via ${result.method}`);
}
```

### Using DocumentPreview Component

```tsx
import { DocumentPreview } from './components/interview';

function InterviewCompleteScreen() {
  return (
    <DocumentPreview
      answers={answers}
      questions={questions}
      template={settings.documentTemplate}
      summary={aiGeneratedSummary}
      metadata={{
        startTime: interviewStartTime,
        endTime: interviewEndTime,
        language: settings.language,
      }}
      apiKey={settings.apiKey}
      onClose={() => navigate('/')}
    />
  );
}
```

## Template Variables

### Available Placeholders

- `{{date}}` / `{{datum}}` - Interview date (YYYY-MM-DD)
- `{{time}}` / `{{tid}}` - Interview time (HH:MM)
- `{{duration}}` - Interview duration in minutes
- `{{summary}}` / `{{sammanfattning}}` - AI-generated summary

### Loop Syntax

```handlebars
{{#each answers}}
  Question {{@index}}: {{this.questionText}}
  Answer: {{this.answerText}}
  Timestamp: {{this.timestamp}}
{{/each}}
```

### Answer Object Properties

- `questionId` - Question identifier
- `question` / `questionText` - Question text
- `answer` / `answerText` - Answer text
- `timestamp` - Answer timestamp (formatted)

## File Naming Convention

Files are automatically named using the pattern:
```
intervju-YYYY-MM-DD-HHMM.{ext}
```

Example: `intervju-2024-01-15-1430.md`

## Testing

Run tests with:
```bash
npm test -- src/utils/__tests__/
```

Tests cover:
- Template processing (placeholders, loops, validation)
- Document generation (all formats)
- Filename formatting
- Word count and reading time calculation
- Template validation

## Performance Considerations

1. **Translation**: Uses GPT-4o-mini for cost efficiency (~$0.15 per 1M tokens)
2. **Batch Processing**: Large documents are split into sections for translation
3. **PDF Generation**: Runs client-side, no server required
4. **Lazy Loading**: Components and utilities are tree-shakeable

## Browser Compatibility

- **Web Share API**: Mobile browsers (iOS Safari, Android Chrome)
- **Clipboard API**: Modern browsers (Chrome 63+, Firefox 53+, Safari 13.1+)
- **Download**: All browsers
- **PDF Generation**: All browsers with jsPDF support

## Security

- API keys stored locally (localStorage)
- No server-side processing required
- Direct OpenAI API calls from client
- User data never leaves device (except OpenAI API calls)

## Future Enhancements

- [ ] Rich text editor for templates
- [ ] Template library with presets
- [ ] Email export
- [ ] Cloud storage integration (Dropbox, Google Drive)
- [ ] Batch export (multiple formats at once)
- [ ] Custom PDF styling
- [ ] Word document export (.docx)
- [ ] Audio attachment in exports

## Dependencies

- `jspdf` (^2.5.1) - PDF generation
- `lucide-react` (^0.460.0) - Icons
- OpenAI API - Translation service

## License

Same as parent project.
