import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Homepage from './pages/Homepage'
import AdminLogin from './pages/AdminLogin'
import StudentLogin from './pages/StudentLogin'
import ForgotPasswordStudent from './pages/ForgotPasswordStudent'
import ForgotPasswordAdmin from './pages/ForgotPasswordAdmin'
import ResetPasswordStudent from './pages/ResetPasswordStudent'
import ResetPasswordAdmin from './pages/ResetPasswordAdmin'
import ChangePassword from './pages/ChangePassword'
import AdminDashboard from './pages/AdminDashboard'
import StudentDashboard from './pages/StudentDashboard'
import StudentCertificates from './pages/StudentCertificates'
import StudentProfile from './pages/StudentProfile'
import AddStudent from './pages/AddStudent'
import ManageStudent from './pages/ManageStudent'
import Profile from './pages/Profile'
import IssueCertificate from './pages/IssueCertificate'
import ManageCertificates from './pages/ManageCertificates'
import ContactUs from './pages/ContactUs'
import ContactMessages from './pages/ContactMessages'
import VerifyCertificate from './pages/VerifyCertificate'
import ManageAdmins from './pages/ManageAdmins'
import AddAdmin from './pages/AddAdmin'
import StudentLogs from './pages/StudentLogs'
import AdminLogs from './pages/AdminLogs'
import CertificateLogs from './pages/CertificateLogs'
import Footer from './components/Footer'

function App() {
  return (
    <div className="app-shell">
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/forgot-password" element={<ForgotPasswordAdmin />} />
          <Route path="/admin/reset-password" element={<ResetPasswordAdmin />} />
          <Route path="/student/login" element={<StudentLogin />} />
          <Route path="/student/forgot-password" element={<ForgotPasswordStudent />} />
          <Route path="/student/reset-password" element={<ResetPasswordStudent />} />
          <Route path="/student/change-password" element={<ChangePassword />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/add-student" element={<AddStudent />} />
          <Route path="/admin/manage-student" element={<ManageStudent />} />
          <Route path="/admin/issue-certificate" element={<IssueCertificate />} />
          <Route path="/admin/manage-certificates" element={<ManageCertificates />} />
          <Route path="/admin/contact-messages" element={<ContactMessages />} />
          <Route path="/admin/profile" element={<Profile />} />
          <Route path="/admin/manage-admins" element={<ManageAdmins />} />
          <Route path="/admin/add-admin" element={<AddAdmin />} />
          <Route path="/admin/student-logs" element={<StudentLogs />} />
          <Route path="/admin/admin-logs" element={<AdminLogs />} />
          <Route path="/admin/certificate-logs" element={<CertificateLogs />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/certificates" element={<StudentCertificates />} />
          <Route path="/student/profile" element={<StudentProfile />} />
          <Route path="/verify" element={<VerifyCertificate />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
