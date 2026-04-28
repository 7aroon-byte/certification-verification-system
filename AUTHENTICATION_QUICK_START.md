# IHECVS Student Account Creation - Quick Start Guide

## For System Administrators

### Creating a New Student Account

#### Step 1: Access Admin Dashboard
1. Login to the admin panel with admin credentials
2. Navigate to "Add Student" or "Manage Students" section

#### Step 2: Fill Student Information
Provide the following information:
- **Full Name:** Student's complete name
- **Email Address:** Valid email address where credentials will be sent
- **Enrollment Number:** Unique student identifier (e.g., 2023CSC001)
- **Status:** Active or Inactive (default: Active)

#### Step 3: Submit Form
Click "Create Student Account"

**The system will automatically:**
1. Generate temporary password: `IHECVS{EnrollmentNumber}`
   - Example: `IHECVS2023CSC001`
2. Hash the password securely
3. Create student account
4. Send email with login credentials

#### Step 4: Email Notification
Student receives email containing:
- System name: "Imamu Hafsin e-Certificate Verification System (IHECVS)"
- Login URL
- Enrollment number (to use as username)
- Temporary password
- Instructions to change password on first login

---

## For Students - First Login Instructions

### Your Account Has Been Created

When you receive your account creation email:

#### Step 1: Open Email
- Look for email from: Certificate System
- Subject: "Welcome to IHECVS - Account Created"

#### Step 2: Note Your Credentials
From the email, copy:
- **Username:** Your enrollment number
- **Temporary Password:** `IHECVS` + your enrollment number

#### Step 3: Login
1. Visit login page
2. Enter Email OR Enrollment Number: `(your enrollment number)`
3. Enter Password: `(temporary password from email)`
4. Click "Sign In"

**Important:** You CANNOT use your email as username. Use your enrollment number.

#### Step 4: Change Your Password
You will be automatically redirected to "Change Your Password" page.

This is **mandatory** - you cannot skip this step.

### Set Your New Password

**Password Requirements:**
- ✓ Minimum 8 characters
- ✓ At least ONE uppercase letter (A-Z)
- ✓ At least ONE number (0-9)
- ✓ At least ONE special character (!@#$%^&*()_+-=[]{};\':"|,.<>/?)

**Example of Strong Password:** `MyPass2024!`

**Steps:**
1. Enter your new password
2. Watch the strength indicator update in real-time
3. Verify all requirements are met (shown as checkmarks)
4. Confirm your password by re-entering it
5. Click "Change Password"

**After Success:**
- You'll see "Password changed successfully!"
- Automatically redirected to your dashboard
- Full access to certificate features enabled

---

## Password Change Rules

### On First Login
- Current password field: **NOT REQUIRED**
- New password must meet security requirements
- After changing, you cannot revert to temporary password

### After First Login
To change your password later:
1. Go to Profile section
2. Click "Change Password"
3. **Current password REQUIRED** for verification
4. Enter new password
5. Must meet same security requirements

### Security Notes
- Passwords are encrypted and never stored in plain text
- Never share your password with anyone
- Change your password regularly for security
- If you forget your password, use "Forgot Password" option

---

## Troubleshooting

### "Invalid Credentials" Error
**Possible Causes:**
- Using email instead of enrollment number as username
- Typo in enrollment number or password
- Email address used instead of enrollment number

**Solution:**
- Use your enrollment number (e.g., 2023CSC001) as username
- Copy password exactly from email (case-sensitive)
- Clear browser cache and try again

### Email Not Received
**Possible Causes:**
- Email in spam/junk folder
- Incorrect email address used during account creation
- SMTP service not configured properly

**Solution:**
- Check spam/junk folder
- Request admin to verify email address
- Ask admin to resend email notification

### Password Doesn't Meet Requirements
**Possible Causes:**
- Password less than 8 characters
- Missing uppercase letter
- Missing number
- Missing special character

**Solution:**
- Ensure password has ALL requirements
- Use password strength indicator on form
- Example: `Secure2024!`

### Cannot Access Dashboard After Password Change
**Possible Causes:**
- Browser didn't complete redirect
- Cached login page still showing

**Solution:**
- Clear browser cache and cookies
- Log out completely
- Log back in with your new password

---

## Security Best Practices

### Password Security
1. **Create Strong Password:** Use mix of upper, lower, numbers, special characters
2. **Unique Password:** Don't use same password as other accounts
3. **Secure Storage:** Don't write password on paper or shared documents
4. **Regular Changes:** Change password every 90 days
5. **Never Share:** Never give password to anyone, including administrators

### Account Security
1. **Logout:** Always logout when finished
2. **Public Computers:** Never login from public/shared computers
3. **Suspicious Activity:** Report unauthorized access immediately
4. **Secure Connection:** Only access system over HTTPS
5. **Browser Updates:** Keep browser and OS updated

### Email Security
1. **Verify Sender:** Check email is from system domain
2. **Don't Forward:** Don't forward credentials to others
3. **Delete Email:** Delete account creation email after setting password
4. **Secure Email:** Use secure email account with strong password

---

## Account Administration

### Resetting a Student's Password
If a student forgets their password:

1. Do NOT reset to original temporary password
2. Direct student to "Forgot Password" page
3. Student will receive OTP via email
4. Student can set new password themselves

### Disabling Student Account
To disable a student account:
1. Go to Manage Students
2. Find student by name or enrollment number
3. Change Status to "Inactive"
4. Student can no longer login

### Updating Student Information
After account creation:
1. Go to Manage Students
2. Search for student
3. Update name, email, or status
4. Changes take effect immediately
5. Note: Enrollment number cannot be changed after creation

---

## System Requirements

### For Administrators
- Web browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- Admin account credentials
- Access to student roster/information

### For Students
- Web browser (Chrome, Firefox, Safari, Edge)
- Email access for account setup
- Internet connection
- Valid enrollment number

### Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## Additional Resources

### Help & Support
- System Administrator: [Admin Contact]
- Technical Support: [Support Email]
- Documentation: [Documentation URL]

### Related Features
- View Certificates: Access issued certificates
- Download Certificates: Save certificates as PDF
- Share Certificate: Generate shareable links
- Verify Certificate: Check authenticity of certificates

---

## FAQ

**Q: Can I use my email as username for login?**
A: No. Use your enrollment number as username.

**Q: Is the temporary password case-sensitive?**
A: Yes. Example: `IHECVS2023CSC001` - copy exactly.

**Q: Can I keep the temporary password?**
A: No. You must change it on first login. This is mandatory.

**Q: What if I don't receive the account creation email?**
A: Check spam folder, verify email address with admin, or ask admin to resend.

**Q: How do I change my password after first login?**
A: Go to Profile > Change Password, verify current password, enter new password.

**Q: What happens if I forget my new password?**
A: Click "Forgot Password" on login page and follow password reset instructions.

**Q: Can I have the same password as before?**
A: No. The system won't allow reusing recent passwords for security.

**Q: How often should I change my password?**
A: Every 90 days for security best practice.

**Q: Can administrators see my password?**
A: No. Passwords are encrypted and administrators cannot see them.

**Q: What if I lock my account with wrong passwords?**
A: After 5 failed attempts, contact administrator to unlock account.

---

## Implementation Checklist

### Before Launch
- [ ] Database migration executed (`add_first_login_flag.sql`)
- [ ] SMTP email configuration verified
- [ ] Public base URL configured in `.env`
- [ ] Backend server restarted
- [ ] Frontend built and deployed
- [ ] Test account created and email received
- [ ] First login and password change flow tested
- [ ] Email templates reviewed for branding

### After Launch
- [ ] Admin trained on new account creation process
- [ ] Student documentation distributed
- [ ] Helpdesk briefed on new system
- [ ] Monitor email delivery success rate
- [ ] Collect user feedback on password change process
- [ ] Verify all created accounts have `is_first_login` flag
- [ ] Test password reset functionality
- [ ] Regular security audits scheduled

---

**Last Updated:** January 13, 2026  
**System:** Imamu Hafsin e-Certificate Verification System (IHECVS)  
**Version:** 1.0
