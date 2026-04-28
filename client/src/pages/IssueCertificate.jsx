import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import SlideNotification from '../components/SlideNotification';
import api from '../services/api';

export default function IssueCertificate() {
  const conductPresetOptions = ['Excellent', 'Good', 'Satisfactory', 'Poor'];
  const normalizeConduct = (value, fallback = '') => {
    const normalized = String(value || '').trim();
    if (!normalized) return fallback;

    const lowered = normalized.toLowerCase();
    if (lowered === 'excellent') return 'Excellent';
    if (lowered === 'good') return 'Good';
    if (lowered === 'satisfactory') return 'Satisfactory';
    if (lowered === 'poor') return 'Poor';
    return normalized;
  };

  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [certificateData, setCertificateData] = useState({
    studentEmail: '',
    enrollmentNumber: '',
    enrollmentYear: '',
    graduationYear: '',
    examType: 'SSCE',
    positionHeld: '',
    conduct: ''
  });
  const [walletConnected, setWalletConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    visible: false,
    type: 'success',
    text: ''
  });

  const labelStyle = { fontWeight: 600, color: '#334155', fontSize: '0.9rem', marginBottom: '0.3rem' };
  const inputStyle = {
    borderRadius: '8px',
    borderColor: '#cbd5e1',
    minHeight: '40px',
    boxShadow: 'none',
    outline: 'none'
  };
  const yearToDate = (year, boundary = 'start') => {
    const normalized = String(year || '').trim();
    if (!/^\d{4}$/.test(normalized)) return '';
    return `${normalized}-${boundary === 'start' ? '01-01' : '12-31'}`;
  };

  const showNotification = (text, type = 'success') => {
    setNotification({ visible: true, type, text });
  };

  const mapStudentToCertificateData = (student, previousData) => {
    const enrollmentYear = student?.enrollment_year || student?.enrollmentYear || '';
    const graduationYear = student?.graduation_year || student?.graduationYear || '';
    return {
      ...previousData,
      studentEmail: student?.email || '',
      enrollmentNumber: student?.enrollment_number || student?.enrollmentNumber || '',
      enrollmentYear,
      graduationYear,
      positionHeld: student?.position_held || student?.positionHeld || '',
      conduct: normalizeConduct(student?.conduct, '')
    };
  };

  const handleStudentSelect = async (student) => {
    setSelectedStudent(student.id);
    setStudentSearch(student.name || '');
    setShowStudentDropdown(false);

    try {
      const res = await api.get('/admin/students');
      const latestStudents = res?.data?.data || [];
      const freshStudent = latestStudents.find((item) => String(item.id) === String(student.id)) || student;

      setCertificateData((prev) => mapStudentToCertificateData(freshStudent, prev));
    } catch (err) {
      setCertificateData((prev) => mapStudentToCertificateData(student, prev));
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const res = await api.get('/admin/students');
      setStudents(res.data.data || []);
    } catch (err) {
      showNotification('Failed to load students', 'error');
    }
  };

  const handleConnectWallet = async () => {
    try {
      if (!window?.ethereum) {
        throw new Error('No wallet detected. Please install MetaMask or a compatible wallet.');
      }
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts.length) {
        setWalletConnected(true);
        setWalletAddress(accounts[0]);
        showNotification('Wallet connected successfully', 'success');
      } else {
        throw new Error('Wallet connection was cancelled.');
      }
    } catch (err) {
      setWalletConnected(false);
      setWalletAddress('');
      showNotification(err?.message || 'Failed to connect wallet', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!selectedStudent) {
        throw new Error('Please select a student');
      }

      if (!walletAddress) {
        throw new Error('Please connect a wallet to issue');
      }

      if (!certificateData.enrollmentYear || !certificateData.graduationYear) {
        throw new Error('Selected student is missing enrollment/graduation year. Update student details first.');
      }

      if (!certificateData.positionHeld || !certificateData.conduct) {
        throw new Error('Selected student is missing position held or conduct. Update student details first.');
      }

      const startDate = yearToDate(certificateData.enrollmentYear, 'start');
      const finishDate = yearToDate(certificateData.graduationYear, 'end');

      const res = await api.post('/admin/certificates', {
        studentId: selectedStudent,
        walletAddress,
        ...certificateData,
        startDate,
        finishDate
      });

      const blockchainWarning = res?.data?.data?.blockchainWarning;
      if (blockchainWarning) {
        console.error('[IssueCertificate] Blockchain registration pending:', blockchainWarning);
      }

      showNotification(res.data.message || 'Certificate issued successfully!', 'success');
      setCertificateData({
        studentEmail: '',
        enrollmentNumber: '',
        enrollmentYear: '',
        graduationYear: '',
        examType: 'SSCE',
        positionHeld: '',
        conduct: ''
      });
      setSelectedStudent('');
      setStudentSearch('');
      setWalletConnected(false);
      setWalletAddress('');
    } catch (err) {
      showNotification(err?.response?.data?.message || err.message || 'Failed to issue certificate', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    const query = studentSearch.toLowerCase();
    if (!query) return true;
    return (
      (student.name || '').toLowerCase().includes(query) ||
      (student.email || '').toLowerCase().includes(query) ||
      (student.enrollment_number || '').toLowerCase().includes(query)
    );
  });

  return (
    <>
      <Navbar />
      <Sidebar />
      <SlideNotification
        notification={notification}
        onClose={() => setNotification((prev) => ({ ...prev, visible: false }))}
      />
      <div className="content-wrapper" style={{
        marginTop: '60px',
        padding: '12px 20px 16px',
        backgroundColor: '#fff',
        minHeight: 'calc(100vh - 60px)',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>

        <div className="card shadow-sm" style={{ maxWidth: '720px', width: '100%', borderRadius: '14px', border: '1px solid #dbe3ee', overflow: 'hidden' }}>
          <div className="card-header fw-semibold" style={{ background: '#d9dee5', color: '#0f172a', borderBottom: '1px solid #c3cad4', padding: '0.75rem 1rem', fontSize: '1rem' }}>
            Issue Certificate
          </div>
          <div className="card-body" style={{ padding: '1rem', fontSize: '0.92rem' }}>
          <form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: '0 auto' }}>
            {/* Row 1: Select Student */}
            <div className="row g-2 mb-3">
              <div className="col-12" style={{ position: 'relative' }}>
                <label className="form-label" style={labelStyle}>Select Student</label>
                <input
                  type="text"
                  className="form-control"
                  value={studentSearch}
                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    setShowStudentDropdown(true);
                  }}
                  onFocus={() => setShowStudentDropdown(true)}
                  placeholder="Search by name or Student ID..."
                  required={!selectedStudent}
                  style={{ ...inputStyle, paddingRight: '36px' }}
                />
                <i
                  className="bi bi-chevron-down"
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '43px',
                    color: '#64748b',
                    pointerEvents: 'none'
                  }}
                ></i>
                {showStudentDropdown && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      maxHeight: '200px',
                      overflowY: 'auto',
                      backgroundColor: 'white',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      zIndex: 1000,
                      boxShadow: '0 8px 20px rgba(15, 23, 42, 0.12)',
                      marginTop: '6px'
                    }}
                  >
                    {filteredStudents.map((student) => (
                        <div
                          key={student.id}
                          style={{
                            padding: '10px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f0f0f0'
                          }}
                          onMouseEnter={(e) => (e.target.style.backgroundColor = '#f5f5f5')}
                          onMouseLeave={(e) => (e.target.style.backgroundColor = 'white')}
                          onClick={() => handleStudentSelect(student)}
                        >
                          {student.name}{student.enrollment_number ? ` · ${student.enrollment_number}` : ''}
                        </div>
                      ))}
                    {filteredStudents.length === 0 && (
                      <div style={{ padding: '10px', color: '#999' }}>No students found</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="row g-2 mb-3">
              <div className="col-md-6">
                <label className="form-label" style={labelStyle}>Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  value={certificateData.studentEmail}
                  readOnly
                  title="Auto-filled from selected student"
                  style={inputStyle}
                />
              </div>

            {/* Row 2: Student ID */}
              <div className="col-md-6">
                <label className="form-label" style={labelStyle}>Student ID</label>
                <input
                  type="text"
                  className="form-control"
                  value={certificateData.enrollmentNumber}
                  required
                  readOnly
                  title="Auto-filled from selected student"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Row 3: Enrollment Year & Graduation Year */}
            <div className="row g-2 mb-3">
              <div className="col-md-6">
                <label className="form-label" style={labelStyle}>Enrollment Year</label>
                <input
                  type="text"
                  className="form-control"
                  value={certificateData.enrollmentYear}
                  readOnly
                  required
                  title="Auto-filled from selected student when available"
                  style={inputStyle}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label" style={labelStyle}>Graduation Year</label>
                <input
                  type="text"
                  className="form-control"
                  value={certificateData.graduationYear}
                  readOnly
                  required
                  title="Auto-filled from selected student when available"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Row 4: Exam Completed */}
            <div className="row g-2 mb-3">
              <div className="col-12">
                <label className="form-label" style={labelStyle}>Exam Completed</label>
                <select
                  className="form-select"
                  value={certificateData.examType}
                  onChange={(e) => setCertificateData({ ...certificateData, examType: e.target.value })}
                  required
                  style={inputStyle}
                >
                  <option value="SSCE">Senior Secondary School Certificate Examination (SSCE)</option>
                  <option value="JSCE">Junior Secondary School Certificate Examination (JSCE)</option>
                  <option value="FSLCE">First School Leaving Certificate Examination (FSLCE)</option>
                </select>
              </div>
            </div>

            {/* Row 5: Position Held & Conduct */}
            <div className="row g-2 mb-3">
              <div className="col-md-6">
                <label className="form-label" style={labelStyle}>Position Held</label>
                <input
                  type="text"
                  className="form-control"
                  value={certificateData.positionHeld}
                  readOnly
                  required
                  title="Auto-filled from selected student when available"
                  style={inputStyle}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label" style={labelStyle}>Conduct</label>
                <select
                  className="form-select"
                  value={certificateData.conduct}
                  disabled
                  required
                  style={inputStyle}
                >
                  <option value="">Not provided</option>
                  {!conductPresetOptions.includes(certificateData.conduct) && certificateData.conduct && (
                    <option value={certificateData.conduct}>{certificateData.conduct}</option>
                  )}
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Satisfactory">Satisfactory</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>
            </div>

            <div className="d-flex flex-column flex-md-row gap-2 mt-1">
              <button
                type="button"
                className="btn w-100"
                onClick={handleConnectWallet}
                disabled={walletConnected}
                style={{
                  borderRadius: '8px',
                  minHeight: '40px',
                  fontWeight: 600,
                  padding: '0.45rem 0.75rem',
                  background: walletConnected ? '#198754' : '#dc3545',
                  borderColor: walletConnected ? '#198754' : '#dc3545',
                  color: '#ffffff'
                }}
              >
                {walletConnected ? 'Wallet Connected' : 'Connect Wallet'}
              </button>

              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={loading}
                style={{ borderRadius: '8px', minHeight: '40px', fontWeight: 600, padding: '0.45rem 0.75rem' }}
              >
                {loading ? 'Issuing...' : 'Issue Certificate'}
              </button>
            </div>
          </form>
          </div>
        </div>
      </div>
    </>
  );
}
