# 🔐 Authentication & Security Guide

## Table of Contents
- [Overview](#overview)
- [Quick Start](#quick-start)
- [Authentication Methods](#authentication-methods)
- [Security Features](#security-features)
- [API Endpoints](#api-endpoints)
- [Integration Examples](#integration-examples)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

The AI Document Analyser implements **enterprise-grade authentication** using industry-standard practices to secure your document analysis platform. All document processing and analysis endpoints require authentication to prevent unauthorized access.

### 🎯 Key Features
- **JWT Token Authentication** - Secure, stateless authentication with access & refresh tokens
- **API Key Support** - Alternative authentication for programmatic access
- **Bcrypt Password Hashing** - Military-grade password protection (12 salt rounds)
- **Token Rotation** - Automatic refresh token rotation for enhanced security
- **Rate Limiting** - 100 requests per 15 minutes per IP address
- **Security Headers** - Helmet.js protection against common vulnerabilities
- **Role-Based Access Control** - Ready for admin/user role separation

---

## Quick Start

### 1. Environment Configuration

Update your `.env` file in `ai-doc-analyser-backend/`:

```bash
# Required
GROQ_API_KEY=your_groq_api_key_here

# Authentication Configuration (Optional - defaults shown)
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_ACCESS_EXPIRY=15m                    # Access token lifetime (15 minutes)
JWT_REFRESH_EXPIRY=7d                    # Refresh token lifetime (7 days)

# Server Configuration
PORT=5000
NODE_ENV=development
```

⚠️ **IMPORTANT**: In production, use a strong `JWT_SECRET` (minimum 32 characters, random alphanumeric + special characters)

### 2. Start the Server

```bash
cd ai-doc-analyser-backend
npm install
npm run dev
```

The server will automatically create a default admin user:

```
Email: admin@aidoc.local
Username: admin
Password: Admin123
```

⚠️ **SECURITY WARNING**: Change the default admin password immediately!

---

## Authentication Methods

The system supports **two authentication methods**. Use whichever fits your use case:

### Method 1: JWT Token Authentication (Recommended for Web Apps)

**Best for**: Frontend applications, mobile apps, interactive sessions

#### Registration Flow

```javascript
// Register a new user
const response = await fetch('http://localhost:5000/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    username: 'johndoe',
    password: 'SecurePass123'
  })
});

const data = await response.json();
console.log(data);
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "username": "johndoe",
    "role": "user",
    "apiKey": "aiDoc_xxxxxxxxxxxx",
    "apiKeyActive": true,
    "createdAt": "2025-01-23T10:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": "15m"
}
```

#### Login Flow

```javascript
// Login existing user
const response = await fetch('http://localhost:5000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123'
  })
});

const data = await response.json();
// Store tokens securely (localStorage, sessionStorage, or memory)
localStorage.setItem('accessToken', data.accessToken);
localStorage.setItem('refreshToken', data.refreshToken);
```

#### Making Authenticated Requests

```javascript
// Upload a document with JWT authentication
const accessToken = localStorage.getItem('accessToken');

const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('http://localhost:5000/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  },
  body: formData
});
```

#### Token Refresh Flow

Access tokens expire after 15 minutes. Use the refresh token to get a new access token:

```javascript
// Refresh access token when it expires
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  
  const response = await fetch('http://localhost:5000/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });

  const data = await response.json();
  
  // Update stored tokens
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  
  return data.accessToken;
}

// Automatic token refresh on 401 error
async function apiCall(url, options = {}) {
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    }
  });

  // If token expired, refresh and retry
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${newToken}`
      }
    });
  }

  return response;
}
```

---

### Method 2: API Key Authentication (For Backend/Scripts)

**Best for**: Server-to-server communication, CLI tools, automation scripts, third-party integrations

#### Get Your API Key

1. **Register or login** to get your user account
2. **Extract API key** from registration/login response, OR
3. **Rotate API key** using the rotation endpoint (requires JWT):

```javascript
// Rotate API key (generates new key, invalidates old one)
const response = await fetch('http://localhost:5000/auth/rotate-api-key', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const data = await response.json();
console.log('New API Key:', data.apiKey); // Store securely!
```

#### Using API Key

```javascript
// Example: Upload document with API key
const response = await fetch('http://localhost:5000/upload', {
  method: 'POST',
  headers: {
    'X-API-Key': 'aiDoc_your_api_key_here'
  },
  body: formData
});
```

```bash
# Example: cURL with API key
curl -X POST \
  -H "X-API-Key: aiDoc_your_api_key_here" \
  -F "file=@document.pdf" \
  http://localhost:5000/upload
```

---

## Security Features

### 🔐 Password Requirements

Passwords must meet these criteria:
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- Special characters recommended but not required

Get requirements programmatically:
```javascript
const response = await fetch('http://localhost:5000/auth/password-requirements');
const requirements = await response.json();
```

### 🛡️ Security Headers (Helmet.js)

The following security headers are automatically applied:
- `Content-Security-Policy` - Prevents XSS attacks
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-Frame-Options: DENY` - Prevents clickjacking
- `Strict-Transport-Security` - Enforces HTTPS (production)
- `X-XSS-Protection` - Legacy XSS protection

### ⏱️ Rate Limiting

- **Limit**: 100 requests per 15 minutes per IP address
- **Scope**: Applied to all API endpoints
- **Response**: HTTP 429 with retry information
- **Headers**: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`

Example rate limit response:
```json
{
  "error": "Too many requests from this IP, please try again later",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

### 🔄 Token Security

**Access Tokens:**
- Short-lived (15 minutes default)
- Used for API requests
- Cannot be revoked (expire naturally)
- Stored in memory or localStorage (frontend)

**Refresh Tokens:**
- Long-lived (7 days default)
- Used to obtain new access tokens
- Can be revoked (logout)
- Stored securely, never exposed

**Best Practices:**
- ✅ Store access tokens in memory when possible
- ✅ Use httpOnly cookies for refresh tokens (if using cookies)
- ✅ Implement token refresh before expiry
- ✅ Clear tokens on logout
- ❌ Never store tokens in URL parameters
- ❌ Never log tokens to console in production

---

## API Endpoints

### Public Endpoints (No Authentication Required)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check - server status |
| `/formats` | GET | List supported document formats |
| `/auth/register` | POST | Register new user |
| `/auth/login` | POST | Login user |
| `/auth/refresh` | POST | Refresh access token |
| `/auth/logout` | POST | Logout user (revoke refresh token) |
| `/auth/password-requirements` | GET | Get password validation rules |

### Protected Endpoints (Authentication Required)

All endpoints below require **either** JWT token **or** API key:

#### Core Document Processing
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/upload` | POST | Upload and process document |
| `/ask` | POST | Ask questions about document |
| `/quota` | GET | Check API quota status |

#### Advanced Analysis
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/analyze/summary` | POST | Generate document summary |
| `/analyze/compare` | POST | Compare multiple documents |
| `/analyze/insights` | POST | Extract sentiment & topics |
| `/analyze/search` | POST | Semantic search within document |
| `/analyze/template` | POST | Run question templates |
| `/analyze/entities` | POST | Extract named entities |
| `/analyze/follow-ups` | POST | Generate follow-up questions |

#### User Management (Protected)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/me` | GET | Get current user profile |
| `/auth/change-password` | POST | Change user password |
| `/auth/rotate-api-key` | POST | Generate new API key |

---

## Integration Examples

### React Frontend Integration

```javascript
// src/services/authService.js
class AuthService {
  constructor() {
    this.API_URL = 'http://localhost:5000';
    this.accessToken = null;
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  async register(email, username, password) {
    const response = await fetch(`${this.API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const data = await response.json();
    this.setTokens(data.accessToken, data.refreshToken);
    return data.user;
  }

  async login(email, password) {
    const response = await fetch(`${this.API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    this.setTokens(data.accessToken, data.refreshToken);
    return data.user;
  }

  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: this.refreshToken })
    });

    if (!response.ok) {
      this.logout();
      throw new Error('Session expired. Please login again.');
    }

    const data = await response.json();
    this.setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  }

  setTokens(accessToken, refreshToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('refreshToken', refreshToken);
  }

  logout() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('refreshToken');
  }

  getAuthHeader() {
    return this.accessToken ? { 'Authorization': `Bearer ${this.accessToken}` } : {};
  }

  async authenticatedFetch(url, options = {}) {
    // Add auth header
    options.headers = {
      ...options.headers,
      ...this.getAuthHeader()
    };

    let response = await fetch(url, options);

    // If token expired, refresh and retry
    if (response.status === 401 && this.refreshToken) {
      try {
        await this.refreshAccessToken();
        options.headers.Authorization = `Bearer ${this.accessToken}`;
        response = await fetch(url, options);
      } catch (error) {
        // Refresh failed, redirect to login
        window.location.href = '/login';
        throw error;
      }
    }

    return response;
  }
}

export const authService = new AuthService();
```

### Node.js Script Integration

```javascript
// script.js - Automated document processing
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const API_KEY = process.env.AI_DOC_API_KEY || 'aiDoc_your_api_key_here';
const API_URL = 'http://localhost:5000';

// Upload document
async function uploadDocument(filePath) {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));

  const response = await axios.post(`${API_URL}/upload`, formData, {
    headers: {
      'X-API-Key': API_KEY,
      ...formData.getHeaders()
    }
  });

  return response.data;
}

// Analyze document
async function analyzeDocument(content, question) {
  const response = await axios.post(`${API_URL}/ask`, {
    content,
    question
  }, {
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json'
    }
  });

  return response.data;
}

// Example usage
(async () => {
  try {
    // Upload
    const uploadResult = await uploadDocument('./report.pdf');
    console.log('Upload successful:', uploadResult.metadata.fileName);

    // Analyze
    const analysis = await analyzeDocument(
      uploadResult.text,
      'What are the key findings?'
    );
    console.log('Analysis:', analysis.answer);

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
})();
```

---

## Security Best Practices

### For Developers

1. **Environment Variables**
   - ✅ Store sensitive data in `.env` files
   - ✅ Add `.env` to `.gitignore`
   - ✅ Use different secrets for dev/prod
   - ✅ Rotate JWT secrets periodically

2. **Password Security**
   - ✅ Enforce strong password requirements
   - ✅ Never log passwords (even in development)
   - ✅ Use bcrypt with 12+ salt rounds
   - ✅ Implement password reset functionality

3. **Token Handling**
   - ✅ Keep access tokens short-lived (15 min)
   - ✅ Implement automatic token refresh
   - ✅ Revoke refresh tokens on logout
   - ✅ Clear tokens from memory on session end

4. **API Key Management**
   - ✅ Treat API keys like passwords
   - ✅ Allow users to rotate keys easily
   - ✅ Log API key usage for monitoring
   - ✅ Implement key-based rate limiting

5. **HTTPS in Production**
   - ✅ Always use HTTPS in production
   - ✅ Redirect HTTP to HTTPS
   - ✅ Enable HSTS headers
   - ✅ Use valid SSL certificates

### For Users

1. **Account Security**
   - Change default admin password immediately
   - Use unique, strong passwords
   - Don't share credentials or API keys
   - Log out when finished

2. **API Key Protection**
   - Store API keys in environment variables
   - Never commit API keys to version control
   - Rotate keys if exposed
   - Use read-only keys when possible (future feature)

---

## Troubleshooting

### "Access denied - No authentication token provided"

**Cause**: Missing or malformed `Authorization` header

**Solution**:
```javascript
// ✅ Correct
headers: {
  'Authorization': 'Bearer ' + accessToken
}

// ❌ Wrong - missing "Bearer " prefix
headers: {
  'Authorization': accessToken
}
```

### "Token expired - Please refresh your token"

**Cause**: Access token has expired (after 15 minutes)

**Solution**: Implement automatic token refresh:
```javascript
if (error.code === 'TOKEN_EXPIRED') {
  await refreshAccessToken();
  // Retry the request
}
```

### "Invalid or expired refresh token"

**Cause**: Refresh token is invalid, expired (7 days), or revoked

**Solution**: User must log in again
```javascript
// Redirect to login page
window.location.href = '/login';
```

### "Too many requests from this IP"

**Cause**: Exceeded rate limit (100 req/15 min)

**Solution**: Wait for rate limit window to reset. Check `RateLimit-Reset` header for reset time.

### "Invalid API key"

**Cause**: API key is incorrect, revoked, or deactivated

**Solutions**:
1. Verify API key is correct (starts with `aiDoc_`)
2. Rotate API key using `/auth/rotate-api-key`
3. Re-register if account was deleted

### "Email already registered"

**Cause**: Email address is already in use

**Solution**: Use a different email or login with existing account

### "Password must contain..."

**Cause**: Password doesn't meet security requirements

**Solution**: Follow password requirements:
- Minimum 8 characters
- One uppercase letter
- One lowercase letter
- One number

---

## Production Deployment Checklist

### Backend Configuration

- [ ] Set strong `JWT_SECRET` (min 32 chars, random)
- [ ] Configure proper `CORS_ORIGINS`
- [ ] Enable HTTPS (SSL certificate)
- [ ] Change default admin password
- [ ] Set `NODE_ENV=production`
- [ ] Configure rate limiting per requirements
- [ ] Set up monitoring and logging
- [ ] Back up user data regularly
- [ ] Implement password reset functionality
- [ ] Add email verification (optional)

### Frontend Configuration

- [ ] Use HTTPS for all API calls
- [ ] Implement secure token storage
- [ ] Add token refresh logic
- [ ] Handle 401/403 errors gracefully
- [ ] Clear tokens on logout
- [ ] Display security warnings to users
- [ ] Implement session timeout

---

## Database Integration (Future Enhancement)

Currently, the system uses **in-memory storage** for users and tokens. For production, consider migrating to a database:

### Recommended Databases

1. **MongoDB** - NoSQL, flexible schema
2. **PostgreSQL** - Relational, ACID compliant
3. **MySQL/MariaDB** - Popular, well-supported
4. **Redis** - For session/token storage

### Migration Steps

1. Install database driver (`mongoose`, `pg`, `mysql2`)
2. Update `userService.js` to use database operations
3. Implement connection pooling
4. Add database migration scripts
5. Update tests to use test database
6. Configure database connection in `.env`

---

## Support & Resources

- **GitHub Issues**: [Report bugs or request features](https://github.com/sujithsa007/sujithsa007-ai-doc-analyser/issues)
- **Documentation**: [Main README](../README.md) | [Backend README](../ai-doc-analyser-backend/README.md)
- **Security Issues**: Please report security vulnerabilities privately

---

## License

This authentication system is part of the AI Document Analyser project, licensed under the MIT License.

---

**Built with ❤️ using JWT, bcrypt, and modern security practices**

*Last updated: January 2025*
