import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import SlideNotification from '../components/SlideNotification';
import api from '../services/api';
import { verifyCertificatePublic } from '../services/api';

// Derive the server base (non-API) to download PDFs directly from backend static server
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://certification-verification-system.onrender.com/api';
const PUBLIC_BASE = API_BASE.replace(/\/api$/, '');

export default function ManageCertificates() {
  const location = useLocation();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({
    visible: false,
    type: 'success',
    text: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCert, setSelectedCert] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyData, setVerifyData] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [pdfCacheBust, setPdfCacheBust] = useState(Date.now());
  const [statusFilter, setStatusFilter] = useState('all');

  const showNotification = (text, type = 'success') => {
    setNotification({ visible: true, type, text });
  };

  useEffect(() => {
    loadCertificates();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = (params.get('status') || '').toLowerCase();
    if (['issued', 'revoked'].includes(status)) {
      setStatusFilter(status);
    } else {
      setStatusFilter('all');
    }
  }, [location.search]);

  const loadCertificates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/certificates');
      setCertificates(res.data.data || []);
    } catch (err) {
      showNotification(err?.response?.data?.message || 'Failed to load certificates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (cert) => {
    setSelectedCert(cert);
    setShowDeleteModal(true);
  };

  const handleRevokeClick = (cert) => {
    setSelectedCert(cert);
    setShowRevokeModal(true);
  };

  const handleVerifyClick = async (cert) => {
    setSelectedCert(cert);
    setShowVerifyModal(true);
    setVerifyLoading(true);
    setVerifyData(null);
    try {
      const res = await verifyCertificatePublic(cert.verificationCode);
      setVerifyData(res.data);
    } catch (err) {
      setVerifyData({ success: false, message: err?.response?.data?.message || 'Verification failed' });
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleViewClick = (cert) => {
    setSelectedCert(cert);
    setPdfCacheBust(Date.now());
    setShowViewModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCert) return;
    try {
      await api.delete(`/admin/certificates/${selectedCert.id}`);
      showNotification('Certificate deleted successfully', 'success');
      setShowDeleteModal(false);
      setSelectedCert(null);
      await loadCertificates();
    } catch (err) {
      showNotification(err?.response?.data?.message || 'Failed to delete certificate', 'error');
      setShowDeleteModal(false);
      setSelectedCert(null);
    }
  };

  const handleRevokeConfirm = async () => {
    if (!selectedCert) return;
    try {
      await api.patch(`/admin/certificates/${selectedCert.id}/revoke`);
      showNotification('Certificate revoked successfully', 'success');
      setShowRevokeModal(false);
      setSelectedCert(null);
      await loadCertificates();
    } catch (err) {
      showNotification(err?.response?.data?.message || 'Failed to revoke certificate', 'error');
      setShowRevokeModal(false);
      setSelectedCert(null);
    }
  };

  const handleModalClose = () => {
    setShowDeleteModal(false);
    setShowRevokeModal(false);
    setShowVerifyModal(false);
    setShowViewModal(false);
    setSelectedCert(null);
    setVerifyData(null);
  };

  const filteredCertificates = certificates.filter((cert) => {
    const matchesStatus = statusFilter === 'all' ? true : (cert.status || '').toLowerCase() === statusFilter;
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      cert.studentName?.toLowerCase().includes(q) ||
      cert.studentEmail?.toLowerCase().includes(q) ||
      cert.enrollmentNumber?.toLowerCase?.().includes(q) ||
      cert.examType?.toLowerCase?.().includes(q);

    return matchesStatus && matchesSearch;
  });

  const extractYear = (value) => {
    const normalized = String(value || '').trim();
    if (!normalized) return 'N/A';
    const match = normalized.match(/(\d{4})/);
    return match ? match[1] : 'N/A';
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <SlideNotification
        notification={notification}
        onClose={() => setNotification((prev) => ({ ...prev, visible: false }))}
      />
      <div className="content-wrapper" style={{ marginTop: '60px', padding: '30px', backgroundColor: '#fff', minHeight: 'calc(100vh - 60px)' }}>
        <h2 className="text-2xl fw-bold mb-4">Manage Certificates</h2>

        <div className="mb-4 d-flex flex-column flex-md-row gap-3">
          <input
            type="text"
            className="form-control"
            placeholder="Search by student name, email, Student ID, or exam..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="form-select"
            style={{ maxWidth: '220px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="issued">Issued</option>
            <option value="revoked">Revoked</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-4 shadow-lg overflow-hidden" style={{ borderRadius: '16px' }}>
            <div className="fw-semibold" style={{ background: '#d9dee5', borderBottom: '2px solid #c3cad4', padding: '0.75rem 1rem' }}>Existing Certificates</div>
            <div className="p-0">
            {filteredCertificates.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No certificates found
              </div>
            ) : (
              <table className="table table-striped mb-0">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student</th>
                    <th>Student ID</th>
                    <th>Exam</th>
                    <th>Conduct</th>
                    <th>Issue Date</th>
                    <th>Status</th>
                    <th>View</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCertificates.map((cert, index) => (
                    <tr key={cert.id}>
                      <td>{index + 1}</td>
                      <td>
                        <div>{cert.studentName || 'N/A'}</div>
                        <small className="text-muted">{cert.studentEmail || ''}</small>
                      </td>
                      <td>{cert.enrollmentNumber || '-'}</td>
                      <td>{cert.examType || '-'}</td>
                      <td>{cert.conduct || '-'}</td>
                      <td>{cert.dateIssued ? new Date(cert.dateIssued).toLocaleDateString() : '-'}</td>
                      <td>
                        <span className={`badge ${cert.status === 'revoked' ? 'bg-danger' : 'bg-success'}`}>
                          {cert.status || 'Active'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-info"
                          onClick={() => handleViewClick(cert)}
                          title="View Certificate"
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                      </td>
                      <td>
                        {cert.status !== 'revoked' && (
                          <button
                            className="btn btn-sm btn-warning me-2"
                            onClick={() => handleRevokeClick(cert)}
                            aria-label="Revoke certificate"
                            title="Revoke certificate"
                          >
                            <i className="bi bi-slash-circle"></i>
                          </button>
                        )}
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteClick(cert)}
                          aria-label="Delete certificate"
                          title="Delete certificate"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            </div>
          </div>
        )}
      </div>

      {/* View Certificate Card Modal */}
      {showViewModal && selectedCert && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-info text-white">
                <h5 className="modal-title">
                  <i className="bi bi-card-text me-2"></i>
                  Certificate Details
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={handleModalClose}></button>
              </div>
              <div className="modal-body">
                <div className="card border-0 shadow-sm">
                  <div className="card-body p-4">
                    <div className="row mb-4">
                      <div className="col-12">
                        <h4 className="card-title text-center mb-4">
                          <i className="bi bi-award me-2"></i>
                          CERTIFICATE OF ACHIEVEMENT
                        </h4>
                      </div>
                    </div>

                    <hr />

                    <div className="row mb-3">
                      <div className="col-md-6">
                        <p className="mb-0"><strong>Student Name:</strong> {selectedCert.studentName || 'N/A'}</p>
                      </div>
                      <div className="col-md-6">
                        <p className="mb-0"><strong>Student ID:</strong> {selectedCert.enrollmentNumber || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-6">
                        <p className="mb-0"><strong>Year Enrolled:</strong> {extractYear(selectedCert.startDate)}</p>
                      </div>
                      <div className="col-md-6">
                        <p className="mb-0"><strong>Year Graduated:</strong> {extractYear(selectedCert.finishedDate)}</p>
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-6">
                        <p className="mb-0"><strong>Exam Type:</strong> {selectedCert.examType || 'N/A'}</p>
                      </div>
                      <div className="col-md-6">
                        <p className="mb-0"><strong>Date Issued:</strong> {selectedCert.dateIssued ? new Date(selectedCert.dateIssued).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-12">
                        <p className="mb-0"><strong>Conduct:</strong> {String(selectedCert.conduct || 'N/A').toLowerCase()}</p>
                      </div>
                    </div>

                    <hr />

                    <div className="mt-4">
                      <h6 className="mb-3">Certificate Preview:</h6>
                      <div className="border rounded" style={{ height: '600px', overflow: 'hidden' }}>
                        <iframe
                          src={`${PUBLIC_BASE}/public/certificates/${selectedCert.id}.pdf?v=${pdfCacheBust}`}
                          width="100%"
                          height="100%"
                          style={{ border: 'none' }}
                          title="Certificate Preview"
                        />
                      </div>
                      <div className="text-center mt-3">
                        <a
                          href={`${PUBLIC_BASE}/public/certificates/${selectedCert.id}.pdf?v=${pdfCacheBust}`}
                          download
                          className="btn btn-success"
                        >
                          <i className="bi bi-download me-2"></i>
                          Download PDF
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleModalClose}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verify Modal */}
      {showVerifyModal && selectedCert && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="bi bi-shield-check me-2"></i>
                  Certificate Verification
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={handleModalClose}></button>
              </div>
              <div className="modal-body">
                {verifyLoading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3 text-muted">Verifying certificate on blockchain...</p>
                  </div>
                ) : verifyData ? (
                  <div>
                    <div className={`alert ${verifyData.verified ? 'alert-success' : 'alert-warning'} mb-4`}>
                      <h6 className="mb-0">
                        <i className={`bi ${verifyData.verified ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
                        Status: {verifyData.verified ? 'Verified' : 'Not Verified'}
                      </h6>
                    </div>
                    {verifyData.data && (
                      <div>
                        <div className="row mb-3">
                          <div className="col-md-6">
                            <p className="mb-0"><strong>Student Name:</strong> {verifyData.data.studentName || 'N/A'}</p>
                          </div>
                          <div className="col-md-6">
                            <p className="mb-0"><strong>Student ID:</strong> {verifyData.data.enrollmentNumber || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="row mb-3">
                          <div className="col-md-6">
                            <p className="mb-0"><strong>Year Enrolled:</strong> {extractYear(verifyData.data.startDate)}</p>
                          </div>
                          <div className="col-md-6">
                            <p className="mb-0"><strong>Year Graduated:</strong> {extractYear(verifyData.data.finishedDate)}</p>
                          </div>
                        </div>
                        <div className="row mb-3">
                          <div className="col-md-6">
                            <strong>Date Issued:</strong>
                            <p className="mb-0">{verifyData.data.dateIssued || 'N/A'}</p>
                          </div>
                          <div className="col-md-6">
                            <strong>Status:</strong>
                            <p className="mb-0">
                              <span className={`badge ${verifyData.data.status === 'revoked' ? 'bg-danger' : 'bg-success'}`}>
                                {verifyData.data.status || 'Active'}
                              </span>
                            </p>
                          </div>
                        </div>
                        <hr />
                        <div className="mb-3">
                          <strong>PDF Hash (SHA-256):</strong>
                          <p className="mb-0 font-monospace small text-break">{verifyData.data.pdfHash || 'N/A'}</p>
                        </div>
                        {verifyData.data.blockchainTxHash && (
                          <div className="mb-3">
                            <strong>Blockchain Transaction:</strong>
                            <p className="mb-0 font-monospace small text-break">{verifyData.data.blockchainTxHash}</p>
                          </div>
                        )}
                        <div className="mb-3">
                          <strong>Blockchain Status:</strong>
                          <p className="mb-0">{verifyData.data.blockchainStatus || 'N/A'}</p>
                        </div>
                        {verifyData.data.onChain && (
                          <div className="alert alert-info">
                            <strong>On-Chain Verification:</strong>
                            <p className="mb-0">Registered: {verifyData.data.onChain.registered ? 'Yes' : 'No'}</p>
                            {verifyData.data.onChain.record && (
                              <>
                                <p className="mb-0">Revoked: {verifyData.data.onChain.record.revoked ? 'Yes' : 'No'}</p>
                                <p className="mb-0 small font-monospace">Issuer: {verifyData.data.onChain.record.issuer}</p>
                              </>
                            )}
                          </div>
                        )}
                        <div className="text-center mt-4">
                          <a
                            href={`${PUBLIC_BASE}/public/certificates/${verifyData.data.id}.pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-success"
                          >
                            <i className="bi bi-download me-2"></i>
                            Download PDF Certificate
                          </a>
                        </div>
                      </div>
                    )}
                    {verifyData.message && !verifyData.success && (
                      <div className="alert alert-danger">{verifyData.message}</div>
                    )}
                  </div>
                ) : (
                  <div className="alert alert-warning">No data available</div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleModalClose}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Confirmation Modal */}
      {showRevokeModal && selectedCert && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-warning">
                <h5 className="modal-title">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Confirm Revocation
                </h5>
                <button type="button" className="btn-close" onClick={handleModalClose}></button>
              </div>
              <div className="modal-body">
                <p className="mb-3">Are you sure you want to revoke this certificate?</p>
                <div className="alert alert-light border">
                  <div><strong>Student:</strong> {selectedCert.studentName || 'N/A'}</div>
                  <div><strong>Student ID:</strong> {selectedCert.enrollmentNumber || 'N/A'}</div>
                  <div><strong>Exam:</strong> {selectedCert.examType || 'N/A'}</div>
                </div>
                <p className="text-danger small mb-0">
                  <i className="bi bi-info-circle me-1"></i>
                  This action cannot be undone.
                </p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleModalClose}>Cancel</button>
                <button type="button" className="btn btn-warning" onClick={handleRevokeConfirm}>
                  <i className="bi bi-slash-circle me-1"></i>
                  Revoke Certificate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCert && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">
                  <i className="bi bi-trash me-2"></i>
                  Confirm Deletion
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={handleModalClose}></button>
              </div>
              <div className="modal-body">
                <p className="mb-3">Are you sure you want to delete this certificate?</p>
                <div className="alert alert-light border">
                  <div><strong>Student:</strong> {selectedCert.studentName || 'N/A'}</div>
                  <div><strong>Student ID:</strong> {selectedCert.enrollmentNumber || 'N/A'}</div>
                  <div><strong>Exam:</strong> {selectedCert.examType || 'N/A'}</div>
                </div>
                <p className="text-danger small mb-0">
                  <i className="bi bi-info-circle me-1"></i>
                  This action cannot be undone.
                </p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleModalClose}>Cancel</button>
                <button type="button" className="btn btn-danger" onClick={handleDeleteConfirm}>
                  <i className="bi bi-trash me-1"></i>
                  Delete Certificate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
