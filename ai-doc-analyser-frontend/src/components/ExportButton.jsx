/**
 * ExportButton Component
 * Handles exporting conversations to various formats
 */

import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addExport } from '../store/slices/analysisSlice';
import {
  exportToMarkdown,
  exportToHTML,
  exportToText,
  exportToPDF,
  downloadFile,
} from '../services/exportService';
import './ExportButton.css';

const ExportButton = () => {
  const dispatch = useDispatch();
  const { messages, conversationStarted } = useSelector((state) => state.chat);
  const { selectedFile, content, activeDocumentId, documents } = useSelector((state) => state.pdf);
  const [showMenu, setShowMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const activeDocument = documents.find(d => d.id === activeDocumentId);
  const documentName = selectedFile?.name || activeDocument?.file?.name || 'document';
  const metadata = {
    documentName,
    conversationStarted,
    documentMetadata: {
      wordCount: content ? content.split(/\s+/).length : 0,
      size: selectedFile?.size || 0,
    },
  };

  const handleExport = async (format) => {
    if (messages.length === 0) {
      alert('No conversation to export. Please ask some questions first.');
      return;
    }

    setIsExporting(true);
    setShowMenu(false);

    try {
      let filename, content, mimeType;

      switch (format) {
        case 'markdown':
          content = exportToMarkdown(messages, metadata);
          filename = `${documentName}-analysis.md`;
          mimeType = 'text/markdown';
          downloadFile(content, filename, mimeType);
          break;

        case 'html':
          content = exportToHTML(messages, metadata);
          filename = `${documentName}-analysis.html`;
          mimeType = 'text/html';
          downloadFile(content, filename, mimeType);
          break;

        case 'text':
          content = exportToText(messages, metadata);
          filename = `${documentName}-analysis.txt`;
          mimeType = 'text/plain';
          downloadFile(content, filename, mimeType);
          break;

        case 'pdf':
          await exportToPDF(messages, metadata);
          filename = `${documentName}-analysis.pdf`;
          break;

        default:
          throw new Error('Unsupported export format');
      }

      // Track export in state
      dispatch(
        addExport({
          type: format,
          filename,
          documentName,
          messageCount: messages.length,
        })
      );

      console.log(`✅ Exported conversation as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('❌ Export failed:', error);
      alert(`Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="export-button-container">
      <button
        className="export-button"
        onClick={() => setShowMenu(!showMenu)}
        disabled={messages.length === 0 || isExporting}
        title="Export conversation"
      >
        {isExporting ? '⏳' : '📥'} Export
      </button>

      {showMenu && (
        <>
          <div className="export-backdrop" onClick={() => setShowMenu(false)} />
          <div className="export-menu">
            <div className="export-menu-header">
              <h4>Export Conversation</h4>
              <p>{messages.length} messages</p>
            </div>

            <div className="export-options">
              <button
                className="export-option"
                onClick={() => handleExport('markdown')}
              >
                <span className="export-icon">📝</span>
                <div className="export-info">
                  <strong>Markdown</strong>
                  <span>Plain text with formatting</span>
                </div>
              </button>

              <button
                className="export-option"
                onClick={() => handleExport('html')}
              >
                <span className="export-icon">🌐</span>
                <div className="export-info">
                  <strong>HTML</strong>
                  <span>Styled web page</span>
                </div>
              </button>

              <button
                className="export-option"
                onClick={() => handleExport('text')}
              >
                <span className="export-icon">📄</span>
                <div className="export-info">
                  <strong>Plain Text</strong>
                  <span>Simple text file</span>
                </div>
              </button>

              <button
                className="export-option"
                onClick={() => handleExport('pdf')}
              >
                <span className="export-icon">📕</span>
                <div className="export-info">
                  <strong>PDF</strong>
                  <span>Print-ready document</span>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ExportButton;
