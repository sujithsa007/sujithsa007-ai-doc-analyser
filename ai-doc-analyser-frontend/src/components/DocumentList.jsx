/**
 * DocumentList Component
 * Displays and manages multiple uploaded documents
 */

import { useSelector, useDispatch } from 'react-redux';
import { setActiveDocument, removeDocument, toggleDocumentForComparison, clearAllDocuments } from '../store/slices/pdfSlice';
import { clearMessages } from '../store/slices/chatSlice';
import queryCache from '../services/queryCache';
import './DocumentList.css';

const DocumentList = () => {
  const dispatch = useDispatch();
  const { documents, activeDocumentId, comparisonMode, selectedForComparison } = useSelector(
    (state) => state.pdf
  );

  const handleSelectDocument = (docId) => {
    dispatch(setActiveDocument(docId));
  };

  const handleRemoveDocument = (docId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to remove this document?')) {
      dispatch(removeDocument(docId));
    }
  };

  const handleToggleComparison = (docId, e) => {
    e.stopPropagation();
    dispatch(toggleDocumentForComparison(docId));
  };

  const handleDeleteAll = () => {
    if (window.confirm(`Are you sure you want to delete all ${documents.length} documents? This action cannot be undone.`)) {
      dispatch(clearAllDocuments());
      dispatch(clearMessages());
      queryCache.clear();
      console.log('🗑️ All documents deleted and cache cleared');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (documents.length === 0) {
    return (
      <div className="document-list-empty">
        <p>📄 No documents uploaded yet</p>
        <p className="document-list-hint">Upload a document to get started</p>
      </div>
    );
  }

  return (
    <div className="document-list">
      <div className="document-list-header">
        <h3>📚 Documents ({documents.length})</h3>
        <div className="document-list-actions">
          {documents.length > 1 && comparisonMode && (
            <span className="comparison-badge">
              Comparing {selectedForComparison.length} docs
            </span>
          )}
          {documents.length > 0 && (
            <button
              className="btn-delete-all"
              onClick={handleDeleteAll}
              title="Delete all documents"
            >
              🗑️ Delete All
            </button>
          )}
        </div>
      </div>

      <div className="document-list-items">
        {documents.map((doc) => {
          const isActive = doc.id === activeDocumentId;
          const isSelected = selectedForComparison.includes(doc.id);
          const fileName = doc.file?.name || doc.metadata?.fileName || 'Unknown';
          const fileSize = doc.file?.size || doc.metadata?.fileSize || 0;

          return (
            <div
              key={doc.id}
              className={`document-item ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''}`}
              onClick={() => handleSelectDocument(doc.id)}
            >
              <div className="document-icon">
                {getFileIcon(fileName)}
              </div>

              <div className="document-info">
                <div className="document-name" title={fileName}>
                  {fileName}
                </div>
                <div className="document-meta">
                  <span className="document-size">{formatFileSize(fileSize)}</span>
                  {doc.metadata?.wordCount && (
                    <span className="document-words">{doc.metadata.wordCount} words</span>
                  )}
                  {doc.metadata?.pageCount && (
                    <span className="document-pages">{doc.metadata.pageCount} pages</span>
                  )}
                </div>
                <div className="document-date">
                  {formatDate(doc.uploadedAt)}
                </div>
                {doc.summary && (
                  <div className="document-summary" title={doc.summary.summary}>
                    {doc.summary.summary.substring(0, 100)}...
                  </div>
                )}
              </div>

              <div className="document-actions">
                {comparisonMode && (
                  <button
                    className={`btn-icon ${isSelected ? 'selected' : ''}`}
                    onClick={(e) => handleToggleComparison(doc.id, e)}
                    title={isSelected ? 'Remove from comparison' : 'Add to comparison'}
                  >
                    {isSelected ? '☑️' : '⬜'}
                  </button>
                )}
                <button
                  className="btn-icon btn-remove"
                  onClick={(e) => handleRemoveDocument(doc.id, e)}
                  title="Remove document"
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const getFileIcon = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const iconMap = {
    pdf: '📕',
    doc: '📘',
    docx: '📘',
    xls: '📗',
    xlsx: '📗',
    csv: '📊',
    txt: '📝',
    md: '📋',
    jpg: '🖼️',
    jpeg: '🖼️',
    png: '🖼️',
    gif: '🖼️',
  };
  return iconMap[ext] || '📄';
};

export default DocumentList;
