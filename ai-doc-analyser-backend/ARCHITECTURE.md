# 🏛️ Backend Architecture Documentation

## 🎯 System Overview

The PDF AI Assistant Backend (powered by LangChain) is a high-performance Express.js API service designed for ultra-fast PDF document analysis using AI. It leverages Groq's optimized LLaMA-3.3-70B model to provide 2-5 second response times for comprehensive document analysis.

## 📐 Architecture Patterns

### 1. **Layered Architecture**
```
┌─────────────────────────────────────────┐
│            Presentation Layer            │  ← HTTP Routes & Controllers
├─────────────────────────────────────────┤
│             Business Logic              │  ← LangChain Integration
├─────────────────────────────────────────┤
│            External Services            │  ← Groq AI API
└─────────────────────────────────────────┘
```

### 2. **Request-Response Flow**
```
Client Request
     ↓
Express Middleware Stack
     ↓
Input Validation & Sanitization
     ↓
LangChain Prompt Engineering
     ↓
Groq API Call (LLaMA-3.3-70B)
     ↓
Response Processing & Metrics
     ↓
JSON Response to Client
```

## 🔧 Component Architecture

### Core Components

#### 1. **Express Application (`app.js`)**
```javascript
/**
 * Main application configuration and middleware setup
 * - CORS configuration for cross-origin requests
 * - JSON body parsing with 50MB limit for large documents
 * - Route definitions and error handling
 * - LangChain integration and AI model configuration
 */
```

**Key Responsibilities:**
- HTTP server configuration
- Middleware orchestration
- Route handling
- Error management
- AI service integration

**Dependencies:**
- `express` - Web framework
- `cors` - Cross-origin resource sharing
- `@langchain/groq` - AI model integration
- `@langchain/core/prompts` - Prompt engineering

#### 2. **Server Entry Point (`index.js`)**
```javascript
/**
 * Server startup and lifecycle management
 * - Environment configuration
 * - Graceful shutdown handling
 * - Error recovery mechanisms
 * - Development vs production setup
 */
```

**Key Responsibilities:**
- Server startup sequence
- Environment validation
- Port binding and listening
- Process signal handling

### Middleware Stack

#### 1. **CORS Middleware**
- **Purpose**: Enable cross-origin requests from frontend
- **Configuration**: Permissive for development, restrictive for production
- **Security**: Origin validation and credential handling

#### 2. **JSON Body Parser**
- **Purpose**: Parse incoming JSON payloads
- **Limit**: 50MB to handle large PDF content
- **Validation**: Content-type verification
- **Error Handling**: Malformed JSON detection

#### 3. **Custom Error Handler**
- **Purpose**: Centralized error processing
- **Features**: Error categorization, logging, sanitization
- **Response**: Structured error responses with codes

## 🧠 AI Integration Architecture

### LangChain Configuration

#### Model Setup
```javascript
const model = new ChatGroq({
  model: "llama-3.3-70b-versatile",  // Optimized for speed
  temperature: 0,                     // Deterministic responses
  apiKey: process.env.GROQ_API_KEY,
  maxTokens: undefined,               // Use full model capacity
  streaming: false,                   // Complete responses only
});
```

#### Prompt Engineering
```javascript
const prompt = ChatPromptTemplate.fromTemplate(`
You are an expert document analyst with deep knowledge across all domains.
Your task is to provide comprehensive, accurate answers based on document content.

ANALYSIS GUIDELINES:
- Provide thorough, well-structured responses
- Use specific examples from the document when relevant
- Maintain professional, informative tone
- If information is not in the document, clearly state this

DOCUMENT CONTENT:
{context}

USER QUESTION:
{question}

DETAILED ANALYSIS:
`);
```

### Processing Pipeline

#### 1. **Input Processing**
- Document content validation
- Question sanitization
- Size limit verification (50MB)
- Content encoding handling

#### 2. **AI Processing**
- Prompt template instantiation
- Context injection (full document)
- Model inference execution
- Response extraction and validation

#### 3. **Output Processing**
- Response formatting
- Metadata collection (processing times)
- Error handling and fallbacks
- Performance metrics logging

## 🌐 API Design Architecture

### RESTful Principles

#### Endpoint Structure
```
/health         GET     - System health check
/ask           POST    - Document analysis endpoint
```

#### HTTP Status Codes
- `200` - Success with analysis response
- `400` - Client error (validation failure)
- `401` - Authentication error (invalid API key)
- `413` - Payload too large
- `429` - Rate limit exceeded
- `500` - Internal server error
- `504` - Gateway timeout

#### Response Format
```json
{
  "answer": "Comprehensive analysis response...",
  "metadata": {
    "processingTime": "2.34",
    "aiResponseTime": "1.89",
    "contentLength": 15420,
    "timestamp": "2025-10-23T19:30:00.000Z"
  }
}
```

### Error Handling Architecture

#### Error Categories
1. **Validation Errors** - Input validation failures
2. **Authentication Errors** - API key issues
3. **Rate Limiting Errors** - Request throttling
4. **Timeout Errors** - Processing time limits
5. **System Errors** - Internal failures

#### Error Response Structure
```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_ERROR_CODE",
  "timestamp": "2025-10-23T19:30:00.000Z",
  "requestId": "uuid-for-tracking"
}
```

## 📊 Performance Architecture

### Optimization Strategies

#### 1. **Model Selection**
- **Groq LLaMA-3.3-70B**: Optimized for inference speed
- **Hardware Acceleration**: Groq's custom silicon
- **Response Time**: 2-5 seconds for most documents

#### 2. **Memory Management**
- **Streaming**: Efficient large document handling
- **Garbage Collection**: Optimized for Node.js
- **Buffer Management**: Controlled memory usage

#### 3. **Connection Optimization**
- **HTTP Keep-Alive**: Persistent connections
- **Request Pooling**: Connection reuse
- **Timeout Management**: Configurable limits

### Performance Metrics

#### Tracked Metrics
- **Request Processing Time**: End-to-end latency
- **AI Response Time**: Model inference duration
- **Content Length**: Document size analysis
- **Error Rates**: Success/failure ratios
- **Throughput**: Requests per second

#### Monitoring Points
```javascript
const startTime = process.hrtime.bigint();
// ... processing ...
const processingTime = Number(process.hrtime.bigint() - startTime) / 1e6;
```

## 🔒 Security Architecture

### Security Layers

#### 1. **Input Validation**
- Request body sanitization
- Content size limits
- Type validation
- Injection prevention

#### 2. **Authentication**
- API key validation
- Environment variable protection
- Secure key storage practices

#### 3. **Authorization**
- CORS policy enforcement
- Origin validation
- Request rate limiting (ready for implementation)

#### 4. **Error Information Limiting**
- Safe error messages for production
- Stack trace sanitization
- Sensitive data filtering

### Security Best Practices

#### Environment Security
```bash
# Required security measures
GROQ_API_KEY=secure_key_here
NODE_ENV=production
CORS_ORIGINS=https://trusted-domain.com
```

#### Request Validation
```javascript
// Input validation example
if (!question || question.trim().length === 0) {
  return res.status(400).json({
    error: "Question is required and cannot be empty",
    code: "VALIDATION_ERROR"
  });
}
```

## 🧪 Testing Architecture

### Test Strategy

#### Test Pyramid
```
       ┌─────────────────┐
       │   E2E Tests     │  ← Integration testing
       ├─────────────────┤
       │ Integration     │  ← API endpoint testing
       │     Tests       │
       ├─────────────────┤
       │   Unit Tests    │  ← Component testing
       └─────────────────┘
```

#### Test Categories

1. **Unit Tests**
   - Individual function validation
   - Error handling verification
   - Input/output validation

2. **Integration Tests**
   - API endpoint functionality
   - Database interactions
   - External service integration

3. **Performance Tests**
   - Load testing
   - Stress testing
   - Memory leak detection

### Test Implementation

#### Test Configuration (`vitest.config.js`)
```javascript
export default {
  test: {
    environment: 'node',
    testTimeout: 30000,
    coverage: {
      reporter: ['text', 'json', 'html'],
      threshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
}
```

#### Test Structure
```
test/
├── api.test.js           # API endpoint tests
├── fixtures/             # Test data
├── helpers/              # Test utilities
└── mocks/                # Mock implementations
```

## 🚀 Deployment Architecture

### Environment Configuration

#### Development Environment
```bash
NODE_ENV=development
PORT=5000
GROQ_API_KEY=development_key
DEBUG=true
```

#### Production Environment
```bash
NODE_ENV=production
PORT=80
GROQ_API_KEY=production_key
CORS_ORIGINS=https://yourdomain.com
```

### Containerization

#### Docker Architecture
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1
CMD ["npm", "start"]
```

### Scaling Considerations

#### Horizontal Scaling
- **Load Balancer**: Distribute requests across instances
- **Session Management**: Stateless design for easy scaling
- **Health Checks**: Automated instance monitoring

#### Vertical Scaling
- **Memory Optimization**: Efficient resource usage
- **CPU Utilization**: Optimal processing distribution
- **I/O Optimization**: Asynchronous operations

## 📈 Monitoring Architecture

### Observability Stack

#### Metrics Collection
- **Application Metrics**: Custom performance indicators
- **System Metrics**: CPU, memory, network usage
- **Business Metrics**: Request success rates, user engagement

#### Logging Strategy
```javascript
// Structured logging example
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: 'INFO',
  message: 'Request processed successfully',
  metadata: {
    processingTime,
    contentLength,
    requestId
  }
}));
```

#### Health Monitoring
```javascript
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'LangChain backend is operational',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV
  });
});
```

## 🔄 Data Flow Architecture

### Request Processing Flow

#### 1. **Request Ingestion**
```
HTTP Request → Express Router → Middleware Stack
```

#### 2. **Validation & Processing**
```
Input Validation → Content Processing → AI Integration
```

#### 3. **Response Generation**
```
AI Response → Metadata Collection → JSON Response
```

### Error Flow

#### 1. **Error Detection**
```
Validation Error | AI Error | System Error
```

#### 2. **Error Processing**
```
Error Categorization → Logging → Response Formatting
```

#### 3. **Client Response**
```
Structured Error Response → HTTP Status Code → Client
```

## 🛠️ Development Guidelines

### Code Organization

#### File Structure
```
langchain-backend/
├── app.js              # Main application logic
├── index.js            # Server startup
├── config/             # Configuration files
├── middleware/         # Custom middleware
├── routes/            # Route handlers
├── services/          # Business logic
├── utils/             # Utility functions
└── test/              # Test suites
```

#### Coding Standards
- **ES6+ Modules**: Modern JavaScript syntax
- **JSDoc Comments**: Comprehensive documentation
- **Error Handling**: Consistent error management
- **Async/Await**: Promise-based asynchronous code

### Contribution Guidelines

#### Development Workflow
1. **Feature Branch**: Create isolated feature branches
2. **Testing**: Write tests for new functionality
3. **Documentation**: Update relevant documentation
4. **Review**: Code review before merging
5. **Deployment**: Automated deployment pipeline

#### Quality Gates
- **Test Coverage**: Minimum 80% coverage
- **Linting**: ESLint compliance
- **Security**: Vulnerability scanning
- **Performance**: Load testing validation

---

<div align="center">

**Architecture designed for scalability, performance, and maintainability**

[🔙 Backend README](./README.md) • [📁 Project Structure](#component-architecture) • [🔒 Security](#security-architecture)

</div>