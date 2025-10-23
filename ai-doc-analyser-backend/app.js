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
import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import documentProcessor from "./services/documentProcessor.js";

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
    // Validate file type
    if (documentProcessor.isSupported(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  }
});

// Middleware Configuration
app.use(cors()); // Enable Cross-Origin Resource Sharing for frontend
app.use(express.json({ limit: '50mb' })); // Parse JSON payloads up to 50MB
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Parse URL-encoded data

// AI Model Configuration - Using Groq for ultra-fast inference
const model = new ChatGroq({
  model: "llama-3.3-70b-versatile", // Latest LLaMA model - excellent for document analysis
  temperature: 0, // Deterministic responses for consistent analysis
  apiKey: process.env.GROQ_API_KEY, // Free API key from console.groq.com
  maxTokens: undefined, // Let model decide optimal response length
  streaming: false, // Non-streaming for complete responses
});

// Optimized prompt template for accurate document analysis
const prompt = ChatPromptTemplate.fromTemplate(`
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
  const { question, content, documentType, fileName } = req.body;

  // Input validation for better error handling
  if (!question?.trim()) {
    return res.status(400).json({ 
      error: "Question is required and cannot be empty" 
    });
  }
  
  if (!content?.trim()) {
    return res.status(400).json({ 
      error: "Document content is required and cannot be empty" 
    });
  }

  // Enhanced logging for debugging and monitoring
  console.log("\n� ===== DOCUMENT ANALYSIS REQUEST =====");
  console.log("📅 Timestamp:", new Date().toISOString());
  console.log("📂 Document type:", documentType || "Unknown");
  console.log("📝 File name:", fileName || "Not provided");
  console.log("❓ Question:", question.substring(0, 100) + (question.length > 100 ? "..." : ""));
  console.log("📄 Content length:", content.length.toLocaleString(), "characters");
  console.log("🚀 Processing with full document (no truncation)");
  console.log("==========================================\n");

  try {
    // Step 1: Format the prompt with document context and question
    console.log("⚙️  Step 1: Formatting AI prompt...");
    const formattedPrompt = await prompt.format({
      context: content,
      question: question,
      documentType: documentType || "Document",
      fileName: fileName || "Uploaded document"
    });
    console.log("✅ Prompt formatted successfully");

    // Step 2: Call Groq API for AI analysis
    console.log("🤖 Step 2: Calling Groq AI model...");
    const aiStartTime = Date.now();
    
    const result = await model.invoke(formattedPrompt);
    
    const aiEndTime = Date.now();
    const aiDuration = ((aiEndTime - aiStartTime) / 1000).toFixed(2);
    const totalDuration = ((aiEndTime - startRequestTime) / 1000).toFixed(2);
    
    // Success logging
    console.log(`✅ AI analysis completed in ${aiDuration}s`);
    console.log(`📊 Total request time: ${totalDuration}s`);
    console.log("📝 Response preview:", result.content.substring(0, 150) + "...\n");

    // Return successful analysis
    res.json({ 
      answer: result.content,
      metadata: {
        processingTime: totalDuration,
        aiResponseTime: aiDuration,
        contentLength: content.length
      }
    });
    
  } catch (err) {
    // Comprehensive error handling with specific error types
    const errorDuration = ((Date.now() - startRequestTime) / 1000).toFixed(2);
    
    console.error("❌ ERROR occurred after", errorDuration + "s");
    console.error("🔍 Error message:", err.message);
    console.error("📋 Full error:", err);
    
    // Handle specific error types for better user experience
    if (err.message.includes("timeout") || err.message.includes("Timeout")) {
      res.status(504).json({ 
        error: "Request timeout - Document too large or server overloaded. Try with smaller content.",
        code: "TIMEOUT_ERROR"
      });
    } else if (err.message.includes("API key") || err.message.includes("authentication")) {
      res.status(401).json({ 
        error: "Authentication failed - Invalid Groq API key. Get a free key from console.groq.com",
        code: "AUTH_ERROR"
      });
    } else if (err.message.includes("rate limit") || err.message.includes("quota")) {
      res.status(429).json({ 
        error: "Rate limit exceeded - Please wait before making another request",
        code: "RATE_LIMIT_ERROR"
      });
    } else if (err.message.includes("reduce the length") || err.message.includes("too large")) {
      res.status(413).json({ 
        error: "Document too large for processing - Please use a smaller document",
        code: "PAYLOAD_TOO_LARGE"
      });
    } else {
      res.status(500).json({ 
        error: "Internal server error: " + err.message,
        code: "INTERNAL_ERROR"
      });
    }
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
    console.log(`📡 API Endpoints:`);
    console.log(`   POST ${PORT}/ask - Analyze document with AI`);
    console.log(`   POST ${PORT}/upload - Upload & process document`);
    console.log(`   GET  ${PORT}/formats - List supported formats`);
    console.log(`   GET  ${PORT}/health - Health check`);
    console.log(`💚 Health Check: http://localhost:${PORT}/health`);
    console.log(`⚡ Expected response time: 2-5 seconds`);
    console.log(`📊 Max file size: 50MB`);
    console.log(`📄 Supported formats: ${supportedFormats.length} types`);
    console.log(`   - PDF, Word (doc/docx), Excel (xls/xlsx/csv)`);
    console.log(`   - Images with OCR (jpg, png, gif, bmp, tiff, webp)`);
    console.log(`   - Text files (txt, html, markdown, rtf)`);
    console.log(`🔑 API Key configured: ${process.env.GROQ_API_KEY ? '✅ Yes' : '❌ Missing'}`);
    console.log("=====================================================\n");
  });
}
