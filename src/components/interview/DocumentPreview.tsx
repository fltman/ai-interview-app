/**
 * DocumentPreview component
 * Clean document view with share/download button
 */

import { useState, useEffect } from 'react';
import { Download, Share2, ArrowLeft, Loader2 } from 'lucide-react';
import type { Answer, Question, LanguageOption, DocumentFormat } from '../../types';
import {
  generateMarkdown,
  generatePlainText,
  formatFilename,
  type DocumentGeneratorOptions,
} from '../../utils/documentGenerator';
import { translateDocument, isTranslationNeeded } from '../../utils/translation';
import { generatePDFBlob, isPDFSupported } from '../../utils/pdfGenerator';
import { getExportCapabilities } from '../../utils/share';

export interface DocumentPreviewProps {
  answers: Answer[];
  questions: Question[];
  template: string;
  summary?: string;
  format: DocumentFormat;
  metadata: {
    startTime?: number;
    endTime?: number;
    language?: string;
    outputLanguage?: string;
  };
  apiKey?: string;
  onClose?: () => void;
}

export function DocumentPreview({
  answers,
  questions,
  template,
  summary,
  format,
  metadata,
  apiKey,
  onClose,
}: DocumentPreviewProps) {
  const [isTranslating, setIsTranslating] = useState(false);
  const [displayContent, setDisplayContent] = useState<string>('');
  const [isReady, setIsReady] = useState(false);

  // Generate document content on mount
  useEffect(() => {
    const generateDocument = async () => {
      const generatorOptions: DocumentGeneratorOptions = {
        template,
        answers,
        questions,
        metadata,
        summary,
      };

      // Generate content based on format
      const originalContent = format === 'text'
        ? generatePlainText(generatorOptions)
        : generateMarkdown(generatorOptions);

      // Check if translation is needed
      const sourceLang = (metadata.language as LanguageOption) || 'en-US';
      const targetLang = (metadata.outputLanguage as LanguageOption) || sourceLang;

      if (apiKey && isTranslationNeeded(sourceLang, targetLang)) {
        setIsTranslating(true);
        try {
          const translated = await translateDocument(
            originalContent,
            sourceLang,
            targetLang,
            apiKey
          );
          setDisplayContent(translated);
        } catch (error) {
          console.error('Translation failed:', error);
          setDisplayContent(originalContent);
        } finally {
          setIsTranslating(false);
        }
      } else {
        setDisplayContent(originalContent);
      }

      setIsReady(true);
    };

    generateDocument();
  }, [answers, questions, template, summary, metadata, apiKey, format]);

  // Handle download
  const handleDownload = () => {
    const filename = formatFilename(metadata, format);

    if (format === 'pdf' && isPDFSupported()) {
      const blob = generatePDFBlob(displayContent);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Download as text/markdown
      const mimeType = format === 'markdown' ? 'text/markdown' : 'text/plain';
      const blob = new Blob([displayContent], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Handle share
  const handleShare = async () => {
    const filename = formatFilename(metadata, format);

    if (format === 'pdf' && isPDFSupported()) {
      const blob = generatePDFBlob(displayContent);
      const file = new File([blob], filename, { type: 'application/pdf' });

      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            title: 'Interview Document',
            files: [file],
          });
        } catch (error) {
          if ((error as Error).name !== 'AbortError') {
            console.error('Share failed:', error);
          }
        }
      }
    } else {
      // Share text/markdown content
      const mimeType = format === 'markdown' ? 'text/markdown' : 'text/plain';
      const blob = new Blob([displayContent], { type: mimeType });
      const file = new File([blob], filename, { type: mimeType });

      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            title: 'Interview Document',
            files: [file],
          });
        } catch (error) {
          if ((error as Error).name !== 'AbortError') {
            console.error('Share failed:', error);
          }
        }
      } else {
        // Fallback to text share
        try {
          await navigator.share({
            title: 'Interview Document',
            text: displayContent,
          });
        } catch (error) {
          if ((error as Error).name !== 'AbortError') {
            console.error('Share failed:', error);
          }
        }
      }
    }
  };

  const capabilities = getExportCapabilities();

  // Show loading state
  if (!isReady) {
    return (
      <div className="flex flex-col h-full bg-gray-950 items-center justify-center">
        <Loader2 className="w-12 h-12 text-violet-400 animate-spin mb-4" />
        <p className="text-gray-400">
          {isTranslating ? 'Translating document...' : 'Generating document...'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Header */}
      <header className="pt-safe px-4 py-4 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-6 h-6 text-gray-400" />
            </button>
          )}
          <h1 className="text-xl font-semibold text-gray-200">Document</h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Content preview */}
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 max-w-2xl mx-auto">
          <pre className="whitespace-pre-wrap font-sans text-sm text-gray-200 leading-relaxed">
            {displayContent}
          </pre>
        </div>
      </div>

      {/* Action buttons */}
      <div className="p-4 pb-safe bg-gray-950 border-t border-gray-800">
        <div className="max-w-2xl mx-auto flex gap-3">
          <button
            onClick={handleDownload}
            className="flex-1 py-4 px-6 rounded-xl font-semibold bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center gap-2 transition-colors border border-gray-700"
          >
            <Download className="w-5 h-5" />
            Download
          </button>
          {capabilities.share && (
            <button
              onClick={handleShare}
              className="flex-1 py-4 px-6 rounded-xl font-semibold bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white flex items-center justify-center gap-2 transition-all"
            >
              <Share2 className="w-5 h-5" />
              Share
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
