/**
 * Conversation Export Service
 * 
 * Handles exporting chat conversations to various formats (Markdown, HTML, Text, PDF)
 */

/**
 * Export conversation to Markdown format
 */
export const exportToMarkdown = (messages, metadata = {}) => {
  const timestamp = new Date().toLocaleString();
  const { documentName = 'document', conversationStarted } = metadata;

  let markdown = `# AI Document Analysis - ${documentName}\n\n`;
  markdown += `**Exported:** ${timestamp}\n`;
  if (conversationStarted) {
    markdown += `**Conversation Started:** ${new Date(conversationStarted).toLocaleString()}\n`;
  }
  markdown += `**Messages:** ${messages.length}\n\n`;
  markdown += `---\n\n`;

  messages.forEach((message, index) => {
    const role = message.role === 'user' ? '👤 User' : '🤖 AI Assistant';
    markdown += `## ${role}\n\n`;
    markdown += `${message.content}\n\n`;
    if (index < messages.length - 1) {
      markdown += `---\n\n`;
    }
  });

  return markdown;
};

/**
 * Export conversation to HTML format
 */
export const exportToHTML = (messages, metadata = {}) => {
  const timestamp = new Date().toLocaleString();
  const { documentName = 'document', conversationStarted } = metadata;

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Document Analysis - ${documentName}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 20px;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
        }
        .header {
            background: #fff;
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            margin: 0 0 20px 0;
            color: #1a73e8;
        }
        .metadata {
            color: #666;
            font-size: 14px;
        }
        .message {
            background: #fff;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .message.user {
            border-left: 4px solid #1a73e8;
        }
        .message.assistant {
            border-left: 4px solid #34a853;
        }
        .message-header {
            font-weight: bold;
            margin-bottom: 10px;
            color: #1a73e8;
        }
        .message.assistant .message-header {
            color: #34a853;
        }
        .message-content {
            white-space: pre-wrap;
            word-wrap: break-word;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🤖 AI Document Analysis - ${documentName}</h1>
        <div class="metadata">
            <p><strong>Exported:</strong> ${timestamp}</p>
            ${conversationStarted ? `<p><strong>Conversation Started:</strong> ${new Date(conversationStarted).toLocaleString()}</p>` : ''}
            <p><strong>Total Messages:</strong> ${messages.length}</p>
        </div>
    </div>
`;

  messages.forEach((message) => {
    const role = message.role === 'user' ? 'user' : 'assistant';
    const roleLabel = message.role === 'user' ? '👤 User' : '🤖 AI Assistant';
    
    html += `    <div class="message ${role}">
        <div class="message-header">${roleLabel}</div>
        <div class="message-content">${escapeHtml(message.content)}</div>
    </div>
`;
  });

  html += `</body>
</html>`;

  return html;
};

/**
 * Export conversation to plain text format
 */
export const exportToText = (messages, metadata = {}) => {
  const timestamp = new Date().toLocaleString();
  const { documentName = 'document', conversationStarted } = metadata;

  let text = `AI Document Analysis - ${documentName}\n`;
  text += `${'='.repeat(60)}\n\n`;
  text += `Exported: ${timestamp}\n`;
  if (conversationStarted) {
    text += `Conversation Started: ${new Date(conversationStarted).toLocaleString()}\n`;
  }
  text += `Messages: ${messages.length}\n\n`;
  text += `${'='.repeat(60)}\n\n`;

  messages.forEach((message, index) => {
    const role = message.role === 'user' ? 'USER' : 'AI ASSISTANT';
    text += `[${role}]\n`;
    text += `${message.content}\n\n`;
    if (index < messages.length - 1) {
      text += `${'-'.repeat(60)}\n\n`;
    }
  });

  return text;
};

/**
 * Export conversation to PDF format (using browser print)
 */
export const exportToPDF = async (messages, metadata = {}) => {
  // Create a temporary HTML document and trigger print dialog
  const htmlContent = exportToHTML(messages, metadata);
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Failed to open print window. Please allow pop-ups.');
  }
  
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // Wait for content to load
  await new Promise(resolve => {
    printWindow.onload = resolve;
    setTimeout(resolve, 500); // Fallback timeout
  });
  
  printWindow.print();
  
  // Close after print dialog (or delay)
  setTimeout(() => {
    printWindow.close();
  }, 100);
};

/**
 * Download text content as a file
 */
export const downloadFile = (content, filename, mimeType = 'text/plain') => {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Helper function to escape HTML characters
 */
const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

export default {
  exportToMarkdown,
  exportToHTML,
  exportToText,
  exportToPDF,
  downloadFile,
};
