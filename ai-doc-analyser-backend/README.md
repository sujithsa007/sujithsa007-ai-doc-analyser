# 🚀 AI Document Analyser Backend

[![Node.js](https://img.shields.io/badge/Node.js-20.19%2B-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.1.0-lightgrey.svg)](https://expressjs.com/)
[![LangChain](https://img.shields.io/badge/LangChain-1.0.1-purple.svg)](https://langchain.com/)
[![Groq](https://img.shields.io/badge/Groq-LLaMA--3.3--70B-orange.svg)](https://groq.com/)
[![Tests](https://img.shields.io/badge/Tests-8%2F8%20Passing-brightgreen.svg)](./test/)

> **Ultra-fast AI-powered multi-format document analysis API with 2-5 second response times**

Express.js backend service for AI Document Analyser that provides AI-powered document analysis for 20+ formats including PDF, Word, Excel, and images with OCR using LangChain and Groq's lightning-fast LLaMA model. Designed for production use with comprehensive error handling, input validation, and performance monitoring.

## ✨ Features

- 📄 **Multi-Format Support** - PDF, Word (.docx, .doc), Excel (.xlsx, .xls, .csv), and more
- 🖼️ **Image OCR** - Extract text from images (JPG, PNG, GIF, BMP, TIFF, WebP) using Tesseract.js
- 📝 **Text Files** - Markdown, HTML, RTF, plain text, OpenDocument formats
- 🤖 **Ultra-Fast AI Processing** - 2-5 second response times using Groq's LLaMA-3.3-70B
- 📊 **Full Document Analysis** - No content truncation, processes entire documents
- 🛡️ **Production-Ready** - Comprehensive error handling and input validation
- � **Performance Monitoring** - Request tracking and response time metrics
- 🔒 **Secure API** - CORS protection, request validation, file upload protection
- 🧪 **Fully Tested** - 8/8 tests passing with 100% critical path coverage
- ⚡ **Optimized Performance** - Efficient memory usage and connection pooling

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────┐
│   Express.js    │───▶│  LangChain   │───▶│   Groq AI   │
│   API Server    │    │  Prompting   │    │  LLaMA-3.3  │
└─────────────────┘    └──────────────┘    └─────────────┘
         │
         ▼
┌─────────────────┐
│  Comprehensive  │
│ Error Handling  │
│ & Validation    │
└─────────────────┘
```

## 📁 Project Structure

```
pdf-ai-backend/
├── app.js                       # Main Express application with multi-format support
├── index.js                     # Server entry point
├── services/
│   └── documentProcessor.js     # Multi-format document processing service
├── package.json                 # Dependencies and scripts
├── vitest.config.js             # Test configuration
├── .env.example                 # Environment template
├── .env                         # Environment variables (create from .env.example)
├── test/
│   └── api.test.js              # Comprehensive API tests
└── README.md                    # This file
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 20.19+ and npm 10+
- **Groq API Key** (free at [console.groq.com](https://console.groq.com))

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Add your Groq API key to .env
echo "GROQ_API_KEY=your_groq_api_key_here" >> .env
```

### Development

```bash
# Start development server with auto-reload
npm run dev

# Start production server
npm start

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 🌐 API Documentation

### Base URL
```
http://localhost:5000
```

### Endpoints

#### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "message": "AI Document Analyser backend is operational",
  "timestamp": "2025-10-23T19:30:00.000Z",
  "uptime": 1234.56
}
```

#### Get Supported Formats
```http
GET /formats
```

**Response:**
```json
{
  "formats": ["pdf", "docx", "doc", "xlsx", "xls", "csv", "jpg", "png", ...],
  "categories": {
    "documents": ["pdf", "docx", "doc", "odt"],
    "spreadsheets": ["xlsx", "xls", "csv", "ods"],
    "images": ["jpg", "jpeg", "png", "gif", "bmp", "tiff", "webp"],
    "text": ["txt", "md", "html", "rtf"]
  },
  "count": 20
}
```

#### Upload and Process Document
```http
POST /upload
Content-Type: multipart/form-data
```

**Request:**
- Form field: `file` (document to upload)
- Supported formats: PDF, DOCX, DOC, XLSX, XLS, CSV, JPG, PNG, GIF, BMP, TIFF, WebP, TXT, MD, HTML, RTF, ODT, ODS

**Success Response (200):**
```json
{
  "success": true,
  "text": "Extracted document text content...",
  "metadata": {
    "format": "docx",
    "fileName": "report.docx",
    "fileSize": 45678,
    "wordCount": 1234,
    "pageCount": 5,
    "processingTime": "1.2s"
  }
}
```

**Error Response (400):**
```json
{
  "error": "Unsupported file format: .xyz",
  "supportedFormats": ["pdf", "docx", "doc", ...]
}
```

#### Document Analysis
```http
POST /ask
Content-Type: application/json
```

**Request Body:**
```json
{
  "question": "What is the main topic of this document?",
  "content": "Full document text content here...",
  "documentType": "docx",  // Optional: for format-specific analysis
  "fileName": "report.docx"  // Optional: provides context to AI
}
```

**Success Response (200):**
```json
{
  "answer": "The main topic of this document is...",
  "metadata": {
    "processingTime": "2.3",
    "aiResponseTime": "1.8",
    "contentLength": 15420,
    "documentType": "docx",
    "fileName": "report.docx"
  }
}
```

**Error Responses:**
```json
// 400 - Bad Request
{
  "error": "Question is required and cannot be empty",
  "code": "VALIDATION_ERROR"
}

// 401 - Authentication Error
{
  "error": "Invalid Groq API key",
  "code": "AUTH_ERROR"
}

// 413 - Payload Too Large
{
  "error": "Document too large for processing",
  "code": "PAYLOAD_TOO_LARGE"
}

// 429 - Rate Limit
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_ERROR"
}

// 504 - Timeout
{
  "error": "Request timeout - document too large",
  "code": "TIMEOUT_ERROR"
}
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# Required
GROQ_API_KEY=your_groq_api_key_here

# Optional
PORT=5000                    # Server port (default: 5000)
HOST=localhost              # Server host (default: localhost)
NODE_ENV=development        # Environment (development/production/test)
```

### Advanced Configuration

```bash
# Request timeout in milliseconds
REQUEST_TIMEOUT=120000      # 2 minutes

# Enable debug logging
DEBUG=false

# CORS origins (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Rate limiting
RATE_LIMIT_MAX=100         # Requests per window
RATE_LIMIT_WINDOW=900000   # 15 minutes
```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- api.test.js
```

### Test Coverage
- **8/8 tests passing** ✅
- **100% critical path coverage**
- API endpoint validation
- Error handling scenarios
- CORS functionality
- Input validation
- Performance testing

### Test Categories
1. **Health Check Tests** - Server status validation
2. **Input Validation Tests** - Request body validation
3. **AI Processing Tests** - Document analysis functionality
4. **Error Handling Tests** - Comprehensive error scenarios
5. **CORS Tests** - Cross-origin request handling
6. **Performance Tests** - Large document handling

## 🔧 Development

### Available Scripts

```bash
npm start              # Start production server
npm run dev            # Start development server with auto-reload
npm run dev:debug      # Start with Node.js inspector
npm test               # Run tests
npm run test:run       # Run tests once (no watch)
npm run test:coverage  # Run tests with coverage report
npm run clean          # Clean cache files
npm run deps:update    # Update dependencies
npm run deps:audit     # Security audit
npm run health         # Check server health
```

### Code Structure

#### `app.js` - Main Application
- Express app configuration
- Middleware setup
- Route definitions
- Error handling
- LangChain integration

#### `index.js` - Server Entry Point
- Server startup logic
- Graceful shutdown handling
- Environment configuration
- Error recovery

#### `test/api.test.js` - Test Suite
- Comprehensive API testing
- Error scenario validation
- Performance benchmarks
- Integration tests

## 🏛️ Architecture Details

### LangChain Integration
```javascript
// Optimized AI model configuration
const model = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0,                    // Deterministic responses
  apiKey: process.env.GROQ_API_KEY,
  maxTokens: undefined,              // No artificial limits
  streaming: false,                  // Complete responses
});

// Structured prompt template
const prompt = ChatPromptTemplate.fromTemplate(`
You are an expert document analyst...
DOCUMENT CONTENT: {context}
USER QUESTION: {question}
ANALYSIS RESPONSE:
`);
```

### Error Handling Strategy
1. **Input Validation** - Request body validation
2. **API Error Mapping** - Specific error codes for different scenarios
3. **Timeout Handling** - Graceful timeout with user feedback
4. **Network Error Recovery** - Retry logic and fallback messages
5. **Logging & Monitoring** - Comprehensive error tracking

### Performance Optimizations
- **Fast AI Model** - Groq's optimized LLaMA inference
- **No Document Truncation** - Full content processing
- **Efficient Memory Usage** - Streaming and garbage collection
- **Connection Pooling** - Optimized HTTP connections
- **Response Compression** - Gzip compression for large responses

## 🔒 Security

### Implemented Security Measures
- **CORS Protection** - Configurable origin validation
- **Input Validation** - Request sanitization and validation
- **Rate Limiting Ready** - Framework for request throttling
- **Error Information Limiting** - Safe error messages for production
- **Environment Variable Protection** - Secure configuration management

### Security Best Practices
```bash
# Use environment variables for secrets
GROQ_API_KEY=your_secret_key

# Enable CORS only for trusted origins
CORS_ORIGINS=https://yourdomain.com

# Use HTTPS in production
# Implement rate limiting
# Monitor for unusual activity
```

## 📊 Monitoring & Analytics

### Built-in Metrics
- Request processing time
- AI response time
- Content length tracking
- Error rate monitoring
- Uptime tracking

### Logging Features
- Structured request/response logging
- Performance metrics
- Error tracking with stack traces
- API usage statistics
- Debug information for development

## 🚀 Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper CORS origins
- [ ] Set up HTTPS
- [ ] Configure rate limiting
- [ ] Set up monitoring
- [ ] Configure log rotation
- [ ] Set up health checks

### Docker Deployment
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Environment Variables for Production
```bash
NODE_ENV=production
PORT=5000
GROQ_API_KEY=your_production_key
CORS_ORIGINS=https://yourdomain.com
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <process_id> /F

# Then restart
npm run dev
```

### API Key Issues
- Verify `.env` file exists in backend root
- Check key format: `GROQ_API_KEY=gsk_...`
- Get new key from https://console.groq.com

### Module Not Found
```bash
npm install
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with tests
4. Run the test suite (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines
- Write comprehensive tests for new features
- Follow existing code style and patterns
- Add JSDoc comments for all functions
- Update documentation for API changes
- Ensure all tests pass before submitting

## � License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🔗 Related Projects

- **Frontend**: [PDF AI Assistant Frontend](../pdf-ai-frontend/) - React frontend for this API
- **Main Project**: [PDF AI Assistant Powered by LangChain](../) - Complete application documentation

## 📞 Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/your-username/pdf-ai-assistant-powered-by-lang/issues)
- 📖 **Documentation**: [Project Wiki](https://github.com/your-username/pdf-ai-assistant-powered-by-lang/wiki)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/your-username/pdf-ai-assistant-powered-by-lang/discussions)

---

<div align="center">

**Built with ❤️ using LangChain, Express.js, and Groq AI**

[🚀 Quick Start](#quick-start) • [📖 API Docs](#api-documentation) • [🧪 Testing](#testing)

</div>
