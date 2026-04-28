import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import SlideNotification from '../components/SlideNotification';
import api from '../services/api';

export default function ManageStudent() {
  const normalizeStudentStatus = (value) => {
    const normalized = String(value || 'active').toLowerCase();
    if (normalized === 'graduate' || normalized === 'graduated') return 'graduate';
    if (normalized === 'inactive' || normalized === 'suspended') return 'suspended';
    return 'active';
  };

  const location = useLocation();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({
    visible: false,
    type: 'success',
    text: ''
  });
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editData, setEditData] = useState({
    name: '',
    email: '',
    enrollment_number: '',
    enrollment_year: '',
    graduation_year: '',
    position_held: '',
    conduct: '',
    status: 'active'
  });
  const [sortBy, setSortBy] = useState('name-asc');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const showNotification = (text, type = 'success') => {
    setNotification({ visible: true, type, text });
  };

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = (params.get('status') || '').toLowerCase();
    if (['active', 'inactive', 'suspended', 'graduate', 'graduated'].includes(status)) {
      const normalizedStatus = status === 'graduated' ? 'graduate' : (status === 'inactive' ? 'suspended' : status);
      setStatusFilter(normalizedStatus);
    } else {
      setStatusFilter('all');
    }
  }, [location.search]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/students');
      setStudents(res.data.data || []);
    } catch (err) {
      showNotification(err?.response?.data?.message || 'Failed to load students', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Derived, filtered + sorted students for display
  const visibleStudents = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = students;

    if (statusFilter !== 'all') {
      list = list.filter((s) => normalizeStudentStatus(s.status) === statusFilter);
    }

    if (q) {
      list = list.filter(s =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        String(s.enrollment_number || '').toLowerCase().includes(q)
      );
    }

    const getVal = (s) => {
      switch (true) {
        case sortBy.startsWith('name'):
          return (s.name || '').toLowerCase();
        case sortBy.startsWith('enrollment'):
          // numeric compare fallback
          return Number(s.enrollment_number || 0);
        case sortBy.startsWith('email'):
          return (s.email || '').toLowerCase();
        case sortBy.startsWith('status'):
          return (s.status || '').toLowerCase();
        default:
          return (s.name || '').toLowerCase();
      }
    };

    const asc = sortBy.endsWith('asc');
    const sorted = [...list].sort((a, b) => {
      const va = getVal(a);
      const vb = getVal(b);
      if (va < vb) return asc ? -1 : 1;
      if (va > vb) return asc ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [students, sortBy, query]);

  const handleEdit = (student) => {
    setEditingStudent(student);
    setEditData({ 
      name: student.name, 
      email: student.email,
      enrollment_number: student.enrollment_number || '',
      enrollment_year: student.enrollment_year || '',
      graduation_year: student.graduation_year || '',
      position_held: student.position_held || '',
      conduct: student.conduct || '',
      status: normalizeStudentStatus(student.status)
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...editData,
        status: editData.status === 'graduate'
          ? 'graduated'
          : (editData.status === 'suspended' ? 'inactive' : editData.status)
      };
      await api.put(`/admin/students/${editingStudent.id}`, payload);
      setShowModal(false);
      setEditingStudent(null);
      showNotification('Student information updated successfully', 'success');
      await loadStudents();
    } catch (err) {
      showNotification(err?.response?.data?.message || 'Failed to update student', 'error');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingStudent(null);
  };

  const handleDeleteClick = (student) => {
    setStudentToDelete(student);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!studentToDelete) return;
    
    try {
      await api.delete(`/admin/students/${studentToDelete.id}`);
      showNotification('Student deleted successfully', 'success');
      setShowDeleteModal(false);
      setStudentToDelete(null);
      await loadStudents();
    } catch (err) {
      showNotification(err?.response?.data?.message || 'Failed to delete student', 'error');
      setShowDeleteModal(false);
      setStudentToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setStudentToDelete(null);
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
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
          <h2 className="text-2xl fw-bold mb-0">Manage Students</h2>
          <Link
            to="/admin/add-student"
            className="btn btn-primary"
            style={{
              background: '#0d6efd',
              border: 'none',
              padding: '10px 18px',
              fontWeight: 600,
              boxShadow: '0 8px 24px rgba(13,110,253,0.25)'
            }}
          >
            + Add Student
          </Link>
        </div>
        {loading ? (
          <div className="text-center py-8">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-4 shadow-lg overflow-hidden" style={{ borderRadius: '16px' }}>
            {students.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No students found
              </div>
            ) : (
              <>
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 p-3" style={{ background: '#d9dee5', borderBottom: '2px solid #c3cad4' }}>
                <div className="input-group" style={{ maxWidth: '420px' }}>
                  <span className="input-group-text">Search</span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Filter by name, email or Student ID"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <div className="d-flex align-items-center gap-2" style={{ flexWrap: 'nowrap' }}>
                  <label className="fw-semibold me-2 mb-0" style={{ whiteSpace: 'nowrap' }}>Status</label>
                  <select
                    className="form-select"
                    style={{ minWidth: '170px' }}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="graduate">Graduate</option>
                    <option value="suspended">Suspended</option>
                  </select>
                  <label className="fw-semibold me-2 mb-0" style={{ whiteSpace: 'nowrap' }}>Sort by</label>
                  <select
                    className="form-select"
                    style={{ minWidth: '220px' }}
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="name-asc">Name (A → Z)</option>
                    <option value="name-desc">Name (Z → A)</option>
                    <option value="enrollment-asc">Student ID (Low → High)</option>
                    <option value="enrollment-desc">Student ID (High → Low)</option>
                  </select>
                </div>
              </div>
              <table className="table table-striped mb-0">
                <thead style={{ background: '#d1d7e0' }}>
                  <tr>
                    <th style={{width:'80px'}}>#</th>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Year Enrolled</th>
                    <th>Year Graduated</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleStudents.map((student, idx) => (
                    <tr key={student.id}>
                      <td>{idx + 1}</td>
                      <td>{student.enrollment_number || 'N/A'}</td>
                      <td>{student.name}</td>
                      <td>{student.email}</td>
                      <td>{student.enrollment_year || 'N/A'}</td>
                      <td>{student.graduation_year || 'N/A'}</td>
                      <td>
                        <span
                          className={`badge ${
                            normalizeStudentStatus(student.status) === 'active'
                              ? 'bg-success'
                              : normalizeStudentStatus(student.status) === 'graduate'
                                ? 'bg-primary'
                                : 'bg-danger'
                          }`}
                        >
                          {normalizeStudentStatus(student.status) === 'suspended' ? 'suspended' : normalizeStudentStatus(student.status)}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-warning me-2"
                          onClick={() => handleEdit(student)}
                          aria-label="Edit student"
                          title="Edit student"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteClick(student)}
                          aria-label="Delete student"
                          title="Delete student"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Student</h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={editData.email}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Student ID</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editData.enrollment_number}
                    onChange={(e) => setEditData({ ...editData, enrollment_number: e.target.value })}
                  />
                </div>
                <div className="row g-2">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Year Enrolled</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editData.enrollment_year}
                      onChange={(e) => setEditData({ ...editData, enrollment_year: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Year Graduated</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editData.graduation_year}
                      onChange={(e) => setEditData({ ...editData, graduation_year: e.target.value })}
                    />
                  </div>
                </div>
                <div className="row g-2">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Position Held</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editData.position_held}
                      onChange={(e) => setEditData({ ...editData, position_held: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Conduct</label>
                    <select
                      className="form-control"
                      value={editData.conduct}
                      onChange={(e) => setEditData({ ...editData, conduct: e.target.value })}
                    >
                      <option value="">Select</option>
                      <option value="Excellent">Excellent</option>
                      <option value="Good">Good</option>
                      <option value="Satisfactory">Satisfactory</option>
                      <option value="Poor">Poor</option>
                    </select>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Status</label>
                  <select
                    className="form-control"
                    value={editData.status}
                    onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="graduate">Graduate</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSave}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Confirm Deletion
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={handleDeleteCancel}></button>
              </div>
              <div className="modal-body">
                <p className="mb-3">Are you sure you want to delete this student?</p>
                {studentToDelete && (
                  <div className="alert alert-light border">
                    <div><strong>Name:</strong> {studentToDelete.name}</div>
                    <div><strong>Email:</strong> {studentToDelete.email}</div>
                    <div><strong>Student ID:</strong> {studentToDelete.enrollment_number || 'N/A'}</div>
                  </div>
                )}
                <p className="text-danger small mb-0">
                  <i className="bi bi-info-circle me-1"></i>
                  This action cannot be undone.
                </p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleDeleteCancel}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={handleDeleteConfirm}>
                  <i className="bi bi-trash me-1"></i>
                  Delete Student
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
