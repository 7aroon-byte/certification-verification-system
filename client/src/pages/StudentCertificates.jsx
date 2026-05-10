import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Navbar from '../components/Navbar';
import StudentSidebar from '../components/StudentSidebar';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://certification-verification-system.onrender.com/api';
const PUBLIC_BASE = API_BASE.replace(/\/api$/, '');

export default function StudentCertificates() {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  async function loadCertificates() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/student/certificates');
      setCerts(res?.data?.data || []);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to load certificates');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCertificates();
  }, []);

  const certificateDisplayId = (cert) =>
    cert.verification_code || cert.verificationCode || cert.certificate_id || cert.id || cert._id || 'N/A';

  const filteredCerts = certs.filter((cert) =>
    cert.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.enrollment_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.verification_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPdfHref = (cert) => {
    const pdfId = cert.id || cert.certificateId || cert._id || cert.verification_code;
    if (!pdfId) return null;
    const cacheKey = cert.pdf_hash || `${cert.id || 'cert'}-${cert.date_issued || 'na'}`;
    return `${PUBLIC_BASE}/public/certificates/${pdfId}.pdf?v=${encodeURIComponent(cacheKey)}`;
  };

  return (
    <>
      <Navbar />
      <StudentSidebar />
      <div className="content-wrapper" style={{ marginTop: '56px', padding: '40px 30px', background: '#f6f8fb', minHeight: 'calc(100vh - 56px)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '30px', color: '#1a1a2e' }}>My Certificates</h1>

        {error && (
          <div style={{
            padding: '15px',
            marginBottom: '20px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            borderRadius: '5px',
            border: '1px solid #f5c6cb'
          }}>
            {error}
          </div>
        )}

        <div style={{
          backgroundColor: '#fff',
          padding: '25px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Search by name, Student ID, or verification code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '5px',
                border: '1px solid #ddd',
                fontSize: '1rem'
              }}
            />
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <div style={{ marginBottom: '10px' }}>
                <i className="bi bi-hourglass-split" style={{ fontSize: '2rem', color: '#64748b' }}></i>
              </div>
              <p>Loading certificates...</p>
            </div>
          ) : filteredCerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <div style={{ marginBottom: '10px' }}>
                <i className="bi bi-file-earmark-text" style={{ fontSize: '3rem', color: '#94a3b8' }}></i>
              </div>
              <p>{searchTerm ? 'No certificates match your search.' : 'No certificates found.'}</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>
                      Certificate ID
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>
                      Student Name
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>
                      Student ID
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>
                      Issue Date
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>
                      Status
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>
                      View
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>
                      Download
                    </th>
                    {/* <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>
                      Verification
                    </th> */}
                  </tr>
                </thead>
                <tbody>
                  {filteredCerts.map((cert) => (
                    <tr key={cert.id || cert._id || cert.verification_code} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '12px' }}>{certificateDisplayId(cert)}</td>
                      <td style={{ padding: '12px' }}>{cert.student_name || 'N/A'}</td>
                      <td style={{ padding: '12px' }}>{cert.enrollment_number || 'N/A'}</td>
                      <td style={{ padding: '12px' }}>
                        {cert.date_issued ? new Date(cert.date_issued).toLocaleDateString() : 'N/A'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '5px 10px',
                          borderRadius: '5px',
                          backgroundColor: cert.blockchain_status === 'verified' ? '#d4edda' : '#fff3cd',
                          color: cert.blockchain_status === 'verified' ? '#155724' : '#856404',
                          fontSize: '0.875rem',
                          fontWeight: '600'
                        }}>
                          {cert.blockchain_status || 'Active'}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        {(() => {
                          const href = getPdfHref(cert);
                          if (!href) return <span className="text-muted small">N/A</span>;
                          return (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-outline-primary"
                              title="View certificate"
                            >
                              <i className="bi bi-eye-fill" style={{ color: '#0d6efd' }}></i>
                              <span className="visually-hidden">View</span>
                            </a>
                          );
                        })()}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {(() => {
                          const href = getPdfHref(cert);
                          if (!href) return <span className="text-muted small">N/A</span>;
                          return (
                            <a
                              href={href}
                              download
                              className="btn btn-sm btn-outline-success"
                              title="Download certificate"
                            >
                              <i className="bi bi-download" style={{ color: '#198754' }}></i>
                              <span className="visually-hidden">Download</span>
                            </a>
                          );
                        })()}
                      </td>
                      {/* <td style={{ padding: '12px' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontSize: '0.875rem',
                          backgroundColor: '#e9ecef',
                          padding: '4px 8px',
                          borderRadius: '4px'
                        }}>
                          {cert.verification_code || 'N/A'}
                        </span>
                      </td> */}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </div>

        {/* <div style={{
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', color: '#1a1a2e' }}>
            📊 Certificate Statistics
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0f4c81' }}>{certs.length}</div>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>Total Certificates</div>
            </div>
            <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>
                {certs.filter(c => c.blockchain_status === 'verified').length}
              </div>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>Verified on Blockchain</div>
            </div>
            <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffc107' }}>
                {certs.filter(c => c.blockchain_status !== 'verified').length}
              </div>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>Pending Verification</div>
            </div>
          </div>
        </div> */}
      </div>
    </>
  );
}
