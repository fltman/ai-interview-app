/**
 * PDF generation utilities using jsPDF
 * Supports Swedish characters and basic formatting
 */

import jsPDF from 'jspdf';

interface PDFOptions {
  content: string;
  filename: string;
  title?: string;
  metadata?: {
    author?: string;
    subject?: string;
    keywords?: string;
  };
}

/**
 * Generate PDF from markdown or plain text content
 */
export function generatePDF(content: string, filename: string): void {
  generatePDFWithOptions({
    content,
    filename,
  });
}

/**
 * Generate PDF with advanced options
 */
export function generatePDFWithOptions(options: PDFOptions): void {
  const { content, filename, title, metadata } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Set document metadata
  if (title) {
    doc.setProperties({
      title,
      subject: metadata?.subject || 'Interview Document',
      author: metadata?.author || 'AI Interview App',
      keywords: metadata?.keywords || 'interview, ai, transcript',
      creator: 'AI Interview App',
    });
  }

  // Configure fonts and styling
  doc.setFont('helvetica');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;

  let yPosition = margin;
  const lineHeight = 7;
  const headerLineHeight = 10;

  // Parse and render content
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!line) continue;

    // Check if we need a new page
    if (yPosition > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }

    // Handle different markdown elements
    if (line.startsWith('# ')) {
      // H1 - Main header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      const text = line.substring(2);
      doc.text(text, margin, yPosition);
      yPosition += headerLineHeight * 1.5;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
    } else if (line.startsWith('## ')) {
      // H2 - Section header
      yPosition += lineHeight / 2; // Add space before section
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      const text = line.substring(3);
      doc.text(text, margin, yPosition);
      yPosition += headerLineHeight;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
    } else if (line.startsWith('### ')) {
      // H3 - Subsection header
      yPosition += lineHeight / 2;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      const text = line.substring(4);
      doc.text(text, margin, yPosition);
      yPosition += headerLineHeight;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
    } else if (line.startsWith('**') && line.endsWith('**')) {
      // Bold text (simple case)
      doc.setFont('helvetica', 'bold');
      const text = line.replace(/\*\*/g, '');
      doc.text(text, margin, yPosition);
      yPosition += lineHeight;
      doc.setFont('helvetica', 'normal');
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      // List item
      const text = line.substring(2);
      doc.text('• ' + text, margin + 5, yPosition);
      yPosition += lineHeight;
    } else if (line.trim() === '') {
      // Empty line - add spacing
      yPosition += lineHeight / 2;
    } else if (line.trim().match(/^-+$|^=+$/)) {
      // Horizontal rule - skip it
      continue;
    } else {
      // Regular text - handle wrapping
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);

      // Split long lines
      const wrappedLines = doc.splitTextToSize(line, maxWidth);

      for (const wrappedLine of wrappedLines) {
        // Check if we need a new page
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }

        doc.text(wrappedLine, margin, yPosition);
        yPosition += lineHeight;
      }
    }
  }

  // Save the PDF
  doc.save(filename);
}

/**
 * Generate PDF and return as Blob (for sharing)
 */
export function generatePDFBlob(content: string): Blob {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;

  let yPosition = margin;
  const lineHeight = 7;

  // Simple rendering (same as above but simplified)
  const lines = content.split('\n');

  for (const line of lines) {
    if (yPosition > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }

    if (line.trim()) {
      const wrappedLines = doc.splitTextToSize(line, maxWidth);
      for (const wrappedLine of wrappedLines) {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(wrappedLine, margin, yPosition);
        yPosition += lineHeight;
      }
    } else {
      yPosition += lineHeight / 2;
    }
  }

  return doc.output('blob');
}

/**
 * Estimate PDF page count
 */
export function estimatePageCount(content: string): number {
  const linesPerPage = 40; // Approximate
  const lines = content.split('\n').length;
  return Math.ceil(lines / linesPerPage);
}

/**
 * Check if PDF generation is supported
 */
export function isPDFSupported(): boolean {
  try {
    // Check if jsPDF is available
    new jsPDF();
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert markdown to plain text for PDF
 */
export function stripMarkdownForPDF(content: string): string {
  return content
    .replace(/^#{1,6}\s+/gm, '') // Remove headers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
    .replace(/`([^`]+)`/g, '$1') // Remove code formatting
    .replace(/^>\s+/gm, '') // Remove blockquotes
    .trim();
}
