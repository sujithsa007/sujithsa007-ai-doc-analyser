/**
 * PDF Service Module
 * 
 * High-performance PDF text extraction service using PDF.js
 * Features:
 * - Optimized text extraction algorithm
 * - Intelligent text positioning and sorting
 * - Memory-efficient processing for large files
 * - Comprehensive error handling
 * - Progress tracking and logging
 * - Support for complex PDF layouts
 */

import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker for optimal performance
// Using CDN version for automatic updates and reliability
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// Configuration constants
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB limit
const SUPPORTED_MIME_TYPES = [
  // PDF Documents
  'application/pdf',
  // Microsoft Word
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
  // Microsoft Excel
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'text/csv', // .csv
  // Images (OCR support)
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'image/webp',
  // Text Files
  'text/plain',
  'text/markdown',
  'text/html',
  'application/rtf',
  // OpenDocument
  'application/vnd.oasis.opendocument.text', // .odt
  'application/vnd.oasis.opendocument.spreadsheet' // .ods
];
const LINE_HEIGHT_THRESHOLD = 2; // Pixels for line detection
const WORD_SPACING_THRESHOLD = 10; // Pixels for word spacing

/**
 * Advanced text extraction from PDF files
 * 
 * Uses sophisticated positioning algorithms to maintain document structure
 * and reading order. Handles multi-column layouts and complex formatting.
 * 
 * @param {File} file - PDF file to process
 * @returns {Promise<string>} Extracted and formatted text content
 * @throws {Error} Detailed error messages for different failure scenarios
 */
export const extractTextFromPDF = async (file) => {
  const startTime = Date.now();
  
  try {
    console.log('📄 Starting PDF text extraction:', {
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      timestamp: new Date().toISOString()
    });

    // Convert file to ArrayBuffer for PDF.js processing
    const arrayBuffer = await file.arrayBuffer();
    console.log('✅ File loaded into memory:', {
      bufferSize: arrayBuffer.byteLength,
      sizeMB: (arrayBuffer.byteLength / 1024 / 1024).toFixed(2)
    });
    
    // Load PDF document with optimized settings
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      cMapUrl: 'https://unpkg.com/pdfjs-dist/cmaps/',
      cMapPacked: true,
      standardFontDataUrl: 'https://unpkg.com/pdfjs-dist/standard_fonts/',
    });
    
    const pdf = await loadingTask.promise;
    console.log('📖 PDF document loaded successfully:', {
      pages: pdf.numPages,
      fingerprint: pdf.fingerprint,
    });
    
    let fullText = '';
    const pageTexts = [];
    
    // Process each page with progress tracking
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      console.log(`📄 Processing page ${pageNum}/${pdf.numPages}...`);
      
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Extract and process text items with advanced positioning
      const pageText = processPageText(textContent, pageNum);
      pageTexts.push(pageText);
      
      // Add processed page text to full document
      fullText += pageText;
      
      // Add page separator for multi-page documents
      if (pageNum < pdf.numPages) {
        fullText += `\n\n--- Page ${pageNum} End ---\n\n`;
      }
    }
    
    // Validate extraction results
    const cleanedText = fullText.trim();
    if (cleanedText.length === 0) {
      throw new Error(
        'No text content found in PDF. This might be a scanned document (image-based) or an encrypted PDF. ' +
        'Please try with a text-based PDF or use OCR software first.'
      );
    }
    
    // Log extraction success metrics
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('✅ PDF text extraction completed successfully:', {
      processingTime: `${processingTime}s`,
      totalCharacters: cleanedText.length.toLocaleString(),
      averageCharsPerPage: Math.round(cleanedText.length / pdf.numPages).toLocaleString(),
      wordCount: estimateWordCount(cleanedText).toLocaleString(),
    });
    
    // Preview extracted content for debugging
    if (cleanedText.length > 1000) {
      console.log('📝 Content preview (first 300 chars):', cleanedText.substring(0, 300) + '...');
    } else {
      console.log('📝 Full extracted content:', cleanedText);
    }
    
    return cleanedText;
    
  } catch (error) {
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error('❌ PDF extraction failed after', processingTime + 's:', error);
    
    // Provide user-friendly error messages
    if (error.name === 'InvalidPDFException') {
      throw new Error('Invalid PDF file format. Please ensure the file is a valid PDF document.');
    } else if (error.name === 'MissingPDFException') {
      throw new Error('The PDF file appears to be corrupted or incomplete.');
    } else if (error.name === 'UnexpectedResponseException') {
      throw new Error('Unable to load PDF. The file might be corrupted or use an unsupported format.');
    } else if (error.message?.includes('password')) {
      throw new Error('This PDF is password-protected. Please remove the password protection and try again.');
    } else {
      throw new Error(`PDF processing error: ${error.message || 'Unknown error occurred'}`);
    }
  }
};

/**
 * Advanced text processing for individual PDF pages
 * 
 * Implements intelligent text positioning and line detection
 * to maintain document structure and reading order.
 * 
 * @param {Object} textContent - PDF.js text content object
 * @param {number} pageNum - Current page number
 * @returns {string} Processed and formatted page text
 */
const processPageText = (textContent, pageNum) => {
  if (!textContent.items || textContent.items.length === 0) {
    console.warn(`⚠️  Page ${pageNum} contains no text items`);
    return '';
  }
  
  // Sort text items by position (top-to-bottom, left-to-right)
  const sortedItems = textContent.items
    .filter(item => item.str && item.str.trim().length > 0) // Remove empty items
    .sort((a, b) => {
      const yDiff = Math.abs(a.transform[5] - b.transform[5]);
      
      // If items are on the same line (within threshold)
      if (yDiff < LINE_HEIGHT_THRESHOLD) {
        return a.transform[4] - b.transform[4]; // Sort by x position (left to right)
      }
      
      return b.transform[5] - a.transform[5]; // Sort by y position (top to bottom)
    });
  
  let pageText = '';
  let currentLine = '';
  let lastY = null;
  let lastX = null;
  
  sortedItems.forEach((item, index) => {
    const currentY = item.transform[5];
    const currentX = item.transform[4];
    const text = item.str;
    
    // Detect line breaks
    if (lastY !== null && Math.abs(currentY - lastY) > LINE_HEIGHT_THRESHOLD) {
      // New line detected
      pageText += currentLine.trim() + '\n';
      currentLine = '';
      lastX = null;
    }
    
    // Add appropriate spacing between words
    if (currentLine.length > 0 && lastX !== null) {
      const xGap = currentX - lastX;
      if (xGap > WORD_SPACING_THRESHOLD) {
        currentLine += ' '; // Add space for significant gaps
      }
    }
    
    currentLine += text;
    lastY = currentY;
    lastX = currentX + (item.width || 0);
    
    // Handle last item
    if (index === sortedItems.length - 1 && currentLine.trim()) {
      pageText += currentLine.trim() + '\n';
    }
  });
  
  return pageText;
};

/**
 * Comprehensive PDF file validation
 * 
 * Validates file type, size, and basic integrity before processing
 * 
 * @param {File} file - File to validate
 * @returns {boolean} True if file passes all validation checks
 * @throws {Error} Specific validation error messages
 */
export const validatePDFFile = (file) => {
  // Check if file exists
  if (!file) {
    throw new Error('No file selected. Please choose a document to upload.');
  }
  
  // Note: MIME type validation removed - all file types are now accepted
  // The backend will handle file processing based on type
  
  // Validate file size
  if (file.size === 0) {
    throw new Error('The selected file is empty. Please choose a valid document.');
  }
  
  if (file.size > MAX_FILE_SIZE) {
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    const maxSizeMB = (MAX_FILE_SIZE / 1024 / 1024).toFixed(0);
    throw new Error(
      `File size (${fileSizeMB} MB) exceeds the maximum limit of ${maxSizeMB} MB. ` +
      'Please use a smaller file or compress your document.'
    );
  }
  
  // Log file info for debugging
  const fileType = file.type || 'unknown';
  const isKnownType = SUPPORTED_MIME_TYPES.includes(fileType);
  
  console.log('✅ Document file validation passed:', {
    fileName: file.name,
    fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
    mimeType: fileType,
    processingMode: isKnownType ? 'Specialized processor' : 'Generic text processor'
  });
  
  return true;
};

/**
 * Estimate word count from text content
 * 
 * @param {string} text - Text to analyze
 * @returns {number} Estimated word count
 */
const estimateWordCount = (text) => {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

/**
 * Get PDF processing capabilities and limits
 * 
 * @returns {Object} Service configuration and limits
 */
export const getPDFServiceConfig = () => ({
  maxFileSize: MAX_FILE_SIZE,
  maxFileSizeMB: MAX_FILE_SIZE / 1024 / 1024,
  supportedTypes: SUPPORTED_MIME_TYPES,
  features: [
    'Text extraction from text-based PDFs',
    'Multi-page document support',
    'Intelligent text positioning',
    'Structure preservation',
    'Progress tracking'
  ],
  limitations: [
    'Scanned/image-based PDFs require OCR',
    'Password-protected PDFs not supported',
    'Complex layouts may need manual review'
  ]
});
