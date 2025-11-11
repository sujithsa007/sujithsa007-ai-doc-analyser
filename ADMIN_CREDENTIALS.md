# 🔐 Current Admin Credentials

## Default Admin Account

When you start the server for the first time (with no existing users), a default admin account is automatically created:

```
Email:    admin@aidoc.local
Username: admin
Password: Machten@1000
Role:     admin
```

## ⚠️ Security Notice

**IMPORTANT:** This password is visible in the server startup logs. For production use:

1. **Change the password immediately** after first login
2. **Use the password change endpoint** or scripts provided
3. **Never commit** the actual password to version control

## How to Change the Admin Password

### Option 1: Using the Quick Reset Script

```bash
cd ai-doc-analyser-backend
node quickPasswordReset.js YourNewPassword123
# Then restart the server
npm run dev
```

### Option 2: Using the API Endpoint

```bash
# 1. Login first
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@aidoc.local",
    "password": "Machten@1000"
  }'

# Copy the accessToken from the response

# 2. Change password
curl -X POST http://localhost:5000/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "oldPassword": "Machten@1000",
    "newPassword": "YourNewSecurePassword123"
  }'
```

## Password Requirements

All passwords must meet these criteria:

- ✅ Minimum 8 characters
- ✅ At least one uppercase letter (A-Z)
- ✅ At least one lowercase letter (a-z)
- ✅ At least one number (0-9)
- ⭐ Special characters recommended

## Current Status

✅ **Fixed Issues:**
- Password is now correctly displayed in server logs
- Password matches the actual seeded value
- Console output shows the correct credentials
- Scripts updated to work with current password

---

**Last Updated:** January 2025  
**Current Admin Password:** `Machten@1000` (as configured in `services/userService.js`)
