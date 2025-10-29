/**
 * Export Service
 * Handles exporting chat conversations and analysis to various formats
 */

/**
 * Export conversation to Markdown format
 * @param {Array<Object>} messages - Chat messages
 * @param {Object} metadata - Document and conversation metadata
 * @returns {string} Markdown content
 */
export const exportToMarkdown = (messages, metadata = {}) => {
  const {
    documentName = 'Document',
    conversationStarted = new Date().toISOString(),
    documentMetadata = {},
  } = metadata;
  
  let markdown = `# AI Document Analysis Report\n\n`;
  markdown += `**Document:** ${documentName}\n`;
  markdown += `**Analysis Date:** ${new Date(conversationStarted).toLocaleString()}\n`;
  
  if (documentMetadata.wordCount) {
    markdown += `**Word Count:** ${documentMetadata.wordCount}\n`;
  }
  if (documentMetadata.pageCount) {
    markdown += `**Pages:** ${documentMetadata.pageCount}\n`;
  }
  
  markdown += `\n---\n\n`;
  markdown += `## Conversation\n\n`;
  
  messages.forEach((msg, index) => {
    const timestamp = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : '';
    
    if (msg.type === 'user') {
      markdown += `### Question ${index + 1} ${timestamp ? `(${timestamp})` : ''}\n\n`;
      markdown += `${msg.content}\n\n`;
    } else {
      markdown += `**AI Response:**\n\n`;
      markdown += `${msg.content}\n\n`;
      markdown += `---\n\n`;
    }
  });
  
  markdown += `\n## Summary\n\n`;
  markdown += `- Total questions asked: ${messages.filter(m => m.type === 'user').length}\n`;
  markdown += `- Total responses: ${messages.filter(m => m.type === 'ai' || m.type === 'assistant').length}\n`;
  markdown += `- Generated: ${new Date().toLocaleString()}\n`;
  
  return markdown;
};

/**
 * Export conversation to HTML format
 * @param {Array<Object>} messages - Chat messages
 * @param {Object} metadata - Document and conversation metadata
 * @returns {string} HTML content
 */
export const exportToHTML = (messages, metadata = {}) => {
  const {
    documentName = 'Document',
    conversationStarted = new Date().toISOString(),
    documentMetadata = {},
  } = metadata;
  
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Document Analysis - ${documentName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      color: #2563eb;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 10px;
    }
    .metadata {
      background: #f0f9ff;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
      border-left: 4px solid #2563eb;
    }
    .metadata p {
      margin: 5px 0;
      font-size: 14px;
    }
    .conversation {
      margin-top: 30px;
    }
    .message {
      margin: 25px 0;
      padding: 20px;
      border-radius: 8px;
    }
    .question {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
    }
    .answer {
      background: #f0fdf4;
      border-left: 4px solid #22c55e;
    }
    .message-header {
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 10px;
      font-size: 16px;
    }
    .message-content {
      color: #1f2937;
      white-space: pre-wrap;
      line-height: 1.8;
    }
    .timestamp {
      color: #6b7280;
      font-size: 12px;
      margin-top: 10px;
    }
    .summary {
      background: #fef3c7;
      padding: 20px;
      border-radius: 8px;
      margin-top: 30px;
      border-left: 4px solid #f59e0b;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📄 AI Document Analysis Report</h1>
    
    <div class="metadata">
      <p><strong>Document:</strong> ${documentName}</p>
      <p><strong>Analysis Date:</strong> ${new Date(conversationStarted).toLocaleString()}</p>
      ${documentMetadata.wordCount ? `<p><strong>Word Count:</strong> ${documentMetadata.wordCount}</p>` : ''}
      ${documentMetadata.pageCount ? `<p><strong>Pages:</strong> ${documentMetadata.pageCount}</p>` : ''}
    </div>
    
    <div class="conversation">
      <h2>Conversation</h2>
`;
  
  let questionNumber = 0;
  messages.forEach((msg) => {
    const timestamp = msg.timestamp ? new Date(msg.timestamp).toLocaleString() : '';
    
    if (msg.type === 'user') {
      questionNumber++;
      html += `
      <div class="message question">
        <div class="message-header">❓ Question ${questionNumber}</div>
        <div class="message-content">${escapeHtml(msg.content)}</div>
        ${timestamp ? `<div class="timestamp">${timestamp}</div>` : ''}
      </div>
`;
    } else {
      html += `
      <div class="message answer">
        <div class="message-header">🤖 AI Response</div>
        <div class="message-content">${escapeHtml(msg.content)}</div>
        ${timestamp ? `<div class="timestamp">${timestamp}</div>` : ''}
      </div>
`;
    }
  });
  
  html += `
    </div>
    
    <div class="summary">
      <h3>Summary</h3>
      <ul>
        <li>Total questions asked: ${messages.filter(m => m.type === 'user').length}</li>
        <li>Total responses: ${messages.filter(m => m.type === 'ai' || m.type === 'assistant').length}</li>
        <li>Generated: ${new Date().toLocaleString()}</li>
      </ul>
    </div>
    
    <div class="footer">
      <p>Generated by AI Document Analyser</p>
    </div>
  </div>
</body>
</html>`;
  
  return html;
};

/**
 * Export conversation to plain text format
 * @param {Array<Object>} messages - Chat messages
 * @param {Object} metadata - Document and conversation metadata
 * @returns {string} Plain text content
 */
export const exportToText = (messages, metadata = {}) => {
  const {
    documentName = 'Document',
    conversationStarted = new Date().toISOString(),
    documentMetadata = {},
  } = metadata;
  
  let text = `AI DOCUMENT ANALYSIS REPORT\n`;
  text += `${'='.repeat(50)}\n\n`;
  text += `Document: ${documentName}\n`;
  text += `Analysis Date: ${new Date(conversationStarted).toLocaleString()}\n`;
  
  if (documentMetadata.wordCount) {
    text += `Word Count: ${documentMetadata.wordCount}\n`;
  }
  if (documentMetadata.pageCount) {
    text += `Pages: ${documentMetadata.pageCount}\n`;
  }
  
  text += `\n${'='.repeat(50)}\n`;
  text += `CONVERSATION\n`;
  text += `${'='.repeat(50)}\n\n`;
  
  let questionNumber = 0;
  messages.forEach((msg) => {
    const timestamp = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : '';
    
    if (msg.type === 'user') {
      questionNumber++;
      text += `QUESTION ${questionNumber} ${timestamp ? `(${timestamp})` : ''}\n`;
      text += `${'-'.repeat(40)}\n`;
      text += `${msg.content}\n\n`;
    } else {
      text += `AI RESPONSE:\n`;
      text += `${'-'.repeat(40)}\n`;
      text += `${msg.content}\n\n`;
      text += `${'-'.repeat(40)}\n\n`;
    }
  });
  
  text += `\n${'='.repeat(50)}\n`;
  text += `SUMMARY\n`;
  text += `${'='.repeat(50)}\n`;
  text += `Total questions asked: ${messages.filter(m => m.type === 'user').length}\n`;
  text += `Total responses: ${messages.filter(m => m.type === 'ai' || m.type === 'assistant').length}\n`;
  text += `Generated: ${new Date().toLocaleString()}\n`;
  
  return text;
};

/**
 * Download content as file
 * @param {string} content - File content
 * @param {string} filename - Desired filename
 * @param {string} mimeType - MIME type
 */
export const downloadFile = (content, filename, mimeType = 'text/plain') => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export to PDF (requires external library or service)
 * For now, we'll export as HTML and suggest browser print-to-PDF
 * @param {Array<Object>} messages - Chat messages
 * @param {Object} metadata - Document and conversation metadata
 */
export const exportToPDF = async (messages, metadata = {}) => {
  const htmlContent = exportToHTML(messages, metadata);
  
  // Open in new window with print dialog
  const printWindow = window.open('', '_blank');
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // Trigger print dialog after content loads
  printWindow.onload = () => {
    printWindow.print();
  };
  
  return true;
};

/**
 * Export conversation summary with statistics
 * @param {Array<Object>} messages - Chat messages
 * @param {Object} documentInfo - Document information
 * @param {Object} insights - Document insights
 * @returns {Object} Structured export data
 */
export const exportAnalysisReport = (messages, documentInfo = {}, insights = {}) => {
  const questions = messages.filter(m => m.type === 'user');
  const answers = messages.filter(m => m.type === 'ai' || m.type === 'assistant');
  
  return {
    metadata: {
      documentName: documentInfo.name || 'Unknown',
      documentSize: documentInfo.size || 0,
      analysisDate: new Date().toISOString(),
      totalQuestions: questions.length,
      totalAnswers: answers.length,
    },
    document: documentInfo,
    insights: insights,
    conversation: messages.map(msg => ({
      type: msg.type,
      content: msg.content,
      timestamp: msg.timestamp,
    })),
    summary: {
      keyTopics: insights.topics || [],
      sentiment: insights.sentiment || 'neutral',
      complexity: insights.complexity || 'medium',
    },
  };
};

/**
 * Escape HTML special characters
 */
const escapeHtml = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, m => map[m]);
};

export default {
  exportToMarkdown,
  exportToHTML,
  exportToText,
  exportToPDF,
  downloadFile,
  exportAnalysisReport,
};
