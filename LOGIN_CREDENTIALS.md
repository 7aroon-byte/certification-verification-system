# Certificate Verification System - Login Credentials

## System Status
✅ **Backend**: Running on `http://localhost:5000`  
✅ **Frontend**: Running on `http://localhost:5173`  
✅ **Database**: MySQL `certificatesystem`

---

## Admin Account

**Email**: `s7afiu7aroon@gmail.com`  
**Password**: `Admin123!`  
**Login URL**: `http://localhost:5173/admin/login`

---

## Student Accounts (Password: `Student123!`)

| # | Name | Email | Password |
|---|------|-------|----------|
| 1 | AISHATU MUHAMMAD BABA | Muhammadaishababa@icloud.com | Student123! |
| 2 | SAFIYYA NASIR | safiyyanasir001@gmail.com | Student123! |
| 3 | HUZAIFA SHAFIU HARUNA | Mikohuzaifashafiu@gmail.com | Student123! |
| 4 | MAHMUD MUHAMMAD TAHIR | mahmudmuhammadtahir2004@gmail.com | Student123! |
| 5 | MUHAMMAD AUWAL | auwaldasukee@gmail.com | Student123! |
| 6 | FATIMA ABUBAKAR SUNUSI | fatimaabubakar4635@gmail.com | Student123! |
| 7 | UMMU-SALMA MUHAMMAD | salmerhabdullahi65@gmail.com | Student123! |
| 8 | FAUZIYYA HASSAN DANTIYE | fauzydantiye@gmail.com | Student123! |
| 9 | USMAN SALIS IBRAHIM | Usmansalis85@gmail.com | Student123! |
| 10 | HAFIZ MUHAMMAD BABA | hafeezmuhammadbaba@gmail.com | Student123! |
| 11 | Safiyya Shafiu Haruna | Safiyyashafiu87@gmail.com | Student123! |
| 12 | Abdulmumin Alhassan | abdullbbj340@gmail.com | Student123! |

**Student Login URL**: `http://localhost:5173/student/login`

---

## Recent Fixes Applied

1. ✅ **Database Schema**: Created `init_database.sql` with proper table definitions
2. ✅ **Database Setup**: Run `npm run setup` to initialize database and seed admin account
3. ✅ **Admin Authentication**: Working (200 OK responses confirmed)
4. ✅ **Student Passwords**: Reset all 12 students to `Student123!`
5. ✅ **Student Login Fix**: Removed fallback to non-existent `users` table
6. ✅ **Debug Logging**: Added request and authentication logging

---

## Troubleshooting

If you encounter any issues:

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Ensure servers are running**:
   - Backend: `node c:\Users\ASUS\certification-verification-system\server\app.js`
   - Frontend: `cd c:\Users\ASUS\certification-verification-system\client && npm run dev`
3. **Check browser console** (F12) for detailed error messages
4. **Check server logs** for authentication attempts

---

## Key Files Modified

- `server/.env` - Environment configuration
- `server/config/db.js` - Database connection
- `server/app.js` - Express server setup with logging
- `server/controllers/adminController.js` - Admin authentication
- `server/controllers/studentController.js` - Student authentication
- `server/services/useService.js` - User query functions
- `client/src/pages/AdminLogin.jsx` - Admin login UI
- `client/src/pages/StudentLogin.jsx` - Student login UI

---

## Commands Reference

**Setup Database**:
```bash
cd c:\Users\ASUS\certification-verification-system\server
node setup.js
```

**Reset Student Passwords**:
```bash
node resetStudentPasswords.js
```

**Start Backend**:
```bash
node c:\Users\ASUS\certification-verification-system\server\app.js
```

**Start Frontend**:
```bash
cd c:\Users\ASUS\certification-verification-system\client
npm run dev
```

---

Generated: February 21, 2026
