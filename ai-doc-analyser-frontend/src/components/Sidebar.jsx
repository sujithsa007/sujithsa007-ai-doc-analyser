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
import { setSelectedFile, setContent, setIsParsing, setError, addDocument } from '../store/slices/pdfSlice';
import { togglePreview } from '../store/slices/uiSlice';
import { clearMessages } from '../store/slices/chatSlice';
import { extractTextFromPDF, validatePDFFile } from '../services/pdfService';
import { FILE_SIZE, FILE_TYPES } from '../constants';
import queryCache from '../services/queryCache';

// Lazy load heavy components to improve initial load time
const PDFPreview = React.lazy(() => import('./PDFPreview'));
const DocumentList = React.lazy(() => import('./DocumentList'));
const DocumentDashboard = React.lazy(() => import('./DocumentDashboard'));

/**
 * File Upload Status Component
 * Shows current processing status with visual feedback
 * Supports multi-file upload progress display
 */
const FileStatus = React.memo(({ isParsing, selectedFile, content, documents }) => {
  // Memoize calculations to avoid recalculating on every render
  const fileInfo = useMemo(() => {
    if (!selectedFile || !content) return null;
    
    return {
      fileSizeMB: (selectedFile.size / (1024 * 1024)).toFixed(2),
      wordCount: content.split(/\s+/).length,
      charCount: content.length,
    };
  }, [selectedFile, content]);

  if (isParsing) {
    return (
      <div style={styles.statusCard}>
        <div style={styles.processingStatus}>
          <span className="loading" style={styles.loadingIcon}>⏳</span>
          <span style={styles.processingText}>
            {documents.length > 0 
              ? `Processing documents... (${documents.length} uploaded)`
              : 'Processing document...'}
          </span>
        </div>
        <div style={styles.progressBar}>
          <div style={styles.progressFill} className="loading"></div>
        </div>
      </div>
    );
  }

  if (fileInfo) {
    return (
      <div style={styles.successCard}>
        <div style={styles.fileInfo}>
          <span style={styles.successIcon}>✅</span>
          <div style={styles.fileDetails}>
            <p style={styles.fileName}>{selectedFile.name}</p>
            <div style={styles.fileStats}>
              <span>{fileInfo.fileSizeMB} MB</span>
              <span>•</span>
              <span>{fileInfo.wordCount.toLocaleString()} words</span>
              <span>•</span>
              <span>{fileInfo.charCount.toLocaleString()} chars</span>
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
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.showDashboard - Whether to show the document dashboard
 * @param {Function} props.onToggleDashboard - Callback to toggle dashboard visibility
 */
const Sidebar = ({ showDashboard = false, onToggleDashboard }) => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  
  // Redux state selectors - memoized with shallow equal check
  const { content, selectedFile, isParsing, error, documents } = useSelector((state) => ({
    content: state.pdf.content,
    selectedFile: state.pdf.selectedFile,
    isParsing: state.pdf.isParsing,
    error: state.pdf.error,
    documents: state.pdf.documents,
  }));
  const showPreview = useSelector((state) => state.ui.showPreview);

  // Memoized computed values
  const hasDocument = useMemo(() => Boolean(content && selectedFile) || documents.length > 0, [content, selectedFile, documents.length]);
  const canUpload = useMemo(() => !isParsing, [isParsing]);

  /**
   * Handles document file upload and processing
   * Supports multiple file uploads - processes ALL files in parallel for speed
   * Validates files, uploads to backend, and updates Redux state
   */
  const handleFileChange = useCallback(async (event) => {
    const files = Array.from(event.target.files || []);
    
    if (!files || files.length === 0) return;

    if (process.env.NODE_ENV === 'development') console.debug(`📁 Processing ${files.length} document file(s) in parallel for maximum speed...`);

    // Update UI state immediately
    dispatch(setIsParsing(true));
    dispatch(setError(null));
    dispatch(clearMessages());
    
    // Clear query cache when new documents are uploaded
    queryCache.clear();
    if (process.env.NODE_ENV === 'development') console.debug('🗑️ Query cache cleared for new document upload');

    const startTime = Date.now();

    // Process ALL files in parallel using Promise.all
    const processingPromises = files.map(async (file, index) => {
      if (process.env.NODE_ENV === 'development') console.debug(`📄 Starting file ${index + 1}/${files.length}:`, file.name, `(${(file.size / 1024 / 1024).toFixed(2)} MB)`);

      try {
        // Validate file
        validatePDFFile(file);

        // Check if it's a PDF - use client-side processing for PDFs, backend for others
        const isPDF = file.type === FILE_TYPES.PDF;
        const fileStartTime = Date.now();
        let extractedText;

        if (isPDF) {
          // Use client-side PDF.js for PDF files (faster, no network call)
          extractedText = await extractTextFromPDF(file);
        } else {
          // Use backend API for all other formats (Word, Excel, Images, etc.)
          // Dynamic import to reduce initial bundle size
          const { uploadDocument } = await import('../services/apiService.js');
          
          if (process.env.NODE_ENV === 'development') console.debug(`📤 Uploading ${file.name} to backend (Type: ${file.type})...`);
          
          try {
            const result = await uploadDocument(file);
            extractedText = result?.text || result?.content || '';
            
            if (!extractedText) {
              console.warn(`⚠️ No text extracted from ${file.name}. Backend response:`, result);
              throw new Error(`No text content extracted from ${file.name}. The file may be empty or in an unsupported format.`);
            }
            
            if (process.env.NODE_ENV === 'development') console.debug('📊 Document metadata:', result?.metadata);
          } catch (uploadError) {
            console.error(`❌ Backend upload error for ${file.name}:`, uploadError);
            
            // Check if it's an authentication error
            if (uploadError.message?.includes('401') || uploadError.message?.toLowerCase().includes('unauthorized') || uploadError.message?.toLowerCase().includes('authentication')) {
              throw new Error(`Authentication required. Please log in to upload ${file.name}. (PDFs work without login because they're processed in your browser, but ${file.type.split('/')[0]} files require server processing.)`);
            }
            
            throw uploadError;
          }
        }

        const processingTime = ((Date.now() - fileStartTime) / 1000).toFixed(1);
        
        // Validate extracted text
        if (!extractedText || typeof extractedText !== 'string') {
          throw new Error(`Failed to extract text from ${file.name}. The file might be empty or corrupted.`);
        }
        
        if (process.env.NODE_ENV === 'development') console.debug(`✅ File ${index + 1}/${files.length} processed in ${processingTime}s - ${extractedText.length} characters extracted`);
        
        return {
          success: true,
          file,
          content: extractedText,
          index
        };
        
      } catch (error) {
        console.error(`❌ Error processing ${file.name}:`, error);
        return {
          success: false,
          file,
          error: error.message,
          index
        };
      }
    });

    // Wait for all files to be processed
    const results = await Promise.all(processingPromises);
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    if (process.env.NODE_ENV === 'development') console.debug(`\n⚡ All ${files.length} files processed in ${totalTime}s (parallel processing)`);

    // Batch Redux updates to minimize re-renders
    const updates = results.reduce((acc, result) => {
      if (result.success) {
        acc.successfulDocs.push({
          file: result.file,
          content: result.content,
          summary: null,
          tags: [],
        });
        acc.successCount++;
        // Keep last successful for legacy state
        acc.lastContent = result.content;
        acc.lastFile = result.file;
      } else {
        acc.errors.push(`Error in ${result.file.name}: ${result.error}`);
        acc.errorCount++;
      }
      return acc;
    }, { successfulDocs: [], errors: [], successCount: 0, errorCount: 0, lastContent: null, lastFile: null });

    // Batch dispatch for better performance
    updates.successfulDocs.forEach(doc => {
      dispatch(addDocument(doc));
    });

    // Update legacy state with last successful file
    if (updates.lastContent && updates.lastFile) {
      dispatch(setContent(updates.lastContent));
      dispatch(setSelectedFile(updates.lastFile));
    }

    // Show errors if any
    if (updates.errors.length > 0) {
      dispatch(setError(updates.errors.join('\n')));
    }

    // All files processed
    dispatch(setIsParsing(false));
    
    // Clear file input to allow re-uploading same files
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    if (process.env.NODE_ENV === 'development') console.debug(`✅ Upload complete: ${updates.successCount} successful, ${updates.errorCount} failed`);
    
    // Show multi-document notification if multiple files uploaded
    if (updates.successCount > 1) {
      if (process.env.NODE_ENV === 'development') console.debug(`💡 TIP: You uploaded ${updates.successCount} documents. Click the "🚀 Smart Analysis" button in the header to compare, merge, or analyze them together!`);
      // Optionally show a toast notification
      dispatch(setError(null)); // Clear any previous errors
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
          Upload multiple documents for cross-analysis
        </p>
      </div>
      
      {/* File Upload Section */}
      <div style={styles.uploadSection}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.webp,.txt,.md,.html,.rtf,.odt,.ods"
          onChange={handleFileChange}
          disabled={!canUpload}
          style={styles.hiddenInput}
          aria-label="Document file upload (multiple files supported)"
        />
        
        <button
          onClick={handleFileInputClick}
          disabled={!canUpload}
          style={{
            ...styles.uploadButton,
            opacity: canUpload ? 1 : 0.6,
            cursor: canUpload ? 'pointer' : 'not-allowed',
          }}
          aria-label="Choose document files to upload"
        >
          <span style={styles.uploadIcon}>📎</span>
          {isParsing ? 'Processing...' : 'Choose Documents'}
        </button>
        
        {/* File format help */}
        <p style={styles.helpText}>
          Supports PDF, Word, Excel, Images, and more (up to {FILE_SIZE.MAX_SIZE_MB}MB each)
        </p>
        <p style={styles.multiFileHint}>
          💡 Tip: Select multiple files to analyze together (Ctrl+Click or Cmd+Click)
        </p>
      </div>

      {/* File Status Display */}
      <FileStatus 
        isParsing={isParsing} 
        selectedFile={selectedFile} 
        content={content}
        documents={documents}
      />

      {/* Document List - Multi-document Support */}
      {documents.length > 0 && (
        <div style={styles.documentListSection}>
          <h3 style={styles.sectionTitle}>
            <span role="img" aria-label="Documents">📚</span>
            Uploaded Documents ({documents.length})
          </h3>
          <React.Suspense fallback={<div style={styles.loadingFallback}>Loading documents...</div>}>
            <DocumentList />
          </React.Suspense>
        </div>
      )}

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
              <React.Suspense fallback={<div style={styles.loadingFallback}>Loading preview...</div>}>
                <PDFPreview content={content} />
              </React.Suspense>
            </div>
          )}
        </div>
      )}

      {/* Document Dashboard Section */}
      {hasDocument && onToggleDashboard && (
        <div style={styles.dashboardSection}>
          <button
            onClick={onToggleDashboard}
            style={styles.dashboardButton}
            aria-expanded={showDashboard}
            aria-label={showDashboard ? 'Hide analytics dashboard' : 'Show analytics dashboard'}
          >
            <span style={styles.dashboardIcon}>
              {showDashboard ? '📊' : '📈'}
            </span>
            {showDashboard ? 'Hide Analytics' : 'Show Analytics'}
          </button>
          
          {/* Document Dashboard Component */}
          {showDashboard && (
            <div style={styles.dashboardContainer}>
              <React.Suspense fallback={<div style={styles.loadingFallback}>Loading dashboard...</div>}>
                <DocumentDashboard />
              </React.Suspense>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};

// Optimized styles object - moved outside component to prevent recreation
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
  multiFileHint: {
    margin: '6px 0 0 0',
    fontSize: '11px',
    color: '#007bff',
    textAlign: 'center',
    fontWeight: '500',
    fontStyle: 'italic',
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
  documentListSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '14px',
    fontWeight: '600',
    color: '#495057',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  dashboardSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  dashboardButton: {
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
  dashboardIcon: {
    fontSize: '14px',
  },
  dashboardContainer: {
    backgroundColor: '#fff',
    borderRadius: '6px',
    border: '1px solid #dee2e6',
    overflow: 'hidden',
  },
  loadingFallback: {
    padding: '20px',
    textAlign: 'center',
    fontSize: '13px',
    color: '#6c757d',
  },
};

// Set display names for debugging
FileStatus.displayName = 'FileStatus';
Sidebar.displayName = 'Sidebar';

export default Sidebar;
