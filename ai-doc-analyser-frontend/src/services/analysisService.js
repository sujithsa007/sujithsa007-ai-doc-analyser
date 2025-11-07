/**
 * Analysis Service
 * Advanced document analysis, summarization, and intelligence features
 */

import { apiClient } from './apiService';

/**
 * Generate automatic document summary
 * @param {string} content - Document content
 * @param {string} documentType - Type of document (pdf, docx, etc.)
 * @param {string} fileName - Name of the file
 * @returns {Promise<Object>} Summary with key points, entities, actions
 */
import { askQuestion } from './apiService';
import { 
  TEXT_ANALYSIS, 
  COMMON_WORDS, 
  SENTIMENT_KEYWORDS, 
  SENTIMENT_VALUES,
  DEFAULTS,
  VALIDATION 
} from '../constants';

/**
 * Document Analysis Service
 * Provides intelligent analysis capabilities for uploaded documents
 */

/**
 * Generate AI-powered summary for document
 */
export const generateSummary = async (content, documentType = DEFAULTS.DOCUMENT_TYPE, fileName = DEFAULTS.FILE_NAME) => {
  try {
    const response = await apiClient.post('/analyze/summary', {
      content,
      documentType,
      fileName,
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Summary generation failed:', error);
    
    // Fallback: Client-side basic summary
    return generateClientSideSummary(content);
  }
};

/**
 * Client-side fallback summary generation
 */
const generateClientSideSummary = (content) => {
  const words = content.split(/\s+/);
  const wordCount = words.length;
  const sentenceCount = content.split(/[.!?]+/).filter(s => s.trim()).length;
  const readingTime = Math.ceil(wordCount / TEXT_ANALYSIS.WORDS_PER_MINUTE);
  
  // Extract first few sentences as summary
  const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
  const summary = sentences.slice(0, 3).join(' ').substring(0, 500);
  
  return {
    summary,
    wordCount,
    sentenceCount,
    readingTime,
    keyPoints: [],
    entities: { people: [], organizations: [], locations: [] },
    actionItems: [],
    dates: [],
  };
};

/**
 * Compare multiple documents
 * @param {Array<Object>} documents - Array of {id, content, fileName}
 * @returns {Promise<Object>} Comparison results
 */
export const compareDocuments = async (documents) => {
  try {
    const response = await apiClient.post('/analyze/compare', {
      documents: documents.map(doc => ({
        content: doc.content,
        fileName: doc.fileName || doc.name || 'Untitled',
      })),
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Document comparison failed:', error);
    
    // Fallback: Basic client-side comparison
    return generateClientSideComparison(documents);
  }
};

/**
 * Client-side document comparison
 */
const generateClientSideComparison = (documents) => {
  const stats = documents.map(doc => ({
    id: doc.id,
    wordCount: doc.content.split(/\s+/).length,
    length: doc.content.length,
    uniqueWords: new Set(doc.content.toLowerCase().split(/\W+/)).size,
  }));
  
  // Find common words across all documents
  const allWords = documents.map(doc => 
    new Set(doc.content.toLowerCase().split(/\W+/).filter(w => w.length > VALIDATION.MIN_WORD_LENGTH_FOR_ANALYSIS))
  );
  
  const commonWords = allWords.reduce((common, words) => {
    if (common.size === 0) return words;
    return new Set([...common].filter(w => words.has(w)));
  }, new Set());
  
  return {
    documentCount: documents.length,
    statistics: stats,
    commonThemes: Array.from(commonWords).slice(0, 20),
    differences: [],
    similarity: 0,
  };
};

/**
 * Extract document insights (sentiment, topics, complexity)
 * @param {string} content - Document content
 * @param {string} fileName - Name of the file
 * @returns {Promise<Object>} Insights object
 */
export const extractInsights = async (content, fileName = DEFAULTS.FILE_NAME) => {
  try {
    const response = await apiClient.post('/analyze/insights', {
      content,
      fileName,
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Insights extraction failed:', error);
    
    // Fallback: Basic client-side insights
    return generateClientSideInsights(content);
  }
};

/**
 * Client-side insights generation
 */
const generateClientSideInsights = (content) => {
  const words = content.split(/\s+/);
  const sentences = content.split(/[.!?]+/).filter(s => s.trim());
  
  // Simple sentiment based on positive/negative words
  const positiveWords = SENTIMENT_KEYWORDS.POSITIVE;
  const negativeWords = SENTIMENT_KEYWORDS.NEGATIVE;
  
  const lowerContent = content.toLowerCase();
  const positiveCount = positiveWords.filter(w => lowerContent.includes(w)).length;
  const negativeCount = negativeWords.filter(w => lowerContent.includes(w)).length;
  
  let sentiment = SENTIMENT_VALUES.NEUTRAL;
  if (positiveCount > negativeCount + TEXT_ANALYSIS.SENTIMENT_THRESHOLD) sentiment = SENTIMENT_VALUES.POSITIVE;
  if (negativeCount > positiveCount + TEXT_ANALYSIS.SENTIMENT_THRESHOLD) sentiment = SENTIMENT_VALUES.NEGATIVE;
  
  // Calculate readability (Flesch Reading Ease approximation)
  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = TEXT_ANALYSIS.AVG_SYLLABLES_PER_WORD;
  const readability = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
  
  let readabilityLevel = 'Medium';
  if (readability > 70) readabilityLevel = 'Easy';
  if (readability < 50) readabilityLevel = 'Hard';
  
  return {
    sentiment,
    topics: [],
    complexity: readabilityLevel,
    readability: {
      score: Math.round(readability),
      level: readabilityLevel,
      avgWordsPerSentence: Math.round(avgWordsPerSentence),
    },
  };
};

/**
 * Perform semantic search within document(s)
 * @param {string} query - Search query
 * @param {string} content - Document content to search
 * @param {string} fileName - Name of the file
 * @returns {Promise<Array>} Search results
 */
export const semanticSearch = async (query, content, fileName = 'Untitled') => {
  try {
    const response = await apiClient.post('/analyze/search', {
      query,
      content,
      fileName,
    });
    
    return response.data.results || [];
  } catch (error) {
    console.error('❌ Semantic search failed:', error);
    
    // Fallback: Simple keyword search
    return performKeywordSearch(query, content);
  }
};

/**
 * Simple keyword search fallback
 */
const performKeywordSearch = (query, content) => {
  const queryLower = query.toLowerCase();
  const contentLower = content.toLowerCase();
  const results = [];
  
  let index = contentLower.indexOf(queryLower);
  let position = 0;
  
  while (index >= 0 && results.length < 5) {
    const start = Math.max(0, index - 100);
    const end = Math.min(content.length, index + query.length + 100);
    const snippet = content.substring(start, end);
    
    results.push({
      excerpt: snippet,
      relevanceScore: 0.8,
      context: 'Contains search keywords',
    });
    
    position = index + 1;
    index = contentLower.indexOf(queryLower, position);
  }
  
  return results;
};

/**
 * Run template-based analysis
 * @param {Array<string>} questions - Template questions
 * @param {string} content - Document content
 * @param {string} documentType - Type of document
 * @param {string} fileName - Name of the file
 * @returns {Promise<Array>} Answers for all questions
 */
export const runTemplateAnalysis = async (questions, content, documentType = 'Document', fileName = 'Untitled') => {
  try {
    const response = await apiClient.post('/analyze/template', {
      questions,
      content,
      documentType,
      fileName,
    });
    
    return response.data.results || [];
  } catch (error) {
    console.error('❌ Template analysis failed:', error);
    throw error;
  }
};

/**
 * Extract entities from document (people, organizations, locations, dates)
 * @param {string} content - Document content
 * @param {string} fileName - Name of the file
 * @returns {Promise<Object>} Extracted entities
 */
export const extractEntities = async (content, fileName = 'Untitled') => {
  try {
    const response = await apiClient.post('/analyze/entities', {
      content,
      fileName,
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Entity extraction failed:', error);
    
    // Fallback: Basic pattern matching
    return extractBasicEntities(content);
  }
};

/**
 * Basic entity extraction using regex patterns
 */
const extractBasicEntities = (content) => {
  // Simple date pattern
  const datePattern = /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b/gi;
  const dates = [...new Set(content.match(datePattern) || [])];
  
  // Simple money pattern
  const moneyPattern = /\$[\d,]+(?:\.\d{2})?/g;
  const money = [...new Set(content.match(moneyPattern) || [])];
  
  // Simple email pattern
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emails = [...new Set(content.match(emailPattern) || [])];
  
  return {
    dates,
    money,
    emails,
    people: [],
    organizations: [],
    locations: [],
  };
};

/**
 * Generate suggested follow-up questions based on conversation history
 * @param {Array<Object>} conversationHistory - Previous Q&A
 * @param {string} content - Document content
 * @param {string} fileName - Name of the file
 * @returns {Promise<Array<string>>} Suggested questions
 */
export const generateFollowUpQuestions = async (conversationHistory, content, fileName = 'Untitled') => {
  try {
    const response = await apiClient.post('/analyze/follow-ups', {
      conversationHistory,
      content,
      fileName,
    });
    
    return response.data.questions || [];
  } catch (error) {
    console.error('❌ Follow-up generation failed:', error);
    
    // Fallback: Generic follow-ups
    return [
      'Can you provide more details about this?',
      'What are the implications of this?',
      'Are there any related topics I should know about?',
    ];
  }
};

export default {
  generateSummary,
  compareDocuments,
  extractInsights,
  semanticSearch,
  runTemplateAnalysis,
  extractEntities,
  generateFollowUpQuestions,
};
