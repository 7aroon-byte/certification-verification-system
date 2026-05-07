import React, { useEffect, useState } from 'react'
import api from '../services/api'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'

export default function AdminDashboard(){
  const [users, setUsers] = useState([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [roleToCreate, setRoleToCreate] = useState('student')

  // Load students and certificates, then calculate metrics

  // Dashboard metrics
  const [totalStudents, setTotalStudents] = useState(0)
  const [activeStudents, setActiveStudents] = useState(0)
  const [inactiveStudents, setInactiveStudents] = useState(0)
  const [suspendedStudents, setSuspendedStudents] = useState(0)
  const [certificatesIssued, setCertificatesIssued] = useState(0)
  const [certificatesRevoked, setCertificatesRevoked] = useState(0)
  const [recentActivities, setRecentActivities] = useState([])
  const [certificates, setCertificates] = useState([])
  const [verificationAnalytics, setVerificationAnalytics] = useState({
    verificationsToday: 0,
    verificationsMonth: 0,
    visitorsToday: 0,
    visitorsMonth: 0,
    uniqueVisitorsToday: 0,
    uniqueVisitorsMonth: 0,
    validAttempts: 0,
    invalidAttempts: 0,
    mostVerifiedCertificate: null,
  })

  function formatActivityDate(value) {
    if (!value) return 'N/A'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return 'N/A'
    return `${parsed.toLocaleDateString()} ${parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  }

  // Load students and certificates, then calculate metrics
  async function loadDashboardMetrics() {
    try {
      // Fetch students
      const studentsRes = await api.get('/admin/users');
      const students = studentsRes.data.data || [];
      setUsers(students);

      setTotalStudents(students.length);
      setActiveStudents(students.filter(s => s.status === 'active').length);
      setInactiveStudents(students.filter(s => s.status === 'inactive').length);
      setSuspendedStudents(students.filter(s => s.status === 'suspended').length);

      // Fetch certificates
      const certsRes = await api.get('/admin/certificates');
      const certs = certsRes.data.data || [];
      setCertificates(certs);
      setCertificatesIssued(certs.filter(c => c.status === 'issued').length);
      setCertificatesRevoked(certs.filter(c => c.status === 'revoked').length);

      // Generate recent activities
      const activities = certs.slice(0, 10).map(cert => ({
        id: cert.id,
        type: cert.status === 'revoked' ? 'Certificate Revoked' : 'Certificate Issued',
        description: `Certificate for ${cert.studentName || 'Student'}`,
        date: cert.createdAt || cert.dateIssued || null,
        status: cert.status
      }));
      setRecentActivities(activities);

      // Fetch verification analytics
      const analyticsRes = await api.get('/admin/verification-analytics')
      setVerificationAnalytics(analyticsRes?.data?.data || {})
    } catch (err) {
      console.error('Dashboard metrics error:', err);
    }
  }

  const validAttempts = Number(verificationAnalytics.validAttempts || 0)
  const invalidAttempts = Number(verificationAnalytics.invalidAttempts || 0)
  const totalAttempts = validAttempts + invalidAttempts
  const validRatio = totalAttempts > 0 ? Math.round((validAttempts / totalAttempts) * 100) : 0
  const invalidRatio = totalAttempts > 0 ? (100 - validRatio) : 0
  const totalVisitors = Number(verificationAnalytics.totalVisitors || 0)
  const currentYear = new Date().getFullYear()
  const certificatesIssuedThisYear = certificates.filter((cert) => {
    const status = String(cert?.status || '').toLowerCase()
    const issuedDate = cert?.dateIssued || cert?.createdAt || cert?.created_at
    const year = issuedDate ? new Date(issuedDate).getFullYear() : null
    return status === 'issued' && year === currentYear
  }).length
  const pieSplitRatio = totalAttempts > 0 ? validRatio : 50
  const pieBackground = `conic-gradient(#16a34a 0% ${pieSplitRatio}%, #dc2626 ${pieSplitRatio}% 100%)`
  const pieChartStyle = {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    background: pieBackground,
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.14)',
  }

  useEffect(() => { loadDashboardMetrics(); }, []);

  async function create(){
    try{
      const payload = { name, email, password }
      // Verifier creation removed — always create students via admin
      await api.post('/admin/students', payload)
      setName(''); setEmail(''); setPassword('')
      await loadUsers()
    }catch(err){
      console.error(err)
    }
  }

  return (
    <>
      <Navbar />
      <Sidebar />
      <div className="content-wrapper" style={{ marginTop: '60px', padding: '30px', backgroundColor: '#fff', minHeight: 'calc(100vh - 60px)' }}>
      <div style={{ maxWidth: '1400px', width: '100%' }}>
        <div className="dashboard-summary" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          columnGap: '0.95rem',
          rowGap: '0.8rem',
          maxWidth: '1400px',
          minHeight: 'unset'
        }}>
        <div className="dashboard-card" style={{ background: '#f8fbffb5', border: '2px solid #c6d0dd', borderLeft: '5px solid #2563eb', boxShadow: '0 6px 20px rgba(15, 23, 42, 0.08)', borderRadius: '16px', padding: '1rem 1.1rem', minWidth: 0, maxWidth: 'none', width: '100%', textAlign: 'left', flex: 'none', display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', height: '104px', gap: '0.9rem' }}>
          <i className="bi bi-mortarboard-fill" style={{ fontSize: '1.75rem', color: '#007bff', flex: '0 0 auto', lineHeight: 1, marginTop: '0.1rem', order: 2, marginLeft: '0.7rem' }}></i>
          <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', order: 1 }}>
            <h3 style={{ fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>Total Students</h3>
            <p style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0.35rem 0 0' }}>{totalStudents}</p>
          </div>
        </div>
        <div className="dashboard-card" style={{ background: '#f7fdf9', border: '2px solid #c6d0dd', borderLeft: '5px solid #16a34a', boxShadow: '0 6px 20px rgba(15, 23, 42, 0.08)', borderRadius: '16px', padding: '1rem 1.1rem', minWidth: 0, maxWidth: 'none', width: '100%', textAlign: 'left', flex: 'none', display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', height: '104px', gap: '0.9rem' }}>
          <i className="bi bi-check-circle-fill" style={{ fontSize: '1.75rem', color: '#28a745', flex: '0 0 auto', lineHeight: 1, marginTop: '0.1rem', order: 2, marginLeft: '0.7rem' }}></i>
          <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', order: 1 }}>
            <h3 style={{ fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>Active Students</h3>
            <p style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0.35rem 0 0' }}>{activeStudents}</p>
          </div>
        </div>
        <div className="dashboard-card" style={{ background: '#f5f3ffc8', border: '2px solid #c6d0dd', borderLeft: '5px solid #7c3aed', boxShadow: '0 6px 20px rgba(15, 23, 42, 0.08)', borderRadius: '16px', padding: '1rem 1.1rem', minWidth: 0, maxWidth: 'none', width: '100%', textAlign: 'left', flex: 'none', display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', height: '104px', gap: '0.9rem' }}>
          <i className="bi bi-pause-circle-fill" style={{ fontSize: '1.75rem', color: '#7c3aed', flex: '0 0 auto', lineHeight: 1, marginTop: '0.1rem', order: 2, marginLeft: '0.7rem' }}></i>
          <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', order: 1 }}>
            <h3 style={{ fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>Inactive Students</h3>
            <p style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0.35rem 0 0' }}>{inactiveStudents}</p>
          </div>
        </div>
        <div className="dashboard-card" style={{ background: '#fff8f8', border: '2px solid #c6d0dd', borderLeft: '5px solid #dc2626', boxShadow: '0 6px 20px rgba(15, 23, 42, 0.08)', borderRadius: '16px', padding: '1rem 1.1rem', minWidth: 0, maxWidth: 'none', width: '100%', textAlign: 'left', flex: 'none', display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', height: '104px', gap: '0.9rem' }}>
          <i className="bi bi-slash-circle-fill" style={{ fontSize: '1.75rem', color: '#dc3545', flex: '0 0 auto', lineHeight: 1, marginTop: '0.1rem', order: 2, marginLeft: '0.7rem' }}></i>
          <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', order: 1 }}>
            <h3 style={{ fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>Suspended Students</h3>
            <p style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0.35rem 0 0' }}>{suspendedStudents}</p>
          </div>
        </div>
        <div className="dashboard-card" style={{ background: '#fffaf5', border: '2px solid #c6d0dd', borderLeft: '5px solid #d97706', boxShadow: '0 6px 20px rgba(15, 23, 42, 0.08)', borderRadius: '16px', padding: '1rem 1.1rem', minWidth: 0, maxWidth: 'none', width: '100%', textAlign: 'left', flex: 'none', display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', height: '104px', gap: '0.9rem' }}>
          <i className="bi bi-file-earmark-text-fill" style={{ fontSize: '1.75rem', color: '#f59e0b', flex: '0 0 auto', lineHeight: 1, marginTop: '0.1rem', order: 2, marginLeft: '0.7rem' }}></i>
          <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', order: 1 }}>
            <h3 style={{ fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>Certificates Issued</h3>
            <p style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0.35rem 0 0' }}>{certificatesIssued}</p>
          </div>
        </div>
        <div className="dashboard-card" style={{ background: '#fff1f2', border: '2px solid #c6d0dd', borderLeft: '5px solid #be123c', boxShadow: '0 6px 20px rgba(15, 23, 42, 0.08)', borderRadius: '16px', padding: '1rem 1.1rem', minWidth: 0, maxWidth: 'none', width: '100%', textAlign: 'left', flex: 'none', display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', height: '104px', gap: '0.9rem' }}>
          <i className="bi bi-x-octagon-fill" style={{ fontSize: '1.75rem', color: '#be123c', flex: '0 0 auto', lineHeight: 1, marginTop: '0.1rem', order: 2, marginLeft: '0.7rem' }}></i>
          <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', order: 1 }}>
            <h3 style={{ fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>Certificates Revoked</h3>
            <p style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0.35rem 0 0' }}>{certificatesRevoked}</p>
          </div>
        </div>
        <div className="dashboard-card" style={{ background: '#f0f7ff', border: '2px solid #c6d0dd', borderLeft: '5px solid #0ea5e9', boxShadow: '0 6px 20px rgba(15, 23, 42, 0.08)', borderRadius: '16px', padding: '1rem 1.1rem', minWidth: 0, maxWidth: 'none', width: '100%', textAlign: 'left', flex: 'none', display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', height: '104px', gap: '0.9rem' }}>
          <i className="bi bi-graph-up-arrow" style={{ fontSize: '1.75rem', color: '#0284c7', flex: '0 0 auto', lineHeight: 1, marginTop: '0.1rem', order: 2, marginLeft: '0.7rem' }}></i>
          <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', order: 1 }}>
            <h3 style={{ fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>Verifications This Month</h3>
            <p style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0.35rem 0 0' }}>{verificationAnalytics.verificationsMonth || 0}</p>
          </div>
        </div>
        <div className="dashboard-card" style={{ background: '#eff6ff', border: '2px solid #c6d0dd', borderLeft: '5px solid #2563eb', boxShadow: '0 6px 20px rgba(15, 23, 42, 0.08)', borderRadius: '16px', padding: '1rem 1.1rem', minWidth: 0, maxWidth: 'none', width: '100%', textAlign: 'left', flex: 'none', display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', height: '104px', gap: '0.9rem' }}>
          <i className="bi bi-bar-chart-fill" style={{ fontSize: '1.75rem', color: '#2563eb', flex: '0 0 auto', lineHeight: 1, marginTop: '0.1rem', order: 2, marginLeft: '0.7rem' }}></i>
          <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', order: 1 }}>
            <h3 style={{ fontWeight: 600, fontSize: '0.95rem', margin: 0, color: '#1e3a8a' }}>Certificates Issued Per Year</h3>
            <p style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0.35rem 0 0', color: '#1d4ed8' }}>{certificatesIssuedThisYear}</p>
          </div>
        </div>
        </div>

        <div style={{ marginTop: '2.1rem' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem' }}>Verification Insights</h3>
          <div style={{
            width: '100%',
            maxWidth: '1400px'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: '0.9rem'
            }}>
              <div style={{
                border: '1px solid #cbd5e1',
                borderRadius: '14px',
                padding: '0.95rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                minHeight: '150px',
                background: '#f8fafc'
              }}>
                  <div style={pieChartStyle} />
                  <div>
                    <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem', fontSize: '1.05rem' }}>Valid vs Invalid Attempts</div>
                    <div style={{ fontSize: '0.92rem', color: '#166534' }}>Valid: {validAttempts} ({validRatio}%)</div>
                    <div style={{ fontSize: '0.92rem', color: '#991b1b' }}>Invalid: {invalidAttempts} ({invalidRatio}%)</div>
                    <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.45rem' }}>Validity Rate: {validRatio}%</div>
                  </div>
              </div>
              <div style={{
                border: '1px solid #cbd5e1',
                borderRadius: '14px',
                padding: '0.95rem 1rem',
                display: 'flex',
                alignItems: 'flex-start',
                flexDirection: 'column',
                justifyContent: 'center',
                minHeight: '150px',
                width: '100%',
                background: '#f8fafc',
                borderLeft: '5px solid #0f766e'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem' }}>Total Website Visitors</div>
                  <i className="bi bi-people-fill" style={{ color: '#0f766e', fontSize: '1.2rem', lineHeight: 1 }}></i>
                </div>
                <div style={{ fontSize: '2.25rem', lineHeight: 1.1, fontWeight: 800, color: '#0f766e' }}>{totalVisitors}</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.4rem' }}>
                  Overall recorded visitors
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities Table */}
        <div style={{ marginTop: '3rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.5rem' }}>Recent Activities</h3>
          <div style={{ background: '#fff', border: '3px solid #c6d0dd', boxShadow: '0 4px 16px #e0e0e0', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#d1d5db', borderBottom: '3px solid #c6d0dd' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#495057' }}>Activity</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#495057' }}>Description</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#495057' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#495057' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity) => (
                    <tr key={activity.id} style={{ borderBottom: '2px solid #d4dbe5', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'} onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
                      <td style={{ padding: '1rem', color: '#212529' }}>{activity.type}</td>
                      <td style={{ padding: '1rem', color: '#6c757d' }}>{activity.description}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          background: activity.status === 'issued' ? '#d4edda' : activity.status === 'revoked' ? '#f8d7da' : '#e7e7ff',
                          color: activity.status === 'issued' ? '#155724' : activity.status === 'revoked' ? '#721c24' : '#004085'
                        }}>
                          {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', color: '#6c757d', fontSize: '0.9rem' }}>
                        {formatActivityDate(activity.date)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
                      No recent activities
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}
