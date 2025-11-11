# 🔐 Password Change Guide

This guide shows you how to change passwords in the AI Document Analyser system.

---

## 📋 Table of Contents
- [Change Your Own Password (Authenticated User)](#change-your-own-password-authenticated-user)
- [Change Default Admin Password](#change-default-admin-password)
- [Password Requirements](#password-requirements)
- [Troubleshooting](#troubleshooting)

---

## Change Your Own Password (Authenticated User)

If you're logged in and want to change your password, use the `/auth/change-password` endpoint.

### Via API Call

**Endpoint:** `POST /auth/change-password`  
**Authentication:** Required (JWT token)  
**Request Body:**
```json
{
  "oldPassword": "your_current_password",
  "newPassword": "your_new_secure_password"
}
```

### Example: JavaScript/Fetch

```javascript
// Change password for logged-in user
async function changePassword(oldPassword, newPassword) {
  const accessToken = localStorage.getItem('accessToken');
  
  const response = await fetch('http://localhost:5000/auth/change-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      oldPassword: oldPassword,
      newPassword: newPassword
    })
  });

  const data = await response.json();
  
  if (data.success) {
    console.log('✅ Password changed successfully!');
    console.log('⚠️  All your sessions have been logged out. Please login again.');
    // Redirect to login page
    window.location.href = '/login';
  } else {
    console.error('❌ Password change failed:', data.error);
  }
}

// Usage
changePassword('admin123', 'MyNewSecurePassword123');
```

### Example: cURL

```bash
# Change password using cURL
curl -X POST http://localhost:5000/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "oldPassword": "admin123",
    "newPassword": "MyNewSecurePassword123"
  }'
```

### Example: Postman

1. **Method**: POST
2. **URL**: `http://localhost:5000/auth/change-password`
3. **Headers**:
   - `Content-Type`: `application/json`
   - `Authorization`: `Bearer YOUR_ACCESS_TOKEN`
4. **Body** (raw JSON):
   ```json
   {
     "oldPassword": "admin123",
     "newPassword": "MyNewSecurePassword123"
   }
   ```

### Success Response

```json
{
  "success": true,
  "message": "Password changed successfully. Please login again."
}
```

**⚠️ IMPORTANT**: After changing your password, **all your sessions are logged out** for security. You must login again with your new password.

### Error Responses

**Current password is incorrect:**
```json
{
  "error": "Current password is incorrect",
  "code": "PASSWORD_CHANGE_ERROR"
}
```

**New password doesn't meet requirements:**
```json
{
  "error": "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number",
  "code": "PASSWORD_CHANGE_ERROR"
}
```

**Not authenticated:**
```json
{
  "error": "Access denied - No authentication token provided",
  "code": "NO_TOKEN"
}
```

---

## Change Default Admin Password

When you first start the server, a default admin account is created:

```
Email: admin@aidoc.local
Username: admin
Password: admin123
```

**⚠️ SECURITY CRITICAL**: You must change this password immediately!

### Step-by-Step Guide

#### 1. Start the Backend Server

```bash
cd ai-doc-analyser-backend
npm run dev
```

You'll see:
```
✅ Default admin user created: admin@aidoc.local
   Username: admin
   Password: admin123 (CHANGE THIS!)
   API Key: aiDoc_xxxxxxxxxxxxxxxx
```

#### 2. Login as Admin

```javascript
// Login to get access token
const response = await fetch('http://localhost:5000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@aidoc.local',
    password: 'admin123'
  })
});

const data = await response.json();
const accessToken = data.accessToken;
console.log('Access Token:', accessToken);
```

**Or via cURL:**
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@aidoc.local",
    "password": "admin123"
  }'
```

#### 3. Change the Password

```javascript
// Change admin password
const changeResponse = await fetch('http://localhost:5000/auth/change-password', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    oldPassword: 'admin123',
    newPassword: 'MySecureAdminPass123!'
  })
});

const result = await changeResponse.json();
console.log(result); // { success: true, message: "Password changed successfully..." }
```

**Or via cURL:**
```bash
curl -X POST http://localhost:5000/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "oldPassword": "admin123",
    "newPassword": "MySecureAdminPass123!"
  }'
```

#### 4. Login with New Password

```javascript
// Login with new password
const newLoginResponse = await fetch('http://localhost:5000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@aidoc.local',
    password: 'MySecureAdminPass123!'
  })
});

const newData = await newLoginResponse.json();
console.log('✅ Successfully logged in with new password!');
```

---

## Password Requirements

All passwords must meet these security requirements:

- ✅ **Minimum 8 characters**
- ✅ **At least one uppercase letter** (A-Z)
- ✅ **At least one lowercase letter** (a-z)
- ✅ **At least one number** (0-9)
- ⭐ Special characters recommended but not required

### Get Requirements Programmatically

```javascript
const response = await fetch('http://localhost:5000/auth/password-requirements');
const data = await response.json();
console.log(data.requirements);
```

**Response:**
```json
{
  "success": true,
  "requirements": {
    "minLength": 8,
    "requireUppercase": true,
    "requireLowercase": true,
    "requireNumbers": true,
    "requireSpecialChars": false
  }
}
```

### Examples

**✅ Valid Passwords:**
- `SecurePass123`
- `MyPassword1`
- `Admin2024Pass`
- `Test1234Pass`
- `SuperSecret99!` (with special char)

**❌ Invalid Passwords:**
- `short1` - Too short (< 8 chars)
- `alllowercase1` - No uppercase letter
- `ALLUPPERCASE1` - No lowercase letter
- `NoNumbers` - No numbers
- `12345678` - No letters

---

## Troubleshooting

### "Current password is incorrect"

**Problem**: The old password you provided doesn't match the current password.

**Solutions**:
1. Double-check your current password
2. If forgotten, you need to:
   - Register a new account, OR
   - Reset via admin (if implemented), OR
   - Manually reset in database/in-memory storage

### "Password must contain..."

**Problem**: Your new password doesn't meet security requirements.

**Solution**: Ensure your new password has:
- At least 8 characters
- One uppercase letter (A-Z)
- One lowercase letter (a-z)
- One number (0-9)

### "Access denied - No authentication token provided"

**Problem**: You're not logged in or your token is missing.

**Solution**: Login first to get an access token:
```javascript
const loginResponse = await fetch('http://localhost:5000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'your@email.com',
    password: 'yourPassword'
  })
});

const data = await loginResponse.json();
const accessToken = data.accessToken;

// Now use this token for password change
```

### "Token expired - Please refresh your token"

**Problem**: Your access token has expired (after 15 minutes).

**Solution**: Either:
1. **Refresh your token** using the refresh token:
```javascript
const refreshResponse = await fetch('http://localhost:5000/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    refreshToken: localStorage.getItem('refreshToken')
  })
});

const newTokens = await refreshResponse.json();
// Use newTokens.accessToken for password change
```

2. **Login again** to get a fresh token

### "User not found"

**Problem**: Your user account was deleted or doesn't exist.

**Solution**: Register a new account:
```javascript
await fetch('http://localhost:5000/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'newuser@example.com',
    username: 'newuser',
    password: 'SecurePass123'
  })
});
```

---

## Security Notes

### After Password Change

When you successfully change your password:

1. ✅ **All refresh tokens are revoked** - All your active sessions are logged out
2. ✅ **You must login again** - Use your new password to get new tokens
3. ✅ **Your API key remains valid** - API key is NOT affected by password changes

### Best Practices

- 🔐 **Use strong, unique passwords** for each account
- 🔄 **Change passwords regularly** (every 3-6 months)
- 🚫 **Never share passwords** or write them down
- ✅ **Use a password manager** to generate and store secure passwords
- ⚠️ **Change immediately if compromised** - If you suspect your password is leaked

### Password Storage

- Passwords are **never stored in plain text**
- Uses **bcrypt hashing** with 12 salt rounds (industry standard)
- Passwords are **hashed one-way** - cannot be decrypted
- Even admins **cannot see your password**

---

## Complete Example: Frontend Integration

Here's a complete React component for changing passwords:

```javascript
// PasswordChangeForm.jsx
import React, { useState } from 'react';

function PasswordChangeForm() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    // Client-side validation
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      const accessToken = localStorage.getItem('accessToken');
      
      const response = await fetch('http://localhost:5000/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          oldPassword,
          newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage('✅ Password changed successfully! Please login again.');
        // Clear form
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }, 2000);
      } else {
        setError(data.error || 'Failed to change password');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    }
  };

  return (
    <div className="password-change-form">
      <h2>Change Password</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Current Password:</label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>New Password:</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
          />
          <small>At least 8 characters, include uppercase, lowercase, and numbers</small>
        </div>

        <div className="form-group">
          <label>Confirm New Password:</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        <button type="submit">Change Password</button>
      </form>
    </div>
  );
}

export default PasswordChangeForm;
```

---

## Quick Reference

| Method | Endpoint | Authentication | Purpose |
|--------|----------|----------------|---------|
| POST | `/auth/change-password` | JWT Required | Change your password |
| POST | `/auth/login` | None | Get access token |
| GET | `/auth/password-requirements` | None | Get password rules |
| POST | `/auth/refresh` | Refresh Token | Get new access token |

---

## Support

If you have issues changing your password:
1. Check the console for detailed error messages
2. Verify your access token is valid and not expired
3. Ensure your old password is correct
4. Make sure your new password meets all requirements
5. Contact support or check the logs for more details

---

**Last Updated**: January 2025  
**Security Level**: Production-Ready ✅
