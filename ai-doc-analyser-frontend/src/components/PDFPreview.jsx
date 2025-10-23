import React from 'react';

const PDFPreview = ({ content }) => {
  if (!content) return null;

  return (
    <div style={{
      marginTop: '15px',
      padding: '10px',
      backgroundColor: '#f8f9fa',
      border: '1px solid #e5e5e5',
      borderRadius: '5px',
      maxHeight: '300px',
      overflowY: 'auto',
      fontSize: '11px',
      lineHeight: '1.6',
      fontFamily: 'monospace',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word'
    }}>
      {content}
    </div>
  );
};

export default PDFPreview;
