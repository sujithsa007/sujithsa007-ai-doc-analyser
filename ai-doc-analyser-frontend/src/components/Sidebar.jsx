/**
 * Sidebar Component
 * 
 * Provides PDF document management functionality including:
 * - File upload interface
 * - Document processing status
 * - Content preview toggle
 * - File information display
 * - Error handling and user feedback
 */

import React, { useCallback, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedFile, setContent, setIsParsing, setError } from '../store/slices/pdfSlice';
import { togglePreview } from '../store/slices/uiSlice';
import { clearMessages } from '../store/slices/chatSlice';
import { extractTextFromPDF, validatePDFFile } from '../services/pdfService';
import PDFPreview from './PDFPreview';

/**
 * File Upload Status Component
 * Shows current processing status with visual feedback
 */
const FileStatus = React.memo(({ isParsing, selectedFile, content }) => {
  if (isParsing) {
    return (
      <div style={styles.statusCard}>
        <div style={styles.processingStatus}>
          <span className="loading" style={styles.loadingIcon}>⏳</span>
          <span style={styles.processingText}>Processing document...</span>
        </div>
        <div style={styles.progressBar}>
          <div style={styles.progressFill} className="loading"></div>
        </div>
      </div>
    );
  }

  if (selectedFile && content) {
    const fileSizeMB = (selectedFile.size / (1024 * 1024)).toFixed(2);
    const wordCount = content.split(/\s+/).length;
    
    return (
      <div style={styles.successCard}>
        <div style={styles.fileInfo}>
          <span style={styles.successIcon}>✅</span>
          <div style={styles.fileDetails}>
            <p style={styles.fileName}>{selectedFile.name}</p>
            <div style={styles.fileStats}>
              <span>{fileSizeMB} MB</span>
              <span>•</span>
              <span>{wordCount.toLocaleString()} words</span>
              <span>•</span>
              <span>{content.length.toLocaleString()} chars</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
});

/**
 * Main Sidebar Component
 * 
 * Handles PDF document upload, processing, and management
 * Provides preview functionality and file status feedback
 */
const Sidebar = () => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  
  // Redux state selectors
  const { content, selectedFile, isParsing, error } = useSelector((state) => state.pdf);
  const { showPreview } = useSelector((state) => state.ui);

  // Memoized computed values
  const hasDocument = useMemo(() => Boolean(content && selectedFile), [content, selectedFile]);
  const canUpload = useMemo(() => !isParsing, [isParsing]);

  /**
   * Handles document file upload and processing
   * Validates file, uploads to backend, and updates Redux state
   */
  const handleFileChange = useCallback(async (event) => {
    const file = event.target.files[0];
    
    if (!file) return;

    console.log('📁 Processing document file:', file.name, `(${(file.size / 1024 / 1024).toFixed(2)} MB)`);

    try {
      // Validate file
      validatePDFFile(file);
      
      // Update state for processing
      dispatch(setSelectedFile(file));
      dispatch(setIsParsing(true));
      dispatch(setError(null));
      dispatch(clearMessages()); // Clear previous chat history

      // Check if it's a PDF - use client-side processing for PDFs, backend for others
      const isPDF = file.type === 'application/pdf';
      const startTime = Date.now();
      let extractedText;

      if (isPDF) {
        // Use client-side PDF.js for PDF files
        extractedText = await extractTextFromPDF(file);
      } else {
        // Use backend API for all other formats (Word, Excel, Images, etc.)
        const { uploadDocument } = await import('../services/apiService.js');
        const result = await uploadDocument(file);
        extractedText = result?.text || '';
        
        console.log('📊 Document metadata:', result?.metadata);
      }

      const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);
      
      // Validate extracted text
      if (!extractedText || typeof extractedText !== 'string') {
        throw new Error('Failed to extract text from document. The file might be empty or corrupted.');
      }
      
      console.log(`✅ Document processed in ${processingTime}s - ${extractedText.length} characters extracted`);
      
      // Update state with extracted content
      dispatch(setContent(extractedText));
      dispatch(setIsParsing(false));
      
    } catch (error) {
      console.error('❌ Document processing error:', error);
      
      // Handle error state
      dispatch(setError(error.message));
      dispatch(setIsParsing(false));
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // User-friendly error notification
      alert(`Document Processing Error: ${error.message}`);
    }
  }, [dispatch]);

  /**
   * Handles preview toggle
   */
  const handleTogglePreview = useCallback(() => {
    dispatch(togglePreview());
  }, [dispatch]);

  /**
   * Handles file input click (for custom styling)
   */
  const handleFileInputClick = useCallback(() => {
    if (canUpload) {
      fileInputRef.current?.click();
    }
  }, [canUpload]);

  return (
    <aside style={styles.sidebar} role="complementary" aria-label="Document management">
      {/* Section Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>
          <span role="img" aria-label="Folder icon">📁</span>
          Document Manager
        </h2>
        <p style={styles.subtitle}>
          Upload any document to start analyzing
        </p>
      </div>
      
      {/* File Upload Section */}
      <div style={styles.uploadSection}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.webp,.txt,.md,.html,.rtf,.odt,.ods"
          onChange={handleFileChange}
          disabled={!canUpload}
          style={styles.hiddenInput}
          aria-label="Document file upload"
        />
        
        <button
          onClick={handleFileInputClick}
          disabled={!canUpload}
          style={{
            ...styles.uploadButton,
            opacity: canUpload ? 1 : 0.6,
            cursor: canUpload ? 'pointer' : 'not-allowed',
          }}
          aria-label="Choose document file to upload"
        >
          <span style={styles.uploadIcon}>📎</span>
          {isParsing ? 'Processing...' : 'Choose Document'}
        </button>
        
        {/* File format help */}
        <p style={styles.helpText}>
          Supports PDF, Word, Excel, Images, and more (up to 50MB)
        </p>
      </div>

      {/* File Status Display */}
      <FileStatus 
        isParsing={isParsing} 
        selectedFile={selectedFile} 
        content={content} 
      />

      {/* Error Display */}
      {error && (
        <div style={styles.errorCard}>
          <span style={styles.errorIcon}>❌</span>
          <p style={styles.errorText}>{error}</p>
        </div>
      )}
      
      {/* Preview Section */}
      {hasDocument && (
        <div style={styles.previewSection}>
          <button
            onClick={handleTogglePreview}
            style={styles.previewButton}
            aria-expanded={showPreview}
            aria-label={showPreview ? 'Hide document preview' : 'Show document preview'}
          >
            <span style={styles.previewIcon}>
              {showPreview ? '🙈' : '👁️'}
            </span>
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
          
          {/* PDF Preview Component */}
          {showPreview && (
            <div style={styles.previewContainer}>
              <PDFPreview content={content} />
            </div>
          )}
        </div>
      )}
    </aside>
  );
};

// Optimized styles object
const styles = {
  sidebar: {
    width: '320px',
    backgroundColor: '#f8f9fa',
    borderRight: '1px solid #e1e5e9',
    padding: '24px 20px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  header: {
    borderBottom: '1px solid #e1e5e9',
    paddingBottom: '16px',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a202c',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  subtitle: {
    margin: '6px 0 0 0',
    fontSize: '13px',
    color: '#6b7280',
    lineHeight: '1.4',
  },
  uploadSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  hiddenInput: {
    display: 'none',
  },
  uploadButton: {
    padding: '14px 16px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
  },
  uploadIcon: {
    fontSize: '16px',
  },
  helpText: {
    margin: 0,
    fontSize: '12px',
    color: '#9ca3af',
    textAlign: 'center',
  },
  statusCard: {
    padding: '16px',
    backgroundColor: '#fff3cd',
    borderRadius: '8px',
    border: '1px solid #ffeaa7',
  },
  processingStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  loadingIcon: {
    fontSize: '16px',
  },
  processingText: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#856404',
  },
  progressBar: {
    height: '4px',
    backgroundColor: '#fff',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007bff',
    borderRadius: '2px',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  successCard: {
    padding: '16px',
    backgroundColor: '#d1ecf1',
    borderRadius: '8px',
    border: '1px solid #bee5eb',
  },
  fileInfo: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  successIcon: {
    fontSize: '16px',
    marginTop: '2px',
  },
  fileDetails: {
    flex: 1,
    minWidth: 0,
  },
  fileName: {
    margin: '0 0 6px 0',
    fontSize: '14px',
    fontWeight: '500',
    color: '#155724',
    wordBreak: 'break-word',
  },
  fileStats: {
    display: 'flex',
    gap: '6px',
    fontSize: '12px',
    color: '#6c757d',
    flexWrap: 'wrap',
  },
  errorCard: {
    padding: '16px',
    backgroundColor: '#f8d7da',
    borderRadius: '8px',
    border: '1px solid #f5c6cb',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  errorIcon: {
    fontSize: '16px',
    marginTop: '2px',
  },
  errorText: {
    margin: 0,
    fontSize: '14px',
    color: '#721c24',
    lineHeight: '1.4',
  },
  previewSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  previewButton: {
    padding: '12px 16px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    color: '#495057',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
  },
  previewIcon: {
    fontSize: '14px',
  },
  previewContainer: {
    backgroundColor: '#fff',
    borderRadius: '6px',
    border: '1px solid #dee2e6',
    overflow: 'hidden',
  },
};

// Set display names for debugging
FileStatus.displayName = 'FileStatus';
Sidebar.displayName = 'Sidebar';

export default Sidebar;
