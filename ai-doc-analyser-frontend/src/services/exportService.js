/**
 * Export Service
 * 
 * Handles multi-format file export (Excel, Word, PDF, PowerPoint, CSV, JSON) from AI responses
 */

import { apiClient } from './apiService';

/**
 * Detect export format from AI response
 * @param {string} aiResponseText - AI response content
 * @returns {string} Detected format or 'excel' as default
 */
export const detectExportFormat = (aiResponseText) => {
  const text = aiResponseText.toLowerCase();
  
  if (text.includes('word') || text.includes('.docx') || text.includes('word document')) return 'word';
  if (text.includes('pdf') || text.includes('.pdf')) return 'pdf';
  if (text.includes('powerpoint') || text.includes('.pptx') || text.includes('presentation')) return 'powerpoint';
  if (text.includes('csv') || text.includes('.csv') || text.includes('comma separated')) return 'csv';
  if (text.includes('json') || text.includes('.json')) return 'json';
  if (text.includes('excel') || text.includes('.xlsx') || text.includes('spreadsheet')) return 'excel';
  
  // Default to excel for merged data
  return 'excel';
};

/**
 * Extract merged data from AI response text
 * Looks for JSON blocks containing mergedRecords
 * 
 * @param {string} aiResponseText - AI response content
 * @returns {Object|null} Extracted merged data or null
 */
export const extractMergedDataFromResponse = (aiResponseText) => {
  try {
    console.log('🔍 Extracting merged data from AI response...');
    
    // Look for JSON blocks in the response (```json ... ```)
    const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/g;
    const matches = [...aiResponseText.matchAll(jsonBlockRegex)];
    
    for (const match of matches) {
      try {
        const jsonData = JSON.parse(match[1]);
        if (jsonData.mergedRecords && Array.isArray(jsonData.mergedRecords)) {
          console.log('✅ Found merged data in code block:', {
            records: jsonData.mergedRecords.length,
            keyField: jsonData.keyField
          });
          return jsonData;
        }
      } catch (e) {
        console.warn('Failed to parse JSON block:', e.message);
        continue;
      }
    }
    
    // Try to find JSON object without code blocks - use a more robust approach
    // Find the position of "mergedRecords" and extract the full object
    const mergedRecordsIndex = aiResponseText.indexOf('"mergedRecords"');
    if (mergedRecordsIndex !== -1) {
      // Search backwards to find the opening brace
      let openBraceIndex = aiResponseText.lastIndexOf('{', mergedRecordsIndex);
      
      if (openBraceIndex !== -1) {
        // Search forwards to find the matching closing brace
        let braceCount = 1;
        let closeBraceIndex = openBraceIndex + 1;
        
        while (closeBraceIndex < aiResponseText.length && braceCount > 0) {
          if (aiResponseText[closeBraceIndex] === '{') braceCount++;
          if (aiResponseText[closeBraceIndex] === '}') braceCount--;
          closeBraceIndex++;
        }
        
        if (braceCount === 0) {
          const jsonStr = aiResponseText.substring(openBraceIndex, closeBraceIndex);
          try {
            const jsonData = JSON.parse(jsonStr);
            if (jsonData.mergedRecords && Array.isArray(jsonData.mergedRecords)) {
              console.log('✅ Found merged data in plain JSON:', {
                records: jsonData.mergedRecords.length,
                keyField: jsonData.keyField
              });
              return jsonData;
            }
          } catch (e) {
            console.warn('Failed to parse extracted JSON:', e.message);
          }
        }
      }
    }
    
    console.warn('⚠️ No merged data found in response');
    return null;
  } catch (error) {
    console.error('❌ Error extracting merged data:', error);
    return null;
  }
};

/**
 * Check if AI response contains merged/combined Excel data
 * 
 * @param {string} aiResponseText - AI response content
 * @returns {boolean} True if response contains exportable data
 */
export const hasMergedData = (aiResponseText) => {
  if (!aiResponseText) return false;
  
  // Check for keywords indicating merged data
  const keywords = [
    'mergedRecords',
    'merged data',
    'combined data',
    'consolidat',
    'merge',
    'keyField'
  ];
  
  const lowerText = aiResponseText.toLowerCase();
  const hasKeywords = keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
  
  // Check for JSON structure
  const hasJsonStructure = aiResponseText.includes('{') && 
                           aiResponseText.includes('mergedRecords');
  
  return hasKeywords && hasJsonStructure;
};

/**
 * Download file in specified format from data
 * 
 * @param {Object} data - Data object to export
 * @param {string} format - Export format (excel, word, pdf, powerpoint, csv, json)
 * @param {string} filename - Optional filename
 * @param {Object} options - Format-specific options
 * @returns {Promise<void>}
 */
export const downloadFile = async (data, format = 'excel', filename = null, options = {}) => {
  try {
    console.log(`📊 Requesting ${format.toUpperCase()} export...`);
    console.log('📋 Data:', data);
    
    // Validate data structure
    if (!data) {
      throw new Error('Data is required for export');
    }
    
    const formatLower = format.toLowerCase();
    
    // Set default options based on format
    const defaultOptions = {
      title: options.title || 'Exported Data',
      ...options
    };
    
    const response = await apiClient.post(
      '/analyze/export',
      { data, format: formatLower, filename, options: defaultOptions },
      {
        responseType: 'blob', // Important for binary data
      }
    );
    
    // Extract filename from Content-Disposition header if available
    const contentDisposition = response.headers['content-disposition'];
    let downloadFilename = filename || `export-data.${getExtension(formatLower)}`;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (filenameMatch && filenameMatch[1]) {
        downloadFilename = filenameMatch[1];
      }
    }
    
    // Get MIME type for format
    const mimeType = getMimeType(formatLower);
    
    // Create blob from response
    const blob = new Blob([response.data], { type: mimeType });
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = downloadFilename;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    console.log(`✅ ${formatLower.toUpperCase()} file downloaded: ${downloadFilename}`);
    
  } catch (error) {
    console.error(`❌ ${format.toUpperCase()} download failed:`, error);
    
    if (error.response?.data) {
      // Try to read error message from blob
      try {
        const text = await error.response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.error || `Failed to download ${format} file`);
      } catch (e) {
        throw new Error(`Failed to download ${format} file`);
      }
    }
    
    throw error;
  }
};

/**
 * Get file extension for format
 */
const getExtension = (format) => {
  const extensions = {
    excel: 'xlsx',
    word: 'docx',
    pdf: 'pdf',
    powerpoint: 'pptx',
    csv: 'csv',
    json: 'json',
    xlsx: 'xlsx',
    docx: 'docx',
    pptx: 'pptx'
  };
  return extensions[format] || 'xlsx';
};

/**
 * Get MIME type for format
 */
const getMimeType = (format) => {
  const mimeTypes = {
    excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    word: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    pdf: 'application/pdf',
    powerpoint: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    csv: 'text/csv',
    json: 'application/json'
  };
  return mimeTypes[format] || 'application/octet-stream';
};

/**
 * Download Excel file from merged data (backward compatibility)
 * 
 * @param {Object} mergedData - Merged data object with mergedRecords
 * @param {string} filename - Optional filename
 * @returns {Promise<void>}
 */
export const downloadMergedExcel = async (mergedData, filename = null) => {
  // Validate merged data structure
  if (!mergedData || !mergedData.mergedRecords) {
    throw new Error('Invalid merged data structure - missing mergedRecords');
  }
  
  if (!Array.isArray(mergedData.mergedRecords) || mergedData.mergedRecords.length === 0) {
    throw new Error('No records to export - mergedRecords is empty');
  }
  
  return downloadFile(mergedData, 'excel', filename);
};

/**
 * Download file from AI response text with auto-format detection
 * Extracts merged data and triggers download in requested format
 * 
 * @param {string} aiResponseText - AI response containing merged data
 * @param {string} filename - Optional filename
 * @param {string} format - Optional format override (auto-detects if not provided)
 * @returns {Promise<boolean>} True if download succeeded
 */
export const downloadFromResponse = async (aiResponseText, filename = null, format = null) => {
  try {
    console.log('🚀 Starting download process...');
    console.log('📄 AI Response length:', aiResponseText.length, 'characters');
    console.log('📄 AI Response preview (first 500 chars):', aiResponseText.substring(0, 500));
    
    // Auto-detect format if not provided
    const detectedFormat = format || detectExportFormat(aiResponseText);
    console.log(`📋 Export format: ${detectedFormat.toUpperCase()}`);
    
    const mergedData = extractMergedDataFromResponse(aiResponseText);
    
    if (!mergedData) {
      console.error('❌ No merged data extracted from response');
      throw new Error('No data found in response to export');
    }
    
    console.log('✅ Data extracted successfully, proceeding to download...');
    
    // Extract title from response if available
    const titleMatch = aiResponseText.match(/(?:title|heading):\s*["']?([^"'\n]+)["']?/i);
    const title = titleMatch ? titleMatch[1] : 'Exported Data';
    
    await downloadFile(mergedData, detectedFormat, filename, { title });
    return true;
    
  } catch (error) {
    console.error(`❌ Failed to download file from response:`, error);
    throw error;
  }
};

/**
 * Download Excel from AI response text (backward compatibility)
 * @deprecated Use downloadFromResponse instead
 */
export const downloadExcelFromResponse = async (aiResponseText, filename = null) => {
  return downloadFromResponse(aiResponseText, filename, 'excel');
};

export default {
  extractMergedDataFromResponse,
  hasMergedData,
  downloadMergedExcel,
  downloadExcelFromResponse,
};
