import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

export default function AddStudent() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [enrollmentYear, setEnrollmentYear] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [positionHeld, setPositionHeld] = useState('');
  const [conduct, setConduct] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    visible: false,
    type: 'success',
    text: ''
  });
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 1999 + 8 }, (_, index) => String(currentYear + 8 - index));

  const showNotification = (text, type = 'success') => {
    setNotification({ visible: true, type, text });
  };

  React.useEffect(() => {
    if (!notification.visible) return;
    const timer = setTimeout(() => {
      setNotification((prev) => ({ ...prev, visible: false }));
    }, 3500);
    return () => clearTimeout(timer);
  }, [notification.visible, notification.text]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!name || !email || !enrollmentNumber) {
        throw new Error('Name, email, and Student ID are required');
      }

      const res = await api.post('/admin/students', {
        name,
        email,
        contactNumber,
        enrollmentNumber,
        enrollmentYear,
        graduationYear,
        positionHeld,
        conduct,
      });

      showNotification(res.data.message || 'Student added successfully!', 'success');
      setName('');
      setEmail('');
      setContactNumber('');
      setEnrollmentNumber('');
      setEnrollmentYear('');
      setGraduationYear('');
      setPositionHeld('');
      setConduct('');
    } catch (err) {
      showNotification(err?.response?.data?.message || err.message || 'Failed to add student', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <div style={{ position: 'fixed', right: '16px', top: '78px', zIndex: 3000, pointerEvents: 'none' }}>
        <div
          style={{
            minWidth: '320px',
            maxWidth: '520px',
            background: notification.type === 'success' ? '#ecfdf3' : '#fef2f2',
            border: notification.type === 'success' ? '1px solid #86efac' : '1px solid #fca5a5',
            borderLeft: notification.type === 'success' ? '5px solid #22c55e' : '5px solid #ef4444',
            color: notification.type === 'success' ? '#166534' : '#991b1b',
            boxShadow: '0 10px 25px rgba(15, 23, 42, 0.14)',
            borderRadius: '10px',
            padding: '12px 14px',
            transform: notification.visible ? 'translateX(0)' : 'translateX(120%)',
            opacity: notification.visible ? 1 : 0,
            transition: 'transform 0.35s ease, opacity 0.35s ease',
            fontWeight: 600,
            fontSize: '0.92rem'
          }}
        >
          {notification.text}
        </div>
      </div>
      <div className="content-wrapper" style={{ 
        marginTop: '60px',
        padding: '20px',
        backgroundColor: '#fff',
        minHeight: 'calc(100vh - 60px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="bg-white rounded-4 shadow-lg overflow-hidden" style={{ borderRadius: '16px', maxWidth: '760px', width: '100%', margin: '0 auto' }}>
          <div className="fw-semibold d-flex align-items-center" style={{ background: '#d9dee5', borderBottom: '2px solid #c3cad4', padding: '10px 14px', gap: '8px' }}>
            <Link
              to="/admin/manage-student"
              aria-label="Back"
              style={{
                width: '32px',
                height: '32px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                color: '#334155',
                textDecoration: 'none',
                borderRadius: '50%',
                border: '1px solid #c3cad4'
              }}
            >
              <i className="bi bi-chevron-left" aria-hidden="true"></i>
            </Link>
            <i className="bi bi-person-plus" aria-hidden="true"></i>
            <span>Add New Student</span>
          </div>
          <div className="p-3">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">Full Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter student name"
                    required
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">Email Address <span className="text-danger">*</span></label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    required
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">Contact Number</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">Graduation Year <span className="text-danger">*</span></label>
                  <select
                    className="form-select"
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value)}
                    required
                  >
                    <option value="">Select graduation year</option>
                    {yearOptions.map((year) => (
                      <option key={`grad-${year}`} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">Student ID <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    value={enrollmentNumber}
                    onChange={(e) => setEnrollmentNumber(e.target.value)}
                    placeholder="Enter Student ID"
                    required
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">Enrollment Year <span className="text-danger">*</span></label>
                  <select
                    className="form-select"
                    value={enrollmentYear}
                    onChange={(e) => setEnrollmentYear(e.target.value)}
                    required
                  >
                    <option value="">Select enrollment year</option>
                    {yearOptions.map((year) => (
                      <option key={`enroll-${year}`} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">Position Held <span className="text-danger">*</span></label>
                  <select
                    className="form-select"
                    value={positionHeld}
                    onChange={(e) => setPositionHeld(e.target.value)}
                    required
                  >
                    <option value="">Select position</option>
                    <option value="Prefect">Prefect</option>
                    <option value="Class Representative">Class Representative</option>
                    <option value="Sports Captain">Sports Captain</option>
                    <option value="None">None</option>
                  </select>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">Conduct <span className="text-danger">*</span></label>
                  <select
                    className="form-select"
                    value={conduct}
                    onChange={(e) => setConduct(e.target.value)}
                    required
                  >
                    <option value="">Select conduct rating</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Satisfactory">Satisfactory</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 mt-2"
                disabled={loading}
                style={{ 
                  padding: '10px 14px',
                  fontSize: '16px',
                  fontWeight: '600',
                  borderRadius: '8px',
                  boxShadow: '0 8px 24px rgba(13,110,253,0.25)'
                }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Adding...
                  </>
                ) : (
                  'Add Student'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
