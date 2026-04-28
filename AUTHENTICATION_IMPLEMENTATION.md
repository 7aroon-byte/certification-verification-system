# IHECVS Student Authentication & Onboarding Implementation Guide

## Overview

This document describes the comprehensive authentication and user onboarding system implemented for the Imamu Hafsin e-Certificate Verification System (IHECVS). The system ensures secure student account creation, forced password change on first login, and secure password management.

---

## System Architecture

### Components Implemented

1. **Backend**
   - Database schema updates
   - Password validation utility
   - Updated service layer (useService)
   - Enhanced controllers (adminController, studentController)
   - Email notification system
   - Updated routes

2. **Frontend**
   - ChangePassword page component
   - Updated StudentLogin page
   - Route configuration in App.jsx
   - Styling for password change UI

---

## Detailed Implementation

### 1. Database Schema Updates

**File:** `server/sql/add_first_login_flag.sql`

A new boolean column `is_first_login` has been added to the `students` table to track whether a student has completed their first mandatory password change.

```sql
ALTER TABLE students ADD COLUMN is_first_login BOOLEAN DEFAULT true;
```

**Status Tracking:**
- `is_first_login = true`: Student must change password on next login
- `is_first_login = false`: Student has completed password setup

### 2. Password Validation Utility

**File:** `server/utils/passwordValidator.js`

Provides three main functions for password management:

#### `generateTemporaryPassword(enrollmentNumber)`
Generates temporary passwords in the format: `IHECVS<EnrollmentNumber>`

Example:
```javascript
generateTemporaryPassword("2023CSC001")  // Returns: "IHECVS2023CSC001"
```

#### `validatePassword(password)`
Validates password against security requirements:
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one number (0-9)
- At least one special character (!@#$%^&*()_+-=[]{};\':"|,.<>/?)

Returns: `{ isValid: boolean, errors: string[] }`

#### `getPasswordStrength(password)`
Provides real-time password strength feedback with:
- Strength score (0-100)
- Strength label (Weak, Fair, Good, Strong)
- Detailed feedback messages

### 3. Service Layer Updates

**File:** `server/services/useService.js`

#### New Methods Added:

**`findStudentByEnrollmentNumber(enrollmentNumber)`**
- Finds student by enrollment number
- Returns student object including `is_first_login` flag

**Updated `findStudentByEmail(email)`**
- Now includes `is_first_login` flag in response

**Updated `createStudent()`**
- Now accepts `isFirstLogin` parameter (defaults to `true`)
- Automatically sets flag for new accounts

**Updated `updateStudent()`**
- Now supports updating `is_first_login` flag
- Used to mark password change completion

### 4. Email Service Enhancements

**File:** `server/services/emailService.js`

**New Function: `sendStudentAccountEmail()`**

Sends professional HTML email to newly created students with:
- System name: "Imamu Hafsin e-Certificate Verification System (IHECVS)"
- Login URL
- Enrollment number (username)
- Temporary password
- First login instructions
- Security reminders
- Instructions for password change requirements

**Email Template Features:**
- Professional HTML design with gradient header
- Clear credentials display
- Highlighted security warnings
- Step-by-step login instructions
- Responsive design for mobile/desktop

### 5. Admin Controller Updates

**File:** `server/controllers/adminController.js`

**Enhanced `createStudent()` Function:**

```javascript
POST /api/admin/students
Request Body: {
  name: string,
  email: string,
  enrollmentNumber: string,
  status?: string (default: "active")
}
```

**Process:**
1. Validates required fields (name, email, enrollmentNumber)
2. Checks for duplicate email and enrollment number
3. Generates temporary password: `IHECVS{enrollmentNumber}`
4. Hashes password with bcrypt (10 rounds)
5. Creates student account with `is_first_login = true`
6. Sends account creation email with credentials
7. Returns success response with account details

**Response:**
```json
{
  "success": true,
  "message": "Student account created successfully. Account credentials have been sent to the student email address.",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "enrollmentNumber": "2023CSC001",
    "status": "active",
    "isFirstLogin": true
  }
}
```

### 6. Student Controller Updates

**File:** `server/controllers/studentController.js`

#### Updated `login()` Function:

Now returns `isFirstLogin` flag in login response:

```json
{
  "success": true,
  "data": {
    "token": "...",
    "isFirstLogin": true
  }
}
```

The frontend uses this flag to redirect students to the Change Password page.

#### New `changePassword()` Function:

```javascript
POST /api/student/change-password
Headers: { Authorization: "Bearer <token>" }
Request Body: {
  currentPassword?: string,  // Optional on first login
  newPassword: string,
  confirmPassword: string
}
```

**Behavior:**
- On first login: `currentPassword` not required
- After first login: `currentPassword` required for verification
- Validates password meets all security requirements
- Updates password hash in database
- Sets `is_first_login = false` upon success
- Returns success message with redirect instruction

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully. You can now access the system normally.",
  "isFirstLogin": false
}
```

#### Updated `getMe()` Function:

Now includes `isFirstLogin` flag in user profile:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "enrollmentNumber": "2023CSC001",
    "isFirstLogin": true
  }
}
```

### 7. Routes Configuration

**File:** `server/routes/studentRoutes.js`

**New Route Added:**
```javascript
POST /api/student/change-password
  - Middleware: authMiddleware, requireRole('student')
  - Controller: studentController.changePassword
```

### 8. Frontend Implementation

#### ChangePassword Page Component

**File:** `client/src/pages/ChangePassword.jsx`

**Features:**
- Responsive design with gradient background
- Real-time password strength indicator
- Visual feedback for all password requirements
- Password visibility toggles
- Support for both first-login and regular password change
- Automatic redirect to dashboard on success
- Comprehensive error handling

**Password Strength Indicator:**
- Visual progress bar with color coding
- Requirement checklist with real-time validation
- "Weak", "Fair", "Good", "Strong" labels
- Matches confirmation password validation

**Styling:**
- Modern UI with gradient design
- Dark mode support
- Mobile responsive
- Accessibility features

#### StudentLogin Page Updates

**File:** `client/src/pages/StudentLogin.jsx`

Updated to check `isFirstLogin` flag and redirect:
- If `isFirstLogin === true`: Redirect to `/student/change-password`
- Otherwise: Redirect to `/student/dashboard`

#### Route Configuration

**File:** `client/src/App.jsx`

Added new route:
```javascript
<Route path="/student/change-password" element={<ChangePassword />} />
```

#### Styling

**File:** `client/src/styles/ChangePassword.css`

Comprehensive styles including:
- Container and card layouts
- Form inputs and buttons
- Password strength indicator
- Requirements checklist
- Alert messages (error/success)
- Dark mode support
- Mobile responsive design

---

## Complete Flow Diagram

### First-Time Student Onboarding Flow

```
1. Admin Creates Student Account
   ├─ Provides: name, email, enrollmentNumber
   └─ System generates: IHECVS{enrollmentNumber} as temporary password

2. Account Creation Process
   ├─ Hash temporary password
   ├─ Create student with is_first_login = true
   └─ Send email with credentials

3. Student Receives Email
   └─ Contains: login URL, enrollment number, temporary password

4. Student First Login
   ├─ Login with enrollment number (username) + temporary password
   ├─ System returns isFirstLogin = true
   └─ Frontend redirects to /student/change-password

5. Change Password Page
   ├─ Current password field HIDDEN (first login)
   ├─ Student enters new password
   ├─ Real-time validation shows requirements
   └─ Password must meet all criteria to proceed

6. Password Update
   ├─ Backend validates new password
   ├─ Updates password_hash in database
   ├─ Sets is_first_login = false
   └─ Returns success

7. Normal Access
   ├─ Student redirected to dashboard
   └─ Full system access granted

8. Future Password Changes
   ├─ Profile > Change Password
   ├─ Requires current password verification
   └─ Same validation rules apply
```

---

## API Endpoints Summary

### Admin Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/admin/students` | Create new student account |

### Student Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/student/login` | Login with email/password |
| POST | `/api/student/change-password` | Change password (first-login or regular) |
| GET | `/api/student/me` | Get current student profile |

---

## Security Considerations

### Password Security
1. **Hashing:** bcrypt with 10 rounds (configurable)
2. **Validation:** Client-side and server-side
3. **Requirements:**
   - Minimum 8 characters
   - Mixed case (upper + lower)
   - Numeric character
   - Special character
   - No password reuse allowed

### First Login Protection
1. **Forced Password Change:** Cannot bypass on first login
2. **Temporary Password:** Single-use, expires after login
3. **Database Flag:** Tracks completion status

### Email Security
1. **SMTP Configuration:** Via environment variables
2. **Sensitive Data:** Password only shown once in email
3. **Password Not Logged:** Never appears in system logs

### Session Management
1. **Token-based:** JWT stored in localStorage
2. **Auto-redirect:** 401 errors redirect to login
3. **Role-based:** Endpoints protected with role middleware

---

## Environment Configuration

**Required Variables in `.env`:**
```
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_NAME=Certificate System
SMTP_FROM_EMAIL=your-email@gmail.com

# Base URL for login links in emails
PUBLIC_BASE_URL=http://localhost:5000
```

---

## Testing Checklist

### Backend Testing
- [ ] Password validation utility validates all requirements
- [ ] Temporary password generated in correct format
- [ ] Admin can create student with auto-generated password
- [ ] Email sent successfully with credentials
- [ ] Student login returns `isFirstLogin` flag
- [ ] Change password endpoint validates new password
- [ ] Database updated correctly after password change
- [ ] `is_first_login` flag set to false after change

### Frontend Testing
- [ ] StudentLogin redirects to ChangePassword when `isFirstLogin = true`
- [ ] ChangePassword page displays correctly
- [ ] Password strength indicator updates in real-time
- [ ] All requirements show visual feedback
- [ ] Current password field hidden on first login
- [ ] Current password required after first login
- [ ] Passwords must match to submit
- [ ] Success message displays after change
- [ ] Redirect to dashboard occurs automatically
- [ ] Mobile responsive layout works correctly

### Integration Testing
1. **Full Onboarding Flow**
   ```
   1. Admin: Create new student
   2. Student: Check email for credentials
   3. Student: Login with temporary password
   4. System: Redirect to change password
   5. Student: Enter new password
   6. System: Validate and update
   7. Student: Redirected to dashboard
   8. Student: Full access to system
   ```

2. **Regular Password Change**
   ```
   1. Student: Login normally
   2. Student: Navigate to profile
   3. Student: Click "Change Password"
   4. Student: Enter current password
   5. Student: Enter new password
   6. System: Validate and update
   7. Confirm: Success message
   ```

---

## Deployment Steps

### 1. Database Migration
```bash
# Execute the SQL migration to add is_first_login column
mysql -u root -p certificatesystem < server/sql/add_first_login_flag.sql
```

### 2. Backend Deployment
- Ensure Node.js dependencies are installed
- Update `.env` with SMTP configuration
- Restart backend server

### 3. Frontend Deployment
- Ensure React dependencies are installed
- Build frontend: `npm run build`
- Deploy to static host or serve from backend

### 4. Testing
- Run complete onboarding flow
- Test password validation
- Test email delivery
- Verify database updates

---

## File Summary

### Backend Files Modified/Created
1. `server/sql/add_first_login_flag.sql` - NEW
2. `server/utils/passwordValidator.js` - NEW
3. `server/services/useService.js` - UPDATED
4. `server/services/emailService.js` - UPDATED
5. `server/controllers/adminController.js` - UPDATED
6. `server/controllers/studentController.js` - UPDATED
7. `server/routes/studentRoutes.js` - UPDATED

### Frontend Files Modified/Created
1. `client/src/pages/ChangePassword.jsx` - NEW
2. `client/src/styles/ChangePassword.css` - NEW
3. `client/src/pages/StudentLogin.jsx` - UPDATED
4. `client/src/App.jsx` - UPDATED

---

## Troubleshooting

### Issue: Email not sending
**Solution:**
- Verify SMTP credentials in `.env`
- Check email service provider restrictions
- For Gmail: Use app-specific password (not account password)
- Enable less secure apps if using older email provider

### Issue: Password validation too strict
**Solution:**
- Edit `passwordValidator.js` to adjust requirements
- Modify regex patterns in validation logic
- Update frontend requirements checklist to match

### Issue: Student not redirected to change password
**Solution:**
- Verify `isFirstLogin` returned in login response
- Check localStorage token is being saved
- Verify ChangePassword route exists in App.jsx
- Check browser console for errors

### Issue: is_first_login not in database
**Solution:**
- Run migration script: `add_first_login_flag.sql`
- Verify column exists: `DESCRIBE students;`
- Restart backend server after migration

---

## Future Enhancements

1. **Password History:** Prevent reuse of last N passwords
2. **Password Expiration:** Require periodic password changes
3. **Two-Factor Authentication:** Add 2FA for enhanced security
4. **Password Recovery:** SMS-based password recovery
5. **Session Timeout:** Auto-logout after inactivity
6. **Login Attempts:** Rate limiting on failed logins
7. **Audit Logging:** Track all password changes

---

## Support & Documentation

For questions or issues:
1. Review this implementation guide
2. Check error messages in browser/server console
3. Verify database schema matches requirements
4. Test with provided test cases
5. Review email configuration

---

**Implementation Date:** January 13, 2026  
**System:** Imamu Hafsin e-Certificate Verification System (IHECVS)  
**Version:** 1.0
