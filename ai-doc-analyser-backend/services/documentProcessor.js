/**
 * AI Document Analyser - Document Processing Service
 * Supports multiple document formats: PDF, Word, Excel, Images (OCR), and more
 * 
 * @module documentProcessor
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import mammoth from 'mammoth';
import xlsx from 'xlsx';
import Tesseract from 'tesseract.js';

// Workaround for pdf-parse CommonJS module issue
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse/lib/pdf-parse.js');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Supported document types and their MIME types
 */
export const SUPPORTED_FORMATS = {
  // PDF Documents
  'application/pdf': { extension: 'pdf', type: 'PDF Document' },
  
  // Microsoft Word
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { extension: 'docx', type: 'Word Document' },
  'application/msword': { extension: 'doc', type: 'Word Document (Legacy)' },
  
  // Microsoft Excel
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { extension: 'xlsx', type: 'Excel Spreadsheet' },
  'application/vnd.ms-excel': { extension: 'xls', type: 'Excel Spreadsheet (Legacy)' },
  'text/csv': { extension: 'csv', type: 'CSV File' },
  
  // Images with OCR support
  'image/jpeg': { extension: 'jpg', type: 'JPEG Image', requiresOCR: true },
  'image/png': { extension: 'png', type: 'PNG Image', requiresOCR: true },
  'image/gif': { extension: 'gif', type: 'GIF Image', requiresOCR: true },
  'image/bmp': { extension: 'bmp', type: 'BMP Image', requiresOCR: true },
  'image/tiff': { extension: 'tiff', type: 'TIFF Image', requiresOCR: true },
  'image/webp': { extension: 'webp', type: 'WebP Image', requiresOCR: true },
  
  // Text files
  'text/plain': { extension: 'txt', type: 'Text File' },
  'text/html': { extension: 'html', type: 'HTML Document' },
  'text/markdown': { extension: 'md', type: 'Markdown Document' },
  
  // Rich Text
  'application/rtf': { extension: 'rtf', type: 'Rich Text Format' },
  
  // OpenDocument formats
  'application/vnd.oasis.opendocument.text': { extension: 'odt', type: 'OpenDocument Text' },
  'application/vnd.oasis.opendocument.spreadsheet': { extension: 'ods', type: 'OpenDocument Spreadsheet' }
};

/**
 * Document Processor Class
 * Handles extraction of text content from various document formats
 */
class DocumentProcessor {
  constructor() {
    this.maxFileSize = 50 * 1024 * 1024; // 50MB default
  }

  /**
   * Process a document and extract text content
   * @param {Buffer} fileBuffer - The file buffer
   * @param {string} mimeType - MIME type of the file
   * @param {string} fileName - Original file name
   * @returns {Promise<Object>} Extracted content and metadata
   */
  async processDocument(fileBuffer, mimeType, fileName) {
    const startTime = Date.now();
    
    try {
      // Validate file size
      if (fileBuffer.length > this.maxFileSize) {
        throw new Error(`File size exceeds maximum limit of ${this.maxFileSize / (1024 * 1024)}MB`);
      }

      // Check if format is supported
      const formatInfo = SUPPORTED_FORMATS[mimeType];
      if (!formatInfo) {
        throw new Error(`Unsupported file format: ${mimeType}`);
      }

      let content = '';
      let metadata = {
        fileName,
        mimeType,
        fileSize: fileBuffer.length,
        formatType: formatInfo.type,
        processingTime: 0,
        pageCount: 0,
        wordCount: 0,
        characterCount: 0
      };

      // Route to appropriate processor based on MIME type
      if (mimeType === 'application/pdf') {
        const result = await this.processPDF(fileBuffer);
        content = result.content;
        metadata.pageCount = result.pageCount;
        metadata.pdfInfo = result.info;
      } 
      else if (mimeType.includes('wordprocessingml') || mimeType === 'application/msword') {
        content = await this.processWord(fileBuffer);
      }
      else if (mimeType.includes('spreadsheetml') || mimeType.includes('ms-excel') || mimeType === 'text/csv') {
        const result = await this.processExcel(fileBuffer, mimeType);
        content = result.content;
        metadata.sheetCount = result.sheetCount;
        metadata.sheets = result.sheets;
      }
      else if (formatInfo.requiresOCR || mimeType.startsWith('image/')) {
        content = await this.processImageOCR(fileBuffer);
        metadata.ocrApplied = true;
      }
      else if (mimeType.startsWith('text/')) {
        content = fileBuffer.toString('utf-8');
      }
      else {
        throw new Error(`No processor available for: ${mimeType}`);
      }

      // Calculate statistics
      metadata.characterCount = content.length;
      metadata.wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
      metadata.processingTime = Date.now() - startTime;

      return {
        success: true,
        content: content.trim(),
        metadata
      };

    } catch (error) {
      console.error('Document processing error:', error);
      return {
        success: false,
        error: error.message,
        metadata: {
          fileName,
          mimeType,
          processingTime: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Process PDF documents
   * @param {Buffer} buffer - PDF file buffer
   * @returns {Promise<Object>} Extracted text and metadata
   */
  async processPDF(buffer) {
    try {
      const data = await pdfParse(buffer);
      return {
        content: data.text,
        pageCount: data.numpages,
        info: data.info,
        metadata: data.metadata
      };
    } catch (error) {
      throw new Error(`PDF processing failed: ${error.message}`);
    }
  }

  /**
   * Process Word documents (.docx, .doc)
   * @param {Buffer} buffer - Word file buffer
   * @returns {Promise<string>} Extracted text
   */
  async processWord(buffer) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      
      if (result.messages && result.messages.length > 0) {
        console.warn('Word processing warnings:', result.messages);
      }
      
      return result.value;
    } catch (error) {
      throw new Error(`Word document processing failed: ${error.message}`);
    }
  }

  /**
   * Process Excel/CSV files
   * @param {Buffer} buffer - Excel/CSV file buffer
   * @param {string} mimeType - MIME type
   * @returns {Promise<Object>} Extracted data
   */
  async processExcel(buffer, mimeType) {
    try {
      const workbook = xlsx.read(buffer, { 
        type: 'buffer',
        cellDates: true,
        cellNF: false,
        cellText: false
      });

      const sheets = [];
      let allContent = '';

      workbook.SheetNames.forEach((sheetName, index) => {
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to CSV format for better text representation
        const csvContent = xlsx.utils.sheet_to_csv(worksheet, {
          blankrows: false,
          skipHidden: true
        });

        // Also get JSON format for structured data
        const jsonData = xlsx.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
          blankrows: false
        });

        sheets.push({
          name: sheetName,
          index: index + 1,
          rowCount: jsonData.length,
          columnCount: jsonData[0]?.length || 0
        });

        // Format sheet content
        allContent += `\n\n=== Sheet: ${sheetName} ===\n`;
        allContent += `Rows: ${jsonData.length}, Columns: ${jsonData[0]?.length || 0}\n\n`;
        allContent += csvContent;
      });

      return {
        content: allContent.trim(),
        sheetCount: workbook.SheetNames.length,
        sheets
      };
    } catch (error) {
      throw new Error(`Excel/CSV processing failed: ${error.message}`);
    }
  }

  /**
   * Process images with OCR (Optical Character Recognition)
   * @param {Buffer} buffer - Image file buffer
   * @returns {Promise<string>} Extracted text
   */
  async processImageOCR(buffer) {
    try {
      console.log('Starting OCR processing...');
      
      const result = await Tesseract.recognize(
        buffer,
        'eng',
        {
          logger: info => {
            if (info.status === 'recognizing text') {
              console.log(`OCR Progress: ${(info.progress * 100).toFixed(1)}%`);
            }
          }
        }
      );

      if (!result.data || !result.data.text) {
        throw new Error('OCR failed to extract text from image');
      }

      const extractedText = result.data.text.trim();
      
      if (extractedText.length === 0) {
        return 'No text found in image. The image may not contain readable text or the text quality is too low for OCR.';
      }

      return extractedText;
    } catch (error) {
      throw new Error(`OCR processing failed: ${error.message}`);
    }
  }

  /**
   * Validate if a file type is supported
   * @param {string} mimeType - MIME type to check
   * @returns {boolean} Whether the type is supported
   */
  isSupported(mimeType) {
    return mimeType in SUPPORTED_FORMATS;
  }

  /**
   * Get supported format information
   * @param {string} mimeType - MIME type
   * @returns {Object|null} Format information
   */
  getFormatInfo(mimeType) {
    return SUPPORTED_FORMATS[mimeType] || null;
  }

  /**
   * Get list of all supported formats
   * @returns {Array<Object>} List of supported formats
   */
  getSupportedFormats() {
    return Object.entries(SUPPORTED_FORMATS).map(([mimeType, info]) => ({
      mimeType,
      ...info
    }));
  }
}

// Export singleton instance
export default new DocumentProcessor();
