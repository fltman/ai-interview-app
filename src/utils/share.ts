/**
 * Document sharing and export utilities
 * Supports Web Share API, downloads, and clipboard operations
 */

interface ShareOptions {
  title: string;
  text?: string;
  url?: string;
  files?: File[];
}

interface ShareResult {
  success: boolean;
  method: 'share' | 'download' | 'clipboard' | 'failed';
  error?: string;
}

/**
 * Share document using Web Share API with fallback to download
 */
export async function shareDocument(
  title: string,
  content: string,
  file?: File
): Promise<boolean> {
  const result = await shareWithBestMethod({
    title,
    text: content,
    files: file ? [file] : undefined,
  });

  return result.success;
}

/**
 * Share using the best available method
 */
async function shareWithBestMethod(options: ShareOptions): Promise<ShareResult> {
  // Try Web Share API first (mobile devices)
  if (canShare(options)) {
    try {
      await navigator.share(options);
      return { success: true, method: 'share' };
    } catch (error) {
      // User cancelled or error occurred
      if (error instanceof Error && error.name === 'AbortError') {
        return { success: false, method: 'failed', error: 'User cancelled' };
      }
      // Fall through to other methods
    }
  }

  // Fallback to download
  return { success: false, method: 'failed', error: 'Web Share API not available' };
}

/**
 * Check if content can be shared via Web Share API
 */
export function canShare(options?: ShareOptions): boolean {
  if (!navigator.share) {
    return false;
  }

  if (!options) {
    return true;
  }

  // Check if files can be shared
  if (options.files && options.files.length > 0) {
    return navigator.canShare?.(options) ?? false;
  }

  return true;
}

/**
 * Download document to user's device
 */
export function downloadDocument(
  content: string,
  filename: string,
  mimeType: string = 'text/markdown'
): void {
  try {
    // Create blob from content
    const blob = new Blob([content], { type: mimeType });

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download failed:', error);
    throw new Error('Failed to download document');
  }
}

/**
 * Download blob (for PDF files)
 */
export function downloadBlob(blob: Blob, filename: string): void {
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download failed:', error);
    throw new Error('Failed to download file');
  }
}

/**
 * Copy content to clipboard
 */
export async function copyToClipboard(content: string): Promise<boolean> {
  try {
    // Try modern Clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(content);
      return true;
    }

    // Fallback to old method
    return fallbackCopyToClipboard(content);
  } catch (error) {
    console.error('Copy to clipboard failed:', error);
    return false;
  }
}

/**
 * Fallback clipboard copy for older browsers
 */
function fallbackCopyToClipboard(content: string): boolean {
  try {
    const textArea = document.createElement('textarea');
    textArea.value = content;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);

    return successful;
  } catch (error) {
    console.error('Fallback copy failed:', error);
    return false;
  }
}

/**
 * Create a File object from content (for Web Share API)
 */
export function createFile(
  content: string,
  filename: string,
  mimeType: string = 'text/markdown'
): File {
  const blob = new Blob([content], { type: mimeType });
  return new File([blob], filename, { type: mimeType });
}

/**
 * Create a File object from Blob
 */
export function createFileFromBlob(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: blob.type });
}

/**
 * Get MIME type for file format
 */
export function getMimeType(format: 'markdown' | 'text' | 'pdf'): string {
  const mimeTypes = {
    markdown: 'text/markdown',
    text: 'text/plain',
    pdf: 'application/pdf',
  };

  return mimeTypes[format];
}

/**
 * Check if device likely supports file downloads
 */
export function supportsDownload(): boolean {
  return typeof document !== 'undefined' && 'createElement' in document;
}

/**
 * Check if clipboard API is available
 */
export function supportsClipboard(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    (('clipboard' in navigator && 'writeText' in navigator.clipboard) ||
      'execCommand' in document)
  );
}

/**
 * Get available export methods for current environment
 */
export interface ExportCapabilities {
  share: boolean;
  shareFiles: boolean;
  download: boolean;
  clipboard: boolean;
}

export function getExportCapabilities(): ExportCapabilities {
  return {
    share: canShare(),
    shareFiles: canShare({ title: 'test', files: [new File([], 'test.txt')] }),
    download: supportsDownload(),
    clipboard: supportsClipboard(),
  };
}

/**
 * Share or download based on available capabilities
 */
export async function exportDocument(
  content: string,
  filename: string,
  format: 'markdown' | 'text' | 'pdf',
  title: string = 'Interview Document'
): Promise<ShareResult> {
  const mimeType = getMimeType(format);
  const capabilities = getExportCapabilities();

  // Try to share if available (mobile)
  if (capabilities.shareFiles) {
    const file = createFile(content, filename, mimeType);

    try {
      await navigator.share({
        title,
        files: [file],
      });
      return { success: true, method: 'share' };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { success: false, method: 'failed', error: 'User cancelled' };
      }
      // Fall through to download
    }
  } else if (capabilities.share && format !== 'pdf') {
    // Share text content only (no files)
    try {
      await navigator.share({
        title,
        text: content,
      });
      return { success: true, method: 'share' };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { success: false, method: 'failed', error: 'User cancelled' };
      }
      // Fall through to download
    }
  }

  // Fallback to download
  if (capabilities.download) {
    try {
      downloadDocument(content, filename, mimeType);
      return { success: true, method: 'download' };
    } catch (error) {
      return {
        success: false,
        method: 'failed',
        error: error instanceof Error ? error.message : 'Download failed',
      };
    }
  }

  return {
    success: false,
    method: 'failed',
    error: 'No export methods available',
  };
}
