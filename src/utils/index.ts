/**
 * Export all utility functions
 */

// Storage utilities
export * from './storage';

// Template processing
export {
  processTemplate,
  buildTemplateContext,
  validateTemplate,
  getAvailablePlaceholders,
} from './templateProcessor';

// Document generation
export {
  generateDocument,
  generateMarkdown,
  generatePlainText,
  formatFilename,
  getWordCount,
  getReadingTime,
  getDocumentStats,
  type DocumentGeneratorOptions,
} from './documentGenerator';

// Translation
export {
  translateDocument,
  isTranslationNeeded,
  estimateTranslationTokens,
  batchTranslate,
  splitDocumentIntoSections,
} from './translation';

// PDF generation
export {
  generatePDF,
  generatePDFWithOptions,
  generatePDFBlob,
  estimatePageCount,
  isPDFSupported,
  stripMarkdownForPDF,
} from './pdfGenerator';

// Sharing and export
export {
  shareDocument,
  downloadDocument,
  downloadBlob,
  copyToClipboard,
  createFile,
  createFileFromBlob,
  getMimeType,
  canShare,
  supportsDownload,
  supportsClipboard,
  getExportCapabilities,
  exportDocument,
  type ExportCapabilities,
} from './share';
