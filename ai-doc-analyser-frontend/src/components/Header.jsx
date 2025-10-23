/**
 * Header Component
 * 
 * Displays the application title and description at the top of the interface.
 * Features:
 * - Clean, professional design
 * - Semantic HTML structure
 * - Responsive styling
 * - Accessibility optimized
 */

import React from 'react';

/**
 * Header component for the PDF Chat Assistant
 * 
 * Renders the main application header with title and description.
 * Uses semantic HTML elements for better accessibility and SEO.
 * 
 * @returns {JSX.Element} Application header
 */
const Header = React.memo(() => {
  return (
    <header style={styles.header} role="banner">
      <div style={styles.container}>
        <h1 style={styles.title}>
          <span role="img" aria-label="Document icon">📄</span>
          {' '}
          AI Doc Analyser
        </h1>
        <p style={styles.subtitle}>
          Upload any document (PDF, Word, Excel, Images, etc.) and ask questions using AI
        </p>
      </div>
    </header>
  );
});

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
};

// Set display name for debugging
Header.displayName = 'Header';

export default Header;
