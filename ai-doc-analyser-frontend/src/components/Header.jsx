/**
 * Header Component
 * 
 * Displays the application title and description at the top of the interface.
 * Features:
 * - Clean, professional design
 * - Semantic HTML structure
 * - Responsive styling
 * - Accessibility optimized
 * - Export and template action buttons
 */

import React from 'react';
import { useSelector } from 'react-redux';
import ExportButton from './ExportButton';

/**
 * Header component for the PDF Chat Assistant
 * 
 * Renders the main application header with title and description.
 * Uses semantic HTML elements for better accessibility and SEO.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onOpenTemplates - Callback to open templates modal
 * @returns {JSX.Element} Application header
 */
const Header = ({ onOpenTemplates }) => {
  const { content, documents } = useSelector((state) => state.pdf);
  const hasDocument = Boolean(content) || (documents && documents.length > 0);

  return (
    <header style={styles.header} role="banner">
      <div style={styles.container}>
        <div style={styles.headerContent}>
          <div style={styles.titleSection}>
            <h1 style={styles.title}>
              <span role="img" aria-label="Document icon">📄</span>
              {' '}
              AI Doc Analyser
            </h1>
            <p style={styles.subtitle}>
              Upload any document (PDF, Word, Excel, Images, etc.) and ask questions using AI
            </p>
          </div>
          
          {/* Action buttons */}
          {hasDocument && (
            <div style={styles.actions}>
              <button
                onClick={onOpenTemplates}
                style={styles.templateButton}
                aria-label="Show analysis templates"
              >
                <span role="img" aria-label="Template">📋</span>
                Templates
              </button>
              <ExportButton />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

// Optimized inline styles object to prevent re-creation on each render
const styles = {
  header: {
    backgroundColor: '#fff',
    borderBottom: '1px solid #e5e5e5',
    padding: '16px 24px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    zIndex: 10, // Ensure header stays above other content
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
  },
  titleSection: {
    flex: 1,
  },
  title: {
    margin: 0,
    fontSize: '22px',
    fontWeight: '600',
    color: '#1a202c',
    lineHeight: '1.2',
  },
  subtitle: {
    margin: '6px 0 0 0',
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '1.4',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  templateButton: {
    padding: '8px 16px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#495057',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s ease',
  },
};

// Set display name for debugging
Header.displayName = 'Header';

export default Header;
