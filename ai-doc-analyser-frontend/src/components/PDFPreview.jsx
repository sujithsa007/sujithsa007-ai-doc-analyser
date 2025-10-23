import React, { useMemo } from 'react';

/**
 * PDFPreview Component
 * Enhancements to satisfy test expectations:
 * - Renders an empty state message when no content provided.
 * - Truncates very long content (>1500 chars) and appends ellipsis.
 * - Ensures styling matches tests (padding 16px, background #fafafa).
 * - Preserves line breaks with whiteSpace: pre-wrap.
 */
const MAX_LENGTH = 1500;

const PDFPreview = ({ content }) => {
  const hasContent = Boolean(content && content.length);

  const displayContent = useMemo(() => {
    if (!hasContent) return 'No content to preview';
    if (content.length > MAX_LENGTH) {
      return content.slice(0, MAX_LENGTH) + '...';
    }
    return content;
  }, [content, hasContent]);

  return (
    <div
      style={{
        marginTop: '15px',
        padding: '16px',
        backgroundColor: '#fafafa',
        border: '1px solid #e5e5e5',
        borderRadius: '5px',
        maxHeight: '300px',
        overflowY: 'auto',
        fontSize: '11px',
        lineHeight: '1.6',
        fontFamily: 'monospace',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word'
      }}
      aria-label="PDF content preview"
    >
      {displayContent}
    </div>
  );
};

export default PDFPreview;
