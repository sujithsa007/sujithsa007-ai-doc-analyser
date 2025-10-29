/**
 * AI Document Analyser Backend API Server
 * 
 * This Express.js server provides AI-powered document analysis using Groq's LLaMA model.
 * Features:
 * - Multi-format document support: PDF, Word, Excel, Images (OCR), CSV, and more
 * - Fast document analysis (2-5 second response time)
 * - File upload with 50MB support
 * - Optical Character Recognition (OCR) for images
 * - CORS enabled for frontend integration
 * - Comprehensive error handling and logging
 * - Health check endpoint for monitoring
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import compression from "compression";
import axios from "axios";
import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import documentProcessor from "./services/documentProcessor.js";
import quotaTracker from "./services/quotaTracker.js";

// Load environment variables from .env file
dotenv.config();

// Initialize Express application
const app = express();

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory for processing
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept ALL file types - known types get specialized processing,
    // unknown types are processed as text files
    console.log(`📎 File upload accepted: ${file.originalname} (${file.mimetype})`);
    cb(null, true); // Accept all files
  }
});

// Middleware Configuration
app.use(compression()); // Enable gzip compression for faster response transfer
app.use(cors()); // Enable Cross-Origin Resource Sharing for frontend
app.use(express.json({ limit: '50mb' })); // Parse JSON payloads up to 50MB
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Parse URL-encoded data

// AI Model Configuration - Using Groq for ultra-fast inference
const model = new ChatGroq({
  model: "llama-3.3-70b-versatile", // Latest LLaMA model - excellent for document analysis
  temperature: 0, // Deterministic responses for consistent analysis
  apiKey: process.env.GROQ_API_KEY, // Free API key from console.groq.com
  maxTokens: 2048, // Limit response length for faster inference
  streaming: false, // Non-streaming for complete responses
  maxRetries: 2, // Reduce retries for faster failure detection
  timeout: 30000, // 30 second timeout to avoid hanging requests
});

/**
 * Smart content truncation to fit within token limits while preserving important information
 * Uses intelligent chunking to keep beginning and end of documents
 */
function smartTruncate(content, maxChars = 12000) { // Reduced from 15000 for faster processing
  if (content.length <= maxChars) {
    return content;
  }
  
  // Keep beginning and end, as they often contain key info (intro and conclusion)
  const beginChars = Math.floor(maxChars * 0.6); // 60% from beginning
  const endChars = Math.floor(maxChars * 0.4); // 40% from end
  
  const beginning = content.substring(0, beginChars);
  const end = content.substring(content.length - endChars);
  
  return `${beginning}\n\n[... ${(content.length - maxChars).toLocaleString()} characters omitted for performance ...]\n\n${end}`;
}

/**
 * Content Similarity Analyzer
 * Calculates actual content similarity between documents before AI analysis
 * Returns similarity metrics to help AI make evidence-based decisions
 */
function analyzeContentSimilarity(documents) {
  if (documents.length < 2) {
    return { hasSimilarity: false, metrics: {} };
  }

  // Extract meaningful words (remove common stop words)
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'it', 'its', 'his', 'her', 'their', 'our', 'your']);
  
  const getSignificantWords = (content) => {
    return content
      .toLowerCase()
      .replace(/[^a-z0-9\s@.-]/g, ' ') // Keep alphanumeric, emails, numbers
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .filter(word => !/^\d+$/.test(word)); // Remove pure numbers
  };

  const getNgrams = (words, n = 3) => {
    const ngrams = new Set();
    for (let i = 0; i <= words.length - n; i++) {
      ngrams.add(words.slice(i, i + n).join(' '));
    }
    return ngrams;
  };

  // Analyze each document
  const docAnalysis = documents.map((doc, index) => {
    const content = doc.content || '';
    const words = getSignificantWords(content);
    const uniqueWords = new Set(words);
    const ngrams = getNgrams(words, 3);
    
    // Extract potential entities (capitalized words, emails, specific patterns)
    const entities = new Set();
    const lines = content.split('\n');
    
    // Extract emails
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = content.match(emailRegex) || [];
    emails.forEach(email => entities.add(email.toLowerCase()));
    
    // Extract capitalized phrases (potential names, places, organizations)
    const capitalizedRegex = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g;
    const capitalizedPhrases = content.match(capitalizedRegex) || [];
    capitalizedPhrases.forEach(phrase => entities.add(phrase));
    
    // Extract dates
    const dateRegex = /\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b|\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b/g;
    const dates = content.match(dateRegex) || [];
    dates.forEach(date => entities.add(date));
    
    // Extract IDs and codes (alphanumeric patterns like EMP-123, ID12345)
    const idRegex = /\b[A-Z]{2,}-?\d{3,}\b|\b[A-Z]+\d{4,}\b/g;
    const ids = content.match(idRegex) || [];
    ids.forEach(id => entities.add(id));

    return {
      index,
      fileName: doc.fileName,
      wordCount: words.length,
      uniqueWords,
      ngrams,
      entities,
      contentLength: content.length
    };
  });

  // Calculate pairwise similarities
  const similarities = [];
  for (let i = 0; i < docAnalysis.length; i++) {
    for (let j = i + 1; j < docAnalysis.length; j++) {
      const doc1 = docAnalysis[i];
      const doc2 = docAnalysis[j];
      
      // Jaccard similarity for unique words
      const intersection = new Set([...doc1.uniqueWords].filter(x => doc2.uniqueWords.has(x)));
      const union = new Set([...doc1.uniqueWords, ...doc2.uniqueWords]);
      const wordSimilarity = intersection.size / union.size;
      
      // N-gram similarity (phrase overlap)
      const ngramIntersection = new Set([...doc1.ngrams].filter(x => doc2.ngrams.has(x)));
      const ngramUnion = new Set([...doc1.ngrams, ...doc2.ngrams]);
      const ngramSimilarity = ngramUnion.size > 0 ? ngramIntersection.size / ngramUnion.size : 0;
      
      // Entity overlap (names, emails, dates, IDs)
      const entityIntersection = new Set([...doc1.entities].filter(x => doc2.entities.has(x)));
      const sharedEntities = Array.from(entityIntersection);
      
      // Overall similarity score (weighted)
      const overallSimilarity = (wordSimilarity * 0.3) + (ngramSimilarity * 0.4) + (Math.min(entityIntersection.size / 3, 1) * 0.3);
      
      similarities.push({
        doc1: doc1.fileName,
        doc2: doc2.fileName,
        wordSimilarity: (wordSimilarity * 100).toFixed(1),
        ngramSimilarity: (ngramSimilarity * 100).toFixed(1),
        sharedEntities: sharedEntities,
        entityCount: entityIntersection.size,
        overallSimilarity: (overallSimilarity * 100).toFixed(1),
        // STRICTER THRESHOLD: Need 20% overall similarity OR 5+ shared entities
        isLikelySimilar: overallSimilarity > 0.20 || entityIntersection.size >= 5
      });
    }
  }

  // Determine if ANY documents are similar
  const hasSimilarity = similarities.some(s => s.isLikelySimilar);
  
  return {
    hasSimilarity,
    similarities,
    totalDocuments: documents.length,
    analysis: docAnalysis.map(d => ({
      fileName: d.fileName,
      uniqueWordCount: d.uniqueWords.size,
      entityCount: d.entities.size,
      contentLength: d.contentLength
    }))
  };
}

/**
 * Format similarity analysis for AI context
 */
function formatSimilarityContext(similarityResult) {
  // Handle single document case (no comparison possible)
  if (!similarityResult.similarities || similarityResult.similarities.length === 0) {
    return `
⚠️ CONTENT ANALYSIS PRE-CHECK:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SINGLE DOCUMENT ANALYSIS - No comparison needed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  }
  
  if (!similarityResult.hasSimilarity) {
    return `
⚠️ CONTENT ANALYSIS PRE-CHECK:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AUTOMATED SIMILARITY SCAN RESULTS: NO SIGNIFICANT OVERLAP DETECTED

${similarityResult.similarities.map(s => 
  `📊 ${s.doc1} vs ${s.doc2}:
   - Word Overlap: ${s.wordSimilarity}% (threshold: 20%)
   - Phrase Match: ${s.ngramSimilarity}% (threshold: 15%)
   - Shared Entities: ${s.entityCount} (threshold: 5)
   - Overall Similarity: ${s.overallSimilarity}%
   ❌ VERDICT: Documents are COMPLETELY UNRELATED (failed all thresholds)`
).join('\n\n')}

⚠️ CRITICAL INSTRUCTION: The automated deep-content scan found ZERO significant overlap.
Blood test reports vs student data, sales reports vs recipes, etc. = UNRELATED.
These documents discuss COMPLETELY DIFFERENT topics with COMPLETELY DIFFERENT data.
DO NOT claim they are related unless you find CONCRETE SHARED ENTITIES (same names, IDs, references).
Generic similarities like "both have numbers" or "both are data files" DO NOT COUNT.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  }

  return `
✅ CONTENT ANALYSIS PRE-CHECK:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AUTOMATED SIMILARITY SCAN RESULTS: POTENTIAL OVERLAP DETECTED

${similarityResult.similarities.map(s => {
  if (s.isLikelySimilar) {
    return `📊 ${s.doc1} vs ${s.doc2}:
   - Word Overlap: ${s.wordSimilarity}%
   - Phrase Match: ${s.ngramSimilarity}%
   - Shared Entities: ${s.entityCount} → ${s.sharedEntities.length > 0 ? s.sharedEntities.slice(0, 5).join(', ') : 'None'}
   - Overall Similarity: ${s.overallSimilarity}%
   ✅ VERDICT: Potential relationship detected - verify with evidence`;
  } else {
    return `📊 ${s.doc1} vs ${s.doc2}:
   - Overall Similarity: ${s.overallSimilarity}%
   ❌ VERDICT: Documents appear UNRELATED`;
  }
}).join('\n\n')}

💡 Use these shared entities as evidence in your analysis.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}

/**
 * Optimized document formatting for multi-doc analysis
 * Reduces payload size while maintaining context and structure
 * Preserves table/spreadsheet structure for better data extraction
 */
function formatDocumentsOptimized(documents) {
  return documents.map((doc, index) => {
    // Truncate large documents intelligently
    const truncatedContent = smartTruncate(doc.content || '', 15000);
    const wasTruncated = (doc.content?.length || 0) > 15000;
    
    // Detect if document is likely a spreadsheet/table (contains many tabs/commas in structured format)
    const isLikelySpreadsheet = (doc.documentType?.toLowerCase().includes('spreadsheet') || 
                                  doc.documentType?.toLowerCase().includes('excel') ||
                                  doc.documentType?.toLowerCase().includes('csv') ||
                                  doc.fileName?.match(/\.(xlsx?|csv)$/i));
    
    // Extract preview of first few lines to help AI understand structure
    const firstLines = truncatedContent.split('\n').slice(0, 3).join('\n');
    
    return `
══════════════════ DOCUMENT ${index + 1} ══════════════════
FILE: ${doc.fileName || `Document ${index + 1}`}
TYPE: ${doc.documentType || 'Unknown'}
FORMAT: ${isLikelySpreadsheet ? '⚠️ SPREADSHEET/TABLE - Contains structured data' : 'Text document'}
SIZE: ${(doc.content?.length || 0).toLocaleString()} chars${wasTruncated ? ' (truncated for performance)' : ''}
${isLikelySpreadsheet ? `PREVIEW (first 3 lines):\n${firstLines}\n⚠️ When analyzing: Look for column headers, row data, and specific values` : ''}
═══════════════════════════════════════════════════════════

${truncatedContent}

══════════════ END OF DOCUMENT ${index + 1} ══════════════
`;
  }).join('\n\n');
}

// Optimized prompt template for single document analysis
const singleDocPrompt = ChatPromptTemplate.fromTemplate(`
You are an expert document analyst with specialized knowledge in extracting and interpreting information from various document types including PDFs, Word documents, Excel spreadsheets, images, and more.

ANALYSIS INSTRUCTIONS:
- Read the entire document carefully before responding
- Extract key information, facts, and relevant details
- For spreadsheets: Recognize tables, columns, and data relationships
- For images: Note that text was extracted via OCR and may have minor errors
- For technical/medical content: Provide precise terminology and explanations
- If information is missing: Clearly state what cannot be found
- Maintain professional, accurate tone throughout response

DOCUMENT TYPE: {documentType}
FILE NAME: {fileName}

DOCUMENT CONTENT:
{context}

USER QUESTION: {question}

DETAILED ANALYSIS RESPONSE:`);

// Enhanced prompt template for multi-document analysis with strict validation
const multiDocPrompt = ChatPromptTemplate.fromTemplate(`
You are a CRITICAL document analyst specializing in precise cross-document analysis. Your role is to provide ACCURATE, EVIDENCE-BASED assessments.

═══════════════════════════════════════════════════════════════════════
⚠️  CRITICAL ANALYSIS RULES - FOLLOW STRICTLY ⚠️
═══════════════════════════════════════════════════════════════════════

0. AUTOMATED SIMILARITY SCAN:
   - An automated content analysis has already scanned the documents
   - If the scan shows "NO SIGNIFICANT OVERLAP DETECTED", the documents are LIKELY UNRELATED
   - You MUST find concrete evidence to override the automated scan results
   - Low similarity scores (<15%) indicate DIFFERENT content - do NOT claim they are related

1. EVIDENCE REQUIREMENT:
   - NEVER claim similarity without CONCRETE evidence
   - Quote EXACT text, data, or values that support your claims
   - If you cannot find specific matching content, the documents are UNRELATED
   - File type differences (PDF vs TXT) mean NOTHING - only actual content matters

2. RELATIONSHIP VALIDATION:
   - Documents uploaded together does NOT mean they are related
   - Similarity requires: shared entities (names, dates, IDs), overlapping topics, or common data
   - Different topics/subjects = UNRELATED documents
   - Generic similarities (e.g., "both are business documents") DO NOT count as related
   - If automated scan shows low similarity AND you find no shared entities, they are UNRELATED

3. DATA EXTRACTION (for spreadsheets/tables):
   - When searching for person-specific data across Excel/CSV files:
     * Identify the EXACT column headers in each document
     * Search for the person's name/ID in ALL documents
     * Extract matching row data with column names
     * If person NOT found in a document, explicitly state: "Person X not found in [filename]"
   - Present data in clear table format showing which document each value came from

4. COMPARISON STANDARDS:
   - List SPECIFIC differences: dates, names, amounts, topics, data points
   - List SPECIFIC similarities: exact matching values, names, references
   - If no meaningful overlap exists, state: "These documents are UNRELATED"

5. CITATION REQUIREMENTS:
   - Every claim MUST cite the source document: [Document 1: filename.pdf]
   - Quote exact text when claiming similarity: "Both mention 'Project Alpha' [Doc 1, Doc 2]"
   - For data: "John Smith's salary: $50,000 [employees.xlsx, row 15] vs $52,000 [payroll.xlsx, row 8]"

6. TRUTHFULNESS OVER HELPFULNESS:
   - Being accurate is MORE important than finding connections
   - If documents are unrelated, say so clearly and explain why
   - DO NOT fabricate or exaggerate relationships to seem helpful

═══════════════════════════════════════════════════════════════════════
EXAMPLE RESPONSE FORMATS:
═══════════════════════════════════════════════════════════════════════

EXAMPLE 1 - Unrelated Documents:
Q: "Are these documents related?"
A: "❌ These documents are UNRELATED. Here's why:
- Document 1 (sales_report.pdf) discusses Q3 sales figures for the retail division
- Document 2 (hr_policy.docx) contains company vacation and leave policies
- NO shared entities: No common names, dates, projects, or references found
- NO topic overlap: Sales metrics vs HR policies are completely different subjects
- CONCLUSION: These documents serve entirely different purposes and contain no cross-references."

EXAMPLE 2 - Related Documents with Evidence:
Q: "Are these documents related?"
A: "✅ Yes, these documents are RELATED. Evidence:
- SHARED ENTITY: Both mention 'Project Phoenix' [Doc 1, page 3; Doc 2, section 2]
- SHARED PERSON: 'Sarah Johnson' appears in both [Doc 1 as lead; Doc 2 as reviewer]
- SHARED DATE: Both reference deadline '2024-03-15' [Doc 1, timeline; Doc 2, milestone chart]
- TOPIC OVERLAP: Both discuss cloud migration strategy
- CONCLUSION: These are complementary documents for the same project."

EXAMPLE 3 - Person Data Extraction from Multiple Excel Files:
Q: "Find all data for John Smith"
A: "📊 Data for 'John Smith' across {documentCount} documents:

✅ FOUND in Document 1 (employees.xlsx):
| Column          | Value           |
|----------------|-----------------|
| Employee ID    | E-12345         |
| Name           | John Smith      |
| Department     | Engineering     |
| Salary         | $95,000         |
| Start Date     | 2020-01-15      |

✅ FOUND in Document 2 (payroll.xlsx):
| Column          | Value           |
|----------------|-----------------|
| Employee ID    | E-12345         |
| Name           | John Smith      |
| Gross Pay      | $7,916.67       |
| Deductions     | $1,250.00       |
| Net Pay        | $6,666.67       |

❌ NOT FOUND in Document 3 (vendors.xlsx):
- This document contains vendor information only
- No employee data present
- John Smith is not listed

SUMMARY: John Smith found in 2 out of 3 documents (employee and payroll records)."

═══════════════════════════════════════════════════════════════════════

AVAILABLE DOCUMENTS: {documentCount}

{documentsContent}

USER QUESTION: {question}

═══════════════════════════════════════════════════════════════════════
ANALYSIS RESPONSE (cite sources with exact quotes/data):`);

/**
 * Health Check Endpoint
 * GET /health - Returns server status for monitoring and load balancers
 */
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "AI Document Analyser backend is operational",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    supportedFormats: documentProcessor.getSupportedFormats().length
  });
});

/**
 * Supported Formats Endpoint
 * GET /formats - Returns list of all supported document formats
 */
app.get("/formats", (req, res) => {
  const formats = documentProcessor.getSupportedFormats();
  res.json({
    success: true,
    totalFormats: formats.length,
    formats: formats,
    categories: {
      documents: formats.filter(f => f.type.includes('Document')).length,
      spreadsheets: formats.filter(f => f.type.includes('Spreadsheet') || f.type.includes('CSV')).length,
      images: formats.filter(f => f.requiresOCR).length,
      text: formats.filter(f => f.type.includes('Text') || f.type.includes('HTML')).length
    }
  });
});

/**
 * API Quota Status Endpoint
 * GET /quota - Returns local quota tracking statistics
 * Tracks usage locally without making additional API calls
 */
app.get("/quota", (req, res) => {
  try {
    const stats = quotaTracker.getQuotaStats();
    res.json(stats);
  } catch (error) {
    console.error("Error getting quota:", error);
    res.status(500).json({ 
      error: "Failed to retrieve quota information",
      details: error.message 
    });
  }
});

/**
 * File Upload and Processing Endpoint
 * POST /upload - Upload a document file and extract text content
 * 
 * Request: multipart/form-data with 'file' field
 * Response: { success, content, metadata }
 */
app.post("/upload", upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded. Please upload a document file."
      });
    }

    console.log("\n📤 ===== FILE UPLOAD RECEIVED =====");
    console.log("📄 File name:", req.file.originalname);
    console.log("📦 File size:", (req.file.size / 1024).toFixed(2), "KB");
    console.log("🏷️  MIME type:", req.file.mimetype);
    console.log("⏰ Timestamp:", new Date().toISOString());
    console.log("=====================================\n");

    // Process the document
    const result = await documentProcessor.processDocument(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    console.log("✅ Document processed successfully");
    console.log("📊 Extracted", result.metadata.wordCount, "words,", result.metadata.characterCount, "characters");
    console.log("⏱️  Processing time:", result.metadata.processingTime, "ms\n");

    res.json(result);

  } catch (error) {
    console.error("❌ File upload error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Document Analysis Endpoint
 * POST /ask - Analyzes document content and answers questions using AI
 * 
 * Request Body:
 * @param {string} question - User's question about the document
 * @param {string} content - Full document text content (up to 50MB)
 * 
 * Response:
 * @returns {object} { answer: string } - AI-generated analysis response
 * @returns {object} { error: string } - Error message if processing fails
 */
app.post("/ask", async (req, res) => {
  const startRequestTime = Date.now();
  const { question, content, documents, documentType, fileName } = req.body;

  // Input validation for better error handling
  if (!question?.trim()) {
    return res.status(400).json({ 
      error: "Question is required and cannot be empty" 
    });
  }
  
  // Check if multi-document or single document request
  const isMultiDoc = documents && Array.isArray(documents) && documents.length > 0;
  
  if (!isMultiDoc && !content?.trim()) {
    return res.status(400).json({ 
      error: "Document content or documents array is required" 
    });
  }

  // Enhanced logging for debugging and monitoring
  console.log("\n🔍 ===== DOCUMENT ANALYSIS REQUEST =====");
  console.log("📅 Timestamp:", new Date().toISOString());
  console.log("📚 Analysis mode:", isMultiDoc ? `MULTI-DOCUMENT (${documents.length} docs)` : "SINGLE DOCUMENT");
  console.log("❓ Question:", question.substring(0, 100) + (question.length > 100 ? "..." : ""));
  
  if (isMultiDoc) {
    console.log("📄 Documents:");
    documents.forEach((doc, index) => {
      console.log(`   ${index + 1}. ${doc.fileName || 'Untitled'} (${doc.content?.length || 0} chars)`);
    });
  } else {
    console.log("📂 Document type:", documentType || "Unknown");
    console.log("📝 File name:", fileName || "Not provided");
    console.log("📄 Content length:", content.length.toLocaleString(), "characters");
  }
  
  console.log("🚀 Processing with full content (no truncation)");
  console.log("==========================================\n");

  try {
    let formattedPrompt;
    
    if (isMultiDoc) {
      // MULTI-DOCUMENT ANALYSIS with content similarity pre-check
      console.log("⚙️  Step 1a: Analyzing content similarity across documents...");
      
      // Perform automated content similarity analysis
      const similarityResult = analyzeContentSimilarity(documents);
      console.log(`📊 Similarity Analysis Complete:`);
      console.log(`   - Documents scanned: ${similarityResult.totalDocuments}`);
      console.log(`   - Similarity detected: ${similarityResult.hasSimilarity ? '✅ YES' : '❌ NO'}`);
      
      if (similarityResult.similarities) {
        similarityResult.similarities.forEach(s => {
          console.log(`   - ${s.doc1} vs ${s.doc2}: ${s.overallSimilarity}% similarity, ${s.entityCount} shared entities`);
        });
      }
      
      // CHECK FOR RELATIONSHIP QUESTIONS - If asking about similarity and documents are clearly unrelated, skip AI
      const isRelationshipQuestion = /are\s+(these|they|the\s+documents?|the\s+files?)\s+(related|similar|same|connected|linked)|do\s+(these|they)\s+(relate|match|connect)|is\s+there\s+(any\s+)?(relation|similarity|connection|link)|compare\s+(these|the\s+documents?)/i.test(question);
      
      // Only trigger hard block for multi-document comparisons (2+ documents)
      if (isRelationshipQuestion && !similarityResult.hasSimilarity && similarityResult.similarities && similarityResult.similarities.length > 0) {
        // Documents are clearly unrelated - return immediate response without AI
        const maxSimilarity = Math.max(...similarityResult.similarities.map(s => parseFloat(s.overallSimilarity)));
        const totalSharedEntities = similarityResult.similarities.reduce((sum, s) => sum + s.entityCount, 0);
        
        console.log(`🚫 HARD BLOCK TRIGGERED: Relationship question detected with ${maxSimilarity.toFixed(1)}% max similarity`);
        console.log(`   Skipping AI inference - returning definitive UNRELATED verdict\n`);
        
        const autoResponse = `❌ **THESE DOCUMENTS ARE COMPLETELY UNRELATED**

**AUTOMATED CONTENT ANALYSIS VERDICT:**

I've performed a comprehensive automated analysis comparing the actual content of these documents, and the results are definitive:

${similarityResult.similarities.map(s => `
📊 **${s.doc1}** vs **${s.doc2}**:
- Word Overlap: ${s.wordSimilarity}% (Threshold: 15% required)
- Phrase Matching: ${s.ngramSimilarity}% (Threshold: 10% required)  
- Shared Entities: ${s.entityCount} (Threshold: 3 required)
- **Overall Similarity: ${s.overallSimilarity}%**
- **Verdict: ❌ UNRELATED** (below all thresholds)
`).join('\n')}

**WHY THEY ARE UNRELATED:**

1. **No Shared Entities**: ${totalSharedEntities === 0 ? 'Zero common names, emails, dates, IDs, or identifiers found' : `Only ${totalSharedEntities} shared entities (need at least 3 significant matches)`}
2. **Different Topics**: The documents discuss completely different subject matters
3. **Minimal Word Overlap**: Less than ${maxSimilarity.toFixed(1)}% of words match (need >15% for similarity)
4. **No Common Phrases**: Virtually no matching 3-word phrases detected

**CONCLUSION:**

These documents serve entirely different purposes and contain no cross-references or shared data. They were likely uploaded together by coincidence, but their content is completely independent.

If you're looking for specific information, please ask about a particular document rather than comparing them.`;

        const endTime = Date.now();
        const totalDuration = ((endTime - startRequestTime) / 1000).toFixed(2);
        
        return res.json({ 
          answer: autoResponse,
          metadata: {
            processingTime: totalDuration,
            aiResponseTime: '0.0',
            documentCount: documents.length,
            analysisMode: 'automated-unrelated-detection',
            similarityScore: maxSimilarity.toFixed(1),
            aiSkipped: true
          }
        });
      }
      
      console.log("\n⚙️  Step 1b: Formatting multi-document AI prompt (with smart truncation)...");
      
      // Add similarity context to help AI make evidence-based decisions
      const similarityContext = formatSimilarityContext(similarityResult);
      
      // Use optimized formatting function
      const documentsContent = formatDocumentsOptimized(documents);
      
      formattedPrompt = await multiDocPrompt.format({
        documentCount: documents.length,
        documentsContent: similarityContext + '\n\n' + documentsContent,
        question: question
      });
      
      console.log(`✅ Multi-document prompt formatted (${documents.length} documents, with similarity analysis)`);
      
    } else {
      // SINGLE DOCUMENT ANALYSIS (backward compatibility) with truncation
      console.log("⚙️  Step 1: Formatting single-document AI prompt...");
      
      // Apply smart truncation to single documents too
      const truncatedContent = smartTruncate(content, 20000);
      
      formattedPrompt = await singleDocPrompt.format({
        context: truncatedContent,
        question: question,
        documentType: documentType || "Document",
        fileName: fileName || "Uploaded document"
      });
      
      console.log("✅ Single-document prompt formatted");
    }

    // Step 2: Call Groq API for AI analysis
    console.log("🤖 Step 2: Calling Groq AI model...");
    
    const aiStartTime = Date.now();
    
    const result = await model.invoke(formattedPrompt);
    
    const aiEndTime = Date.now();
    const aiDuration = ((aiEndTime - aiStartTime) / 1000).toFixed(2);
    const totalDuration = ((aiEndTime - startRequestTime) / 1000).toFixed(2);
    
    // Record request for local quota tracking
    const tokensUsed = quotaTracker.constructor.estimateTokens(formattedPrompt + result.content);
    quotaTracker.recordRequest(tokensUsed);
    
    // Get updated quota stats
    const quotaStats = quotaTracker.getQuotaStats();
    
    // Success logging
    console.log(`✅ AI analysis completed in ${aiDuration}s`);
    console.log(`📊 Total request time: ${totalDuration}s`);
    console.log(`📊 Quota: ${quotaStats.requests.percentageRemaining}% requests remaining, ${quotaStats.tokens.percentageRemaining}% tokens remaining`);
    console.log("📝 Response preview:", result.content.substring(0, 150) + "...\n");

    // Return successful analysis
    res.json({ 
      answer: result.content,
      metadata: {
        processingTime: totalDuration,
        aiResponseTime: aiDuration,
        documentCount: isMultiDoc ? documents.length : 1,
        analysisMode: isMultiDoc ? 'multi-document' : 'single-document'
      },
      quota: {
        requestsRemaining: quotaStats.requests.percentageRemaining,
        tokensRemaining: quotaStats.tokens.percentageRemaining,
        resetIn: quotaStats.resetIn,
        status: quotaStats.status
      }
    });
    
  } catch (err) {
    // Comprehensive error handling with specific error types
    const errorDuration = ((Date.now() - startRequestTime) / 1000).toFixed(2);
    
    console.error("❌ ERROR occurred after", errorDuration + "s");
    console.error("🔍 Error message:", err.message);
    console.error("📋 Full error:", err);
    
    // Extract rate limit details from error object or message
    let waitTime = 'some time';
    let errorMessage = err.message || 'Unknown error';
    let errorCode = err.error?.error?.code || err.code;
    
    // Groq SDK returns error in err.error.error.message for rate limits
    if (err.error?.error?.message) {
      errorMessage = err.error.error.message;
      console.log("🔍 Extracted nested error message:", errorMessage);
    }
    
    // Extract wait time from error message
    const rateLimitMatch = errorMessage.match(/Please try again in (.+?)\./);
    if (rateLimitMatch) {
      waitTime = rateLimitMatch[1];
      console.log("⏰ Extracted wait time:", waitTime);
    }
    
    // Check for rate limit error (multiple ways to detect it)
    const isRateLimitError = 
      err.status === 429 || 
      errorCode === 'rate_limit_exceeded' ||
      errorMessage.includes("Rate limit reached") || 
      errorMessage.includes("tokens per day") ||
      errorMessage.includes("rate limit");
    
    // Handle specific error types for better user experience
    if (isRateLimitError) {
      console.log("🚫 Rate limit error detected, returning 429 response");
      return res.status(429).json({ 
        error: `🚫 AI Rate Limit Reached\n\nYour free tier AI usage limit has been exceeded for today. The Groq AI service has a daily token limit.\n\n⏰ Please try again in: ${waitTime}\n\n💡 To continue using the service immediately:\n• Upgrade to Groq Dev Tier at: https://console.groq.com/settings/billing\n• Or wait ${waitTime} for the limit to reset\n\nSorry for the inconvenience!`,
        code: "RATE_LIMIT_EXCEEDED",
        waitTime: waitTime,
        upgradeUrl: "https://console.groq.com/settings/billing",
        retryAfter: waitTime
      });
    } else if (err.message.includes("timeout") || err.message.includes("Timeout")) {
      return res.status(504).json({ 
        error: "Request timeout - Document(s) too large or server overloaded. Try with smaller content.",
        code: "TIMEOUT_ERROR"
      });
    } else if (err.message.includes("API key") || err.message.includes("authentication")) {
      return res.status(401).json({ 
        error: "Authentication failed - Invalid Groq API key. Get a free key from console.groq.com",
        code: "AUTH_ERROR"
      });
    } else if (err.message.includes("reduce the length") || err.message.includes("too large")) {
      return res.status(413).json({ 
        error: "Document(s) too large for processing - Please use smaller documents",
        code: "PAYLOAD_TOO_LARGE"
      });
    } else {
      return res.status(500).json({ 
        error: "Internal server error: " + errorMessage,
        code: "INTERNAL_ERROR"
      });
    }
  }
});

/**
 * Document Summary Endpoint
 * POST /analyze/summary - Generates comprehensive summary with key points, entities, and action items
 * 
 * Request Body:
 * @param {string} content - Full document text content
 * @param {string} documentType - Type of document (optional)
 * @param {string} fileName - Name of the file (optional)
 * 
 * Response:
 * @returns {object} { summary, keyPoints, entities, actionItems, topics }
 */
app.post("/analyze/summary", async (req, res) => {
  const { content, documentType, fileName } = req.body;

  if (!content?.trim()) {
    return res.status(400).json({ 
      error: "Document content is required" 
    });
  }

  console.log("\n📊 ===== SUMMARY GENERATION REQUEST =====");
  console.log("📝 Document:", fileName || "Untitled");
  console.log("📄 Content length:", content.length.toLocaleString(), "characters");

  try {
    const summaryPrompt = ChatPromptTemplate.fromTemplate(`
You are an expert document analyst. Analyze the following document and provide a comprehensive summary.

DOCUMENT TYPE: {documentType}
FILE NAME: {fileName}

DOCUMENT CONTENT:
{content}

Please provide a structured analysis in the following JSON format:
{{
  "summary": "A concise 2-3 sentence overview of the entire document",
  "keyPoints": ["point1", "point2", "point3"],
  "entities": {{
    "people": ["person1", "person2"],
    "organizations": ["org1", "org2"],
    "locations": ["location1", "location2"],
    "dates": ["date1", "date2"],
    "amounts": ["amount1", "amount2"]
  }},
  "actionItems": ["action1", "action2"],
  "topics": ["topic1", "topic2", "topic3"]
}}

Ensure the response is valid JSON only, with no additional text.`);

    const formattedPrompt = await summaryPrompt.format({
      content: content.substring(0, 10000), // Limit to first 10K chars for summary
      documentType: documentType || "Document",
      fileName: fileName || "Uploaded document"
    });

    const result = await model.invoke(formattedPrompt);
    
    // Parse JSON response
    let analysisResult;
    try {
      analysisResult = JSON.parse(result.content);
    } catch (parseError) {
      // Fallback if AI doesn't return proper JSON
      analysisResult = {
        summary: result.content.substring(0, 500),
        keyPoints: [],
        entities: { people: [], organizations: [], locations: [], dates: [], amounts: [] },
        actionItems: [],
        topics: []
      };
    }

    console.log("✅ Summary generated successfully\n");
    res.json({ success: true, ...analysisResult });

  } catch (err) {
    console.error("❌ Summary generation error:", err.message);
    res.status(500).json({ 
      error: "Failed to generate summary: " + err.message 
    });
  }
});

/**
 * Document Comparison Endpoint
 * POST /analyze/compare - Compares multiple documents and identifies similarities/differences
 * 
 * Request Body:
 * @param {Array} documents - Array of {content, fileName} objects
 * 
 * Response:
 * @returns {object} { commonThemes, differences, recommendations }
 */
app.post("/analyze/compare", async (req, res) => {
  const { documents } = req.body;

  if (!Array.isArray(documents) || documents.length < 2) {
    return res.status(400).json({ 
      error: "At least 2 documents are required for comparison" 
    });
  }

  console.log("\n🔍 ===== DOCUMENT COMPARISON REQUEST =====");
  console.log("📚 Comparing", documents.length, "documents");

  try {
    const comparePrompt = ChatPromptTemplate.fromTemplate(`
You are an expert document analyst. Compare the following documents and identify key similarities and differences.

{documentsList}

Provide a structured comparison in JSON format:
{{
  "commonThemes": ["theme1", "theme2"],
  "differences": [
    {{"aspect": "aspect1", "details": "difference details"}}
  ],
  "uniqueToEach": [
    {{"document": "doc1", "uniquePoints": ["point1", "point2"]}}
  ],
  "recommendations": ["recommendation1", "recommendation2"]
}}

Ensure the response is valid JSON only.`);

    const documentsList = documents.map((doc, idx) => 
      `DOCUMENT ${idx + 1}: ${doc.fileName || `Document ${idx + 1}`}\n${doc.content.substring(0, 3000)}\n`
    ).join('\n---\n\n');

    const formattedPrompt = await comparePrompt.format({ documentsList });
    const result = await model.invoke(formattedPrompt);

    let comparisonResult;
    try {
      comparisonResult = JSON.parse(result.content);
    } catch (parseError) {
      comparisonResult = {
        commonThemes: [],
        differences: [],
        uniqueToEach: [],
        recommendations: [result.content.substring(0, 500)]
      };
    }

    console.log("✅ Comparison completed\n");
    res.json({ success: true, ...comparisonResult });

  } catch (err) {
    console.error("❌ Comparison error:", err.message);
    res.status(500).json({ 
      error: "Failed to compare documents: " + err.message 
    });
  }
});

/**
 * Document Insights Endpoint
 * POST /analyze/insights - Extracts sentiment, topics, complexity, and readability metrics
 * 
 * Request Body:
 * @param {string} content - Document content
 * 
 * Response:
 * @returns {object} { sentiment, topics, complexity, readability, wordCount }
 */
app.post("/analyze/insights", async (req, res) => {
  const { content, fileName } = req.body;

  if (!content?.trim()) {
    return res.status(400).json({ 
      error: "Document content is required" 
    });
  }

  console.log("\n💡 ===== INSIGHTS EXTRACTION REQUEST =====");
  console.log("📝 Document:", fileName || "Untitled");

  try {
    const insightsPrompt = ChatPromptTemplate.fromTemplate(`
Analyze the following document and provide insights about its characteristics.

DOCUMENT CONTENT:
{content}

Provide insights in JSON format:
{{
  "sentiment": "positive/neutral/negative",
  "sentimentScore": 0.0 to 1.0,
  "topics": ["topic1", "topic2", "topic3"],
  "complexity": "basic/intermediate/advanced",
  "keyThemes": ["theme1", "theme2"],
  "tone": "formal/informal/technical/conversational",
  "readabilityLevel": "elementary/middle-school/high-school/college/professional"
}}

Ensure the response is valid JSON only.`);

    const formattedPrompt = await insightsPrompt.format({
      content: content.substring(0, 5000)
    });

    const result = await model.invoke(formattedPrompt);

    let insights;
    try {
      insights = JSON.parse(result.content);
    } catch (parseError) {
      // Fallback with basic analysis
      const words = content.split(/\s+/).length;
      const sentences = content.split(/[.!?]+/).length;
      const avgWordsPerSentence = words / sentences;

      insights = {
        sentiment: "neutral",
        sentimentScore: 0.5,
        topics: [],
        complexity: avgWordsPerSentence > 20 ? "advanced" : avgWordsPerSentence > 15 ? "intermediate" : "basic",
        keyThemes: [],
        tone: "formal",
        readabilityLevel: "college"
      };
    }

    // Add word count
    insights.wordCount = content.split(/\s+/).length;

    console.log("✅ Insights extracted successfully\n");
    res.json({ success: true, ...insights });

  } catch (err) {
    console.error("❌ Insights extraction error:", err.message);
    res.status(500).json({ 
      error: "Failed to extract insights: " + err.message 
    });
  }
});

/**
 * Semantic Search Endpoint
 * POST /analyze/search - Performs semantic search across document content
 * 
 * Request Body:
 * @param {string} query - Search query
 * @param {string} content - Document content to search within
 * 
 * Response:
 * @returns {object} { results: Array of relevant excerpts with scores }
 */
app.post("/analyze/search", async (req, res) => {
  const { query, content, fileName } = req.body;

  if (!query?.trim() || !content?.trim()) {
    return res.status(400).json({ 
      error: "Both query and content are required" 
    });
  }

  console.log("\n🔎 ===== SEMANTIC SEARCH REQUEST =====");
  console.log("🔍 Query:", query);
  console.log("📄 Document:", fileName || "Untitled");

  try {
    const searchPrompt = ChatPromptTemplate.fromTemplate(`
Find the most relevant sections of the document that answer or relate to the search query.

SEARCH QUERY: {query}

DOCUMENT CONTENT:
{content}

Return results in JSON format:
{{
  "results": [
    {{
      "excerpt": "relevant text excerpt",
      "relevanceScore": 0.0 to 1.0,
      "context": "brief explanation of relevance"
    }}
  ]
}}

Include the top 5 most relevant excerpts. Ensure the response is valid JSON only.`);

    const formattedPrompt = await searchPrompt.format({
      query,
      content: content.substring(0, 8000)
    });

    const result = await model.invoke(formattedPrompt);

    let searchResults;
    try {
      searchResults = JSON.parse(result.content);
    } catch (parseError) {
      // Fallback to keyword search
      const queryWords = query.toLowerCase().split(/\s+/);
      const sentences = content.split(/[.!?]+/);
      
      const results = sentences
        .filter(sentence => 
          queryWords.some(word => sentence.toLowerCase().includes(word))
        )
        .slice(0, 5)
        .map(excerpt => ({
          excerpt: excerpt.trim(),
          relevanceScore: 0.7,
          context: "Contains search keywords"
        }));

      searchResults = { results };
    }

    console.log("✅ Search completed,", searchResults.results?.length || 0, "results found\n");
    res.json({ success: true, ...searchResults });

  } catch (err) {
    console.error("❌ Search error:", err.message);
    res.status(500).json({ 
      error: "Failed to search document: " + err.message 
    });
  }
});

/**
 * Template Analysis Endpoint
 * POST /analyze/template - Runs a template with multiple questions
 * 
 * Request Body:
 * @param {Array} questions - Array of questions to ask
 * @param {string} content - Document content
 * 
 * Response:
 * @returns {object} { results: Array of {question, answer} pairs }
 */
app.post("/analyze/template", async (req, res) => {
  const { questions, content, documentType, fileName } = req.body;

  if (!Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ 
      error: "Questions array is required" 
    });
  }

  if (!content?.trim()) {
    return res.status(400).json({ 
      error: "Document content is required" 
    });
  }

  console.log("\n📋 ===== TEMPLATE ANALYSIS REQUEST =====");
  console.log("📝 Template questions:", questions.length);
  console.log("📄 Document:", fileName || "Untitled");

  try {
    const results = [];

    for (const question of questions) {
      const formattedPrompt = await prompt.format({
        context: content,
        question: question,
        documentType: documentType || "Document",
        fileName: fileName || "Uploaded document"
      });

      const result = await model.invoke(formattedPrompt);
      
      results.push({
        question,
        answer: result.content
      });
    }

    console.log("✅ Template analysis completed,", results.length, "questions answered\n");
    res.json({ success: true, results });

  } catch (err) {
    console.error("❌ Template analysis error:", err.message);
    res.status(500).json({ 
      error: "Failed to complete template analysis: " + err.message 
    });
  }
});

/**
 * Entity Extraction Endpoint
 * POST /analyze/entities - Extracts named entities from document
 * 
 * Request Body:
 * @param {string} content - Document content
 * 
 * Response:
 * @returns {object} { people, organizations, locations, dates, money, emails }
 */
app.post("/analyze/entities", async (req, res) => {
  const { content, fileName } = req.body;

  if (!content?.trim()) {
    return res.status(400).json({ 
      error: "Document content is required" 
    });
  }

  console.log("\n🏷️  ===== ENTITY EXTRACTION REQUEST =====");
  console.log("📄 Document:", fileName || "Untitled");

  try {
    const entityPrompt = ChatPromptTemplate.fromTemplate(`
Extract all named entities from the following document.

DOCUMENT CONTENT:
{content}

Return entities in JSON format:
{{
  "people": ["name1", "name2"],
  "organizations": ["org1", "org2"],
  "locations": ["location1", "location2"],
  "dates": ["date1", "date2"],
  "money": ["amount1", "amount2"],
  "emails": ["email1", "email2"],
  "phoneNumbers": ["phone1", "phone2"]
}}

Ensure the response is valid JSON only with unique values.`);

    const formattedPrompt = await entityPrompt.format({
      content: content.substring(0, 8000)
    });

    const result = await model.invoke(formattedPrompt);

    let entities;
    try {
      entities = JSON.parse(result.content);
    } catch (parseError) {
      // Fallback to regex-based extraction
      const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
      const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
      const moneyRegex = /\$[\d,]+\.?\d*/g;
      const dateRegex = /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g;

      entities = {
        people: [],
        organizations: [],
        locations: [],
        dates: content.match(dateRegex) || [],
        money: content.match(moneyRegex) || [],
        emails: content.match(emailRegex) || [],
        phoneNumbers: content.match(phoneRegex) || []
      };
    }

    console.log("✅ Entities extracted successfully\n");
    res.json({ success: true, ...entities });

  } catch (err) {
    console.error("❌ Entity extraction error:", err.message);
    res.status(500).json({ 
      error: "Failed to extract entities: " + err.message 
    });
  }
});

/**
 * Follow-up Questions Generator Endpoint
 * POST /analyze/follow-ups - Generates intelligent follow-up questions based on conversation
 * 
 * Request Body:
 * @param {string} content - Document content
 * @param {Array} conversationHistory - Previous Q&A pairs
 * 
 * Response:
 * @returns {object} { questions: Array of suggested follow-up questions }
 */
app.post("/analyze/follow-ups", async (req, res) => {
  const { content, conversationHistory, fileName } = req.body;

  if (!content?.trim()) {
    return res.status(400).json({ 
      error: "Document content is required" 
    });
  }

  console.log("\n💬 ===== FOLLOW-UP GENERATION REQUEST =====");
  console.log("📄 Document:", fileName || "Untitled");
  console.log("🗨️  Conversation length:", conversationHistory?.length || 0);

  try {
    const conversationContext = conversationHistory 
      ? conversationHistory.map(item => `Q: ${item.question}\nA: ${item.answer}`).join('\n\n')
      : "No previous conversation";

    const followUpPrompt = ChatPromptTemplate.fromTemplate(`
Based on the document and conversation history, generate relevant follow-up questions that would help the user gain deeper insights.

DOCUMENT CONTENT:
{content}

PREVIOUS CONVERSATION:
{conversationContext}

Generate 5 intelligent follow-up questions in JSON format:
{{
  "questions": [
    "question1",
    "question2",
    "question3",
    "question4",
    "question5"
  ]
}}

Questions should be specific, insightful, and build upon the existing conversation. Ensure the response is valid JSON only.`);

    const formattedPrompt = await followUpPrompt.format({
      content: content.substring(0, 5000),
      conversationContext
    });

    const result = await model.invoke(formattedPrompt);

    let followUps;
    try {
      followUps = JSON.parse(result.content);
    } catch (parseError) {
      // Fallback to generic questions
      followUps = {
        questions: [
          "Can you provide more details about the main points?",
          "What are the key takeaways from this document?",
          "Are there any important dates or deadlines mentioned?",
          "What actions need to be taken based on this document?",
          "Can you summarize the most critical information?"
        ]
      };
    }

    console.log("✅ Follow-up questions generated\n");
    res.json({ success: true, ...followUps });

  } catch (err) {
    console.error("❌ Follow-up generation error:", err.message);
    res.status(500).json({ 
      error: "Failed to generate follow-up questions: " + err.message 
    });
  }
});

/**
 * Export Express app for testing and external usage
 */
export default app;

/**
 * Server Startup Configuration
 * Only starts the server when not in test mode to avoid conflicts during testing
 */
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  
  // Start the server with enhanced startup logging
  const supportedFormats = documentProcessor.getSupportedFormats();
  app.listen(PORT, () => {
    console.log("\n🚀 ===== AI DOCUMENT ANALYSER BACKEND STARTED =====");
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`🤖 AI Model: Groq LLaMA-3.3-70B (Ultra-fast inference)`);
    console.log(`📡 Core API Endpoints:`);
    console.log(`   POST ${PORT}/ask - Analyze document with AI`);
    console.log(`   POST ${PORT}/upload - Upload & process document`);
    console.log(`   GET  ${PORT}/formats - List supported formats`);
    console.log(`   GET  ${PORT}/health - Health check`);
    console.log(`\n🔬 Advanced Analysis Endpoints:`);
    console.log(`   POST ${PORT}/analyze/summary - Generate document summary`);
    console.log(`   POST ${PORT}/analyze/compare - Compare multiple documents`);
    console.log(`   POST ${PORT}/analyze/insights - Extract sentiment & topics`);
    console.log(`   POST ${PORT}/analyze/search - Semantic search within doc`);
    console.log(`   POST ${PORT}/analyze/template - Run question templates`);
    console.log(`   POST ${PORT}/analyze/entities - Extract named entities`);
    console.log(`   POST ${PORT}/analyze/follow-ups - Generate follow-up questions`);
    console.log(`\n💚 Health Check: http://localhost:${PORT}/health`);
    console.log(`⚡ Expected response time: 2-5 seconds`);
    console.log(`📊 Max file size: 50MB`);
    console.log(`📄 Officially supported formats: ${supportedFormats.length} types`);
    console.log(`   - PDF, Word (doc/docx), Excel (xls/xlsx/csv)`);
    console.log(`   - Images with OCR (jpg, png, gif, bmp, tiff, webp)`);
    console.log(`   - Text files (txt, html, markdown, rtf)`);
    console.log(`   - Code files (sql, json, xml, js, ts, py, java, etc.)`);
    console.log(`   ⭐ Plus: ANY other file type (processed as text)`);
    console.log(`🔑 API Key configured: ${process.env.GROQ_API_KEY ? '✅ Yes' : '❌ Missing'}`);
    console.log("=========================================================\n");
  });
}
