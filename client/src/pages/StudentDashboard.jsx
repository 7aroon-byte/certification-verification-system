import React, { useEffect, useState } from 'react'
import api from '../services/api'
import Navbar from '../components/Navbar'
import StudentSidebar from '../components/StudentSidebar'
import '../styles/StudentDashboard.css'

export default function StudentDashboard() {
  const [certs, setCerts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const statusInfo = (cert) => {
    const raw = String(cert?.blockchain_status || cert?.status || 'issued').toLowerCase()
    if (raw === 'revoked') return { label: 'Revoked', tone: 'danger' }
    if (raw === 'verified' || raw === 'onchain') return { label: 'Onchain', tone: 'success' }
    return { label: 'Issued', tone: 'warning' }
  }

  const formatDate = (value) => {
    if (!value) return 'N/A'
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? 'N/A' : parsed.toLocaleDateString()
  }

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/student/certificates')
      setCerts(res?.data?.data || [])
    } catch (err) {
      console.error(err)
      setError(err?.response?.data?.message || 'Failed to load certificates')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const totalCertificates = certs.length
  const onchainCertificates = certs.filter((cert) => statusInfo(cert).label === 'Onchain').length
  const revokedCertificates = certs.filter((cert) => statusInfo(cert).label === 'Revoked').length
  const issuedCertificates = certs.filter((cert) => {
    const raw = String(cert?.blockchain_status || cert?.status || 'issued').toLowerCase()
    return raw === 'issued' || raw === 'onchain' || raw === 'verified'
  }).length

  // Profile update removed per request

  return (
    <>
      <Navbar />
      <StudentSidebar />
      <div className="content-wrapper student-dashboard-page">
        <div className="student-dashboard-shell">
          <section className="student-hero">
            <div>
              <h1>Student Dashboard</h1>
              <p>Track your issued certificates and blockchain status in one place.</p>
            </div>
            <div className="student-hero-badge">
              <span>Total Certificates</span>
              <strong>{totalCertificates}</strong>
            </div>
          </section>

          <section className="student-stats-grid" aria-label="Certificate summary">
            <article className="student-stat-card">
              <span className="student-stat-label">Onchain</span>
              <strong className="student-stat-value">{onchainCertificates}</strong>
            </article>
            <article className="student-stat-card">
              <span className="student-stat-label">Issued</span>
              <strong className="student-stat-value">{issuedCertificates}</strong>
            </article>
            <article className="student-stat-card">
              <span className="student-stat-label">Revoked</span>
              <strong className="student-stat-value">{revokedCertificates}</strong>
            </article>
          </section>

        {error && (
          <div className="student-alert-error" role="alert">
            {error}
          </div>
        )}

        <div className="student-cert-section">
          <h2>My Certificates</h2>
          {loading ? (
            <div className="student-surface-card">
              <p className="student-muted-text">Loading certificates...</p>
            </div>
          ) : certs.length === 0 ? (
            <div className="student-surface-card">
              <p className="student-muted-text">No certificates found.</p>
            </div>
          ) : (
            <div className="student-surface-card student-table-wrap">
              <table className="student-cert-table">
                <thead>
                  <tr>
                    <th>Certificate ID</th>
                    <th>Student ID</th>
                    <th>Exam</th>
                    <th>Issue Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {certs.map((cert) => (
                    <tr key={cert.id || cert._id || cert.verification_code}>
                      <td className="student-code-cell">{cert.verification_code || cert.id || cert._id || 'N/A'}</td>
                      <td>{cert.enrollment_number || 'N/A'}</td>
                      <td>{cert.exam_type || 'N/A'}</td>
                      <td>{formatDate(cert.date_issued || cert.issueDate)}</td>
                      <td>
                        <span className={`student-status-pill student-status-${statusInfo(cert).tone}`}>
                          {statusInfo(cert).label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </div>
      </div>
    </>
  )
}
