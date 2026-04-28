# Password Reset System Documentation

## Overview
This system provides a secure password reset functionality for both students and admins with the following features:
- OTP-based verification via email
- Strong password requirements
- Real-time password strength validation
- Remember me functionality
- Separate flows for students (using enrollment number) and admins (using name)

## Features Implemented

### 1. Enhanced Login Pages
Both student and admin login pages now include:
- **Remember Me checkbox** - Saves email for future logins
- **Forgot Password link** - Initiates password reset process
- **Contact Us link** - Direct access to support
- **Removed Navbar** - Clean, focused login experience
- **Full-screen layout** - Better visual presentation

### 2. Student Password Reset Flow
1. **Forgot Password** (`/student/forgot-password`)
   - Enter enrollment number
   - System finds associated email
   - Sends 6-digit OTP to email
   - Displays masked email (e.g., ab***@example.com)

2. **Verify OTP**
   - Enter the 6-digit OTP
   - OTP valid for 10 minutes
   - Option to resend OTP
   - On success, redirected to reset password page

3. **Reset Password** (`/student/reset-password`)
   - Enter new password
   - Real-time password strength indicator
   - Visual requirements checklist:
     - ✓ At least 8 characters
     - ✓ One uppercase letter (A-Z)
     - ✓ One lowercase letter (a-z)
     - ✓ One number (0-9)
     - ✓ One special character (!@#$%^&*)
   - Password strength levels:
     - Weak (red)
     - Fair (orange/warning)
     - Good (blue/info)
     - Strong (green)
   - Confirm password must match
   - Reset button only enabled when all requirements met

### 3. Admin Password Reset Flow
1. **Forgot Password** (`/admin/forgot-password`)
   - Enter admin name (e.g., "Miko")
   - System finds associated email
   - Sends 6-digit OTP to email
   - Displays masked email

2. **Verify OTP**
   - Same as student flow

3. **Reset Password** (`/admin/reset-password`)
   - Same validation as student flow

### 4. Default Route Change
- Homepage removed
- Direct access goes to student login (`/student/login`)
- Users can switch between student and admin login from links

## Backend Implementation

### API Endpoints

#### Student Routes (`/api/student`)
- `POST /forgot-password` - Initiates password reset
  - Body: `{ enrollmentNumber: string }`
  - Returns: `{ success: true, maskedEmail: string }`

- `POST /verify-otp` - Verifies OTP code
  - Body: `{ enrollmentNumber: string, otp: string }`
  - Returns: `{ success: true, resetToken: string }`

- `POST /reset-password` - Resets password
  - Body: `{ resetToken: string, newPassword: string }`
  - Returns: `{ success: true, message: string }`

#### Admin Routes (`/api/admin`)
- `POST /forgot-password` - Initiates password reset
  - Body: `{ name: string }`
  - Returns: `{ success: true, maskedEmail: string }`

- `POST /verify-otp` - Verifies OTP code
  - Body: `{ name: string, otp: string }`
  - Returns: `{ success: true, resetToken: string }`

- `POST /reset-password` - Resets password
  - Body: `{ resetToken: string, newPassword: string }`
  - Returns: `{ success: true, message: string }`

### Security Features

1. **OTP Management**
   - 6-digit random OTP
   - 10-minute expiration
   - Stored in memory (Map structure)
   - Cleared after successful use or expiration

2. **Reset Token**
   - 32-byte cryptographic random token
   - 15-minute expiration
   - Single-use token
   - Cleared after password reset

3. **Password Validation**
   - Minimum 8 characters
   - Must contain:
     - At least one uppercase letter
     - At least one lowercase letter
     - At least one number
     - At least one special character
   - Server-side validation using regex
   - Client-side real-time validation

4. **Password Storage**
   - Bcrypt hashing (10 rounds)
   - No plaintext passwords stored

## Important Notes

### Current Implementation
The OTP is currently **logged to console** for testing purposes. In the production environment, you should:

1. **Install nodemailer**
   ```bash
   cd server
   npm install nodemailer
   ```

2. **Configure Email Service**
   Create a file `server/services/emailService.js`:
   ```javascript
   const nodemailer = require('nodemailer');
   
   const transporter = nodemailer.createTransport({
     service: 'gmail', // or your email service
     auth: {
       user: process.env.EMAIL_USER,
       pass: process.env.EMAIL_PASSWORD
     }
   });
   
   async function sendOTPEmail(toEmail, otp, name) {
     const mailOptions = {
       from: process.env.EMAIL_USER,
       to: toEmail,
       subject: 'Password Reset OTP - IHECVS',
       html: \`
         <h2>Password Reset Request</h2>
         <p>Hello ${name},</p>
         <p>Your OTP for password reset is:</p>
         <h1 style="color: #0b4a6f; letter-spacing: 5px;">${otp}</h1>
         <p>This OTP is valid for 10 minutes.</p>
         <p>If you didn't request this, please ignore this email.</p>
       \`
     };
     
     return transporter.sendMail(mailOptions);
   }
   
   module.exports = { sendOTPEmail };
   ```

3. **Update .env file**
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   ```

4. **Update Controllers**
   - Import the email service in both controllers
   - Uncomment the sendOTPEmail calls

### Production Considerations

1. **OTP Storage**
   - Current: In-memory Map (resets on server restart)
   - Production: Use Redis or database table with TTL

2. **Rate Limiting**
   - Implement rate limiting to prevent OTP spam
   - Limit attempts per IP/user

3. **Logging**
   - Remove console.log for OTPs
   - Implement proper logging service

4. **Database Changes**
   - Consider adding `password_reset_tokens` table
   - Track reset attempts and history

## Testing the System

### Student Reset Flow
1. Go to `/student/login`
2. Click "Forgot Password?"
3. Enter enrollment number (must exist in database)
4. Check console for OTP (in development)
5. Enter OTP on verification page
6. Create new strong password
7. Login with new password

### Admin Reset Flow
1. Go to `/admin/login`
2. Click "Forgot Password?"
3. Enter admin name (e.g., "Miko")
4. Check console for OTP (in development)
5. Enter OTP on verification page
6. Create new strong password
7. Login with new password

## UI/UX Improvements

1. **Password Strength Indicator**
   - Color-coded feedback (red/yellow/blue/green)
   - Real-time validation
   - Visual checklist of requirements

2. **Error Handling**
   - Clear error messages
   - Helpful feedback for users
   - Guidance on what to do next

3. **Responsive Design**
   - Works on all screen sizes
   - Consistent styling with existing pages
   - Bootstrap-based layout

4. **Navigation**
   - Easy switching between student/admin login
   - Back to login links on all password reset pages
   - Contact us always accessible

## Files Modified/Created

### Frontend
- ✅ `client/src/App.jsx` - Added new routes, removed homepage
- ✅ `client/src/pages/StudentLogin.jsx` - Enhanced with remember me, forgot password
- ✅ `client/src/pages/AdminLogin.jsx` - Enhanced with remember me, forgot password
- ✅ `client/src/pages/ForgotPasswordStudent.jsx` - New file
- ✅ `client/src/pages/ForgotPasswordAdmin.jsx` - New file
- ✅ `client/src/pages/ResetPasswordStudent.jsx` - New file
- ✅ `client/src/pages/ResetPasswordAdmin.jsx` - New file

### Backend
- ✅ `server/routes/studentRoutes.js` - Added password reset routes
- ✅ `server/routes/adminRoutes.js` - Added password reset routes
- ✅ `server/controllers/studentController.js` - Added forgot/verify/reset functions
- ✅ `server/controllers/adminController.js` - Added forgot/verify/reset functions

## Next Steps

1. Install and configure nodemailer for email sending
2. Set up email service credentials in .env
3. Test with real email delivery
4. Implement rate limiting
5. Add Redis for OTP storage (optional but recommended)
6. Monitor and log password reset attempts
7. Consider adding SMS OTP as alternative (optional)
