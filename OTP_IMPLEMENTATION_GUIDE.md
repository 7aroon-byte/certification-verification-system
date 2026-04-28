# OTP Forgot Password System - Implementation Guide

## Overview
Complete implementation of secure forgot password flow with OTP email verification for Admin and Student users.

## Features Implemented

### 1. Admin Flow
- **Request OTP**: Admin enters full name → System finds admin → Sends OTP to registered email
- **Verify OTP**: Admin enters 6-digit OTP → System validates → Issues reset token
- **Reset Password**: Admin creates new password with strength validation

### 2. Student Flow  
- **Request OTP**: Student enters enrollment number OR full name → System finds student → Sends OTP to registered email
- **Verify OTP**: Student enters 6-digit OTP → System validates → Issues reset token
- **Reset Password**: Student creates new password with strength validation

### 3. Security Features
- ✅ OTP expires in 2 minutes
- ✅ Single-use OTP (deleted after verification)
- ✅ Rate limiting: max 5 OTP verification attempts
- ✅ Reset token hashed with SHA-256 (expires in 15 minutes)
- ✅ Password hashed with bcrypt (cost factor 12)
- ✅ Email masking for privacy
- ✅ Secure password validation (8+ chars, upper, lower, digit, special char)

## SMTP Configuration

Add these to `server/.env`:

```env
# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com          # Or your SMTP provider
SMTP_PORT=587                      # 587 for TLS, 465 for SSL
SMTP_SECURE=false                  # true for port 465, false for 587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password        # Use app password for Gmail
SMTP_FROM_NAME=Certificate System
SMTP_FROM_EMAIL=your-email@gmail.com
```

### Gmail Setup Instructions
1. Go to Google Account settings
2. Enable 2-Factor Authentication
3. Generate App Password: Account → Security → App passwords
4. Use that app password as `SMTP_PASS`

### Alternative SMTP Providers
- **SendGrid**: `smtp.sendgrid.net:587` (use API key as password)
- **Mailgun**: `smtp.mailgun.org:587`
- **Outlook**: `smtp.office365.com:587`

## API Endpoints

### Admin Endpoints

#### 1. Request OTP
```http
POST /api/admin/forgot-password
Content-Type: application/json

{
  "name": "Admin Full Name"
}

Response:
{
  "success": true,
  "message": "OTP sent to your registered email address",
  "maskedEmail": "ad***@example.com"
}
```

#### 2. Verify OTP
```http
POST /api/admin/verify-otp
Content-Type: application/json

{
  "name": "Admin Full Name",
  "otp": "123456"
}

Response:
{
  "success": true,
  "message": "OTP verified successfully",
  "resetToken": "hex-token-string"
}
```

#### 3. Reset Password
```http
POST /api/admin/reset-password
Content-Type: application/json

{
  "resetToken": "hex-token-string",
  "newPassword": "NewSecure123!"
}

Response:
{
  "success": true,
  "message": "Password reset successfully"
}
```

### Student Endpoints

#### 1. Request OTP
```http
POST /api/student/forgot-password
Content-Type: application/json

// Option A: By enrollment number
{
  "enrollmentNumber": "2024001"
}

// Option B: By name
{
  "name": "Student Full Name"
}

Response:
{
  "success": true,
  "message": "OTP sent to your registered email address",
  "maskedEmail": "st***@example.com",
  "identifier": "2024001"
}
```

#### 2. Verify OTP
```http
POST /api/student/verify-otp
Content-Type: application/json

{
  "identifier": "2024001",  // enrollment number or name used
  "otp": "123456"
}

Response:
{
  "success": true,
  "message": "OTP verified successfully",
  "resetToken": "hex-token-string"
}
```

#### 3. Reset Password
```http
POST /api/student/reset-password
Content-Type: application/json

{
  "resetToken": "hex-token-string",
  "newPassword": "NewSecure123!"
}

Response:
{
  "success": true,
  "message": "Password reset successfully"
}
```

## Database Requirements

### Admin Table
```sql
-- admin table should have:
- id (primary key)
- name (varchar)
- email (varchar, unique)
- password_hash (varchar)
- role (varchar, default 'admin')
```

### Students Table
```sql
-- students table should have:
- id (primary key)
- name (varchar)
- email (varchar, unique)
- enrollment_number (varchar, unique)
- password_hash (varchar)
```

## Error Handling

The system returns clear error messages for:

1. **User Not Found**: 404 status
2. **Invalid OTP**: 400 status with remaining attempts
3. **Expired OTP**: 400 status
4. **Too Many Attempts**: 429 status
5. **Email Sending Failed**: 500 status
6. **Invalid Reset Token**: 400 status
7. **Weak Password**: 400 status with requirements

## Testing

### 1. Create Test Admin
```bash
cd server
node utils/seedAdmin.js
```
This creates admin: name="Miko", email="miko@example.com", password="Admin123!"

### 2. Test Flow
1. Navigate to `/admin/forgot-password` or `/student/forgot-password`
2. Enter name (admin) or enrollment/name (student)
3. Check email for OTP (also logged in server console)
4. Enter OTP within 2 minutes
5. Set new password (must meet strength requirements)
6. Login with new password

### 3. Check Server Logs
```
[ADMIN OTP] Generated for Miko: 123456 (expires in 2 min)
[ADMIN OTP] Verified successfully for Miko
[ADMIN] Password reset successfully for Miko
✓ OTP email sent to miko@example.com
```

## Security Best Practices Applied

1. **OTP Storage**: In-memory Map (use Redis in production)
2. **Token Hashing**: SHA-256 for reset tokens
3. **Password Hashing**: bcrypt with cost factor 12
4. **Rate Limiting**: Max 5 verification attempts
5. **Short Expiry**: OTP expires in 2 min, reset token in 15 min
6. **Single-Use**: OTP/token deleted after successful use
7. **Email Masking**: Only partial email shown to user
8. **HTTPS Required**: Always use HTTPS in production

## Production Recommendations

1. **Use Redis for OTP Storage**:
   ```javascript
   const Redis = require('ioredis');
   const redis = new Redis(process.env.REDIS_URL);
   // Store OTP: redis.setex(key, 120, JSON.stringify(data))
   ```

2. **Add Rate Limiting**:
   ```javascript
   const rateLimit = require('express-rate-limit');
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 5
   });
   app.use('/api/*/forgot-password', limiter);
   ```

3. **Remove Console Logs**: Delete OTP logging statements

4. **Use Environment-specific SMTP**: Different SMTP for dev/prod

5. **Monitor Email Failures**: Log to error tracking service

6. **Add CAPTCHA**: Prevent automated OTP requests

## Files Modified

- `server/services/emailService.js` - Email sending with templates
- `server/controllers/adminController.js` - Admin OTP flow
- `server/controllers/studentController.js` - Student OTP flow
- `client/src/pages/ForgotPasswordAdmin.jsx` - Admin UI with countdown
- `client/src/pages/ForgotPasswordStudent.jsx` - Student UI

## Support

If OTP emails aren't being received:
1. Check SMTP credentials in `.env`
2. Check server console for email errors
3. Verify email isn't in spam
4. Test SMTP with: `nodemailer` test account
5. Check firewall/network allows SMTP port

---

**System is now ready for testing!** Configure SMTP and restart the server.
