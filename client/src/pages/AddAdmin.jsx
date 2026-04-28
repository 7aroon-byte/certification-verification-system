import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import SlideNotification from '../components/SlideNotification';
import api from '../services/api';

export default function AddAdmin() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'admin'
  });
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({
    visible: false,
    type: 'success',
    text: ''
  });
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const showNotification = (text, type = 'success') => {
    setNotification({ visible: true, type, text });
  };

  useEffect(() => {
    const checkRole = async () => {
      try {
        const meRes = await api.get('/admin/me');
        const role = meRes?.data?.data?.role;
        setIsSuperAdmin(role === 'super-admin');
      } catch (err) {
        setIsSuperAdmin(false);
      }
    };

    checkRole();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      showNotification('Name and email are required', 'error');
      return;
    }

    try {
      setSaving(true);
      const response = await api.post('/admin/admins', {
        name: formData.name,
        email: formData.email
      });
      showNotification(response?.data?.message || 'Admin account created successfully', 'success');
      setFormData({ name: '', email: '', role: 'admin' });
    } catch (err) {
      showNotification(err?.response?.data?.message || 'Failed to create admin', 'error');
    } finally {
      setSaving(false);
    }
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
        <h2 className="text-2xl fw-bold mb-4 d-flex align-items-center gap-2">
          <i className="bi bi-person-plus-fill" aria-hidden="true" />
          Add New Admin
        </h2>

        {!isSuperAdmin && (
          <div className="alert alert-danger" role="alert">
            Only super-admin can create admin accounts.
          </div>
        )}

        <div className="card shadow-sm" style={{ maxWidth: '980px', margin: '0 auto' }}>
          <div className="card-header bg-light fw-semibold d-flex align-items-center gap-2">
            <i className="bi bi-shield-plus" aria-hidden="true" />
            Admin Information
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit} style={{ maxWidth: '760px', width: '100%', margin: '0 auto' }}>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Role</label>
                  <input
                    type="text"
                    className="form-control"
                    value="admin"
                    readOnly
                  />
                </div>
                <div className="col-12">
                  <button type="submit" className="btn btn-primary d-inline-flex align-items-center gap-2" disabled={saving || !isSuperAdmin}>
                    <i className="bi bi-person-plus" aria-hidden="true" />
                    {saving ? 'Creating...' : 'Create Admin'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
