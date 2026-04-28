import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import SlideNotification from '../components/SlideNotification';
import api from '../services/api';

export default function ManageAdmins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [notification, setNotification] = useState({
    visible: false,
    type: 'success',
    text: ''
  });
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [currentAdminId, setCurrentAdminId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);

  const showNotification = (text, type = 'success') => {
    setNotification({ visible: true, type, text });
  };

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/admins');
      setAdmins(res.data?.data || []);
    } catch (err) {
      showNotification(err?.response?.data?.message || 'Failed to load admins', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const meRes = await api.get('/admin/me');
        const role = meRes?.data?.data?.role;
        const currentId = meRes?.data?.data?.id;
        const isSuper = role === 'super-admin';
        setIsSuperAdmin(isSuper);
        setCurrentAdminId(currentId || null);
        if (isSuper) {
          await loadAdmins();
        }
      } catch (error) {
        setIsSuperAdmin(false);
      }
    };

    init();
  }, []);

  const handleUpdateAdmin = async (admin) => {
    const nextName = window.prompt('Update admin name:', admin.name || '');
    if (nextName === null) return;

    const nextEmail = window.prompt('Update admin email:', admin.email || '');
    if (nextEmail === null) return;

    if (!nextName.trim() || !nextEmail.trim()) {
      showNotification('Name and email are required', 'error');
      return;
    }

    try {
      setActionLoadingId(admin.id);
      await api.put(`/admin/admins/${admin.id}`, {
        name: nextName.trim(),
        email: nextEmail.trim()
      });
      showNotification('Admin updated successfully', 'success');
      await loadAdmins();
    } catch (err) {
      showNotification(err?.response?.data?.message || 'Failed to update admin', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleSuspend = async (admin) => {
    if (admin.id === currentAdminId) {
      showNotification('You cannot suspend your own account', 'error');
      return;
    }

    const nextStatus = admin.status === 'suspended' ? 'active' : 'suspended';
    const confirmation = window.confirm(
      nextStatus === 'suspended'
        ? `Suspend ${admin.name}?`
        : `Activate ${admin.name}?`
    );
    if (!confirmation) return;

    try {
      setActionLoadingId(admin.id);
      await api.patch(`/admin/admins/${admin.id}/suspend`, { status: nextStatus });
      showNotification(nextStatus === 'suspended' ? 'Admin suspended successfully' : 'Admin re-activated successfully', 'success');
      await loadAdmins();
    } catch (err) {
      showNotification(err?.response?.data?.message || 'Failed to update admin status', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteAdmin = async (admin) => {
    if (admin.id === currentAdminId) {
      showNotification('You cannot delete your own account', 'error');
      return;
    }

    setAdminToDelete(admin);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!adminToDelete) return;

    try {
      setActionLoadingId(adminToDelete.id);
      await api.delete(`/admin/admins/${adminToDelete.id}`);
      showNotification('Admin deleted successfully', 'success');
      setShowDeleteModal(false);
      setAdminToDelete(null);
      await loadAdmins();
    } catch (err) {
      showNotification(err?.response?.data?.message || 'Failed to delete admin', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setAdminToDelete(null);
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
        <div className="d-flex align-items-center justify-content-between mb-4 gap-2 flex-wrap">
          <h2 className="text-2xl fw-bold mb-0">Manage Admins</h2>
          {isSuperAdmin && (
            <Link to="/admin/add-admin" className="btn btn-primary d-inline-flex align-items-center gap-2">
              <i className="bi bi-person-plus-fill" aria-hidden="true" />
              Add New Admin
            </Link>
          )}
        </div>

        {!isSuperAdmin && (
          <div className="alert alert-danger" role="alert">
            Only super-admin can manage admin accounts.
          </div>
        )}

        <div className="bg-white rounded-4 shadow-lg overflow-hidden" style={{ borderRadius: '16px' }}>
          <div className="fw-semibold" style={{ background: '#d9dee5', borderBottom: '2px solid #c3cad4', padding: '0.75rem 1rem' }}>Existing Admins</div>
          <div className="p-0">
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : admins.length === 0 ? (
              <div className="p-4 text-muted">No admins found</div>
            ) : (
              <table className="table table-striped mb-0">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin, index) => (
                    <tr key={admin.id}>
                      <td>{index + 1}</td>
                      <td>{admin.name}</td>
                      <td>{admin.email}</td>
                      <td>
                        <span className={`badge ${admin.role === 'super-admin' ? 'bg-danger' : 'bg-primary'}`}>
                          {admin.role}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${admin.status === 'suspended' ? 'bg-warning text-dark' : 'bg-success'}`}>
                          {admin.status || 'active'}
                        </span>
                      </td>
                      <td>{admin.created_at ? new Date(admin.created_at).toLocaleDateString() : 'N/A'}</td>
                      <td>
                        <div className="d-flex gap-2 flex-wrap">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            disabled={!isSuperAdmin || actionLoadingId === admin.id || admin.role === 'super-admin'}
                            onClick={() => handleUpdateAdmin(admin)}
                          >
                            Update
                          </button>
                          <button
                            type="button"
                            className={`btn btn-sm ${admin.status === 'suspended' ? 'btn-success' : 'btn-warning'}`}
                            disabled={!isSuperAdmin || actionLoadingId === admin.id || admin.role === 'super-admin'}
                            onClick={() => handleToggleSuspend(admin)}
                          >
                            {admin.status === 'suspended' ? 'Activate' : 'Suspend'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            disabled={!isSuperAdmin || actionLoadingId === admin.id || admin.role === 'super-admin'}
                            onClick={() => handleDeleteAdmin(admin)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {showDeleteModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000,
              padding: '16px'
            }}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                width: '100%',
                maxWidth: '460px',
                borderRadius: '12px',
                boxShadow: '0 20px 50px rgba(2, 6, 23, 0.25)',
                overflow: 'hidden'
              }}
            >
              <div style={{ padding: '18px 22px', borderBottom: '1px solid #e5e7eb' }}>
                <h5 style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>Delete Admin</h5>
              </div>

              <div style={{ padding: '18px 22px', color: '#334155' }}>
                {adminToDelete ? (
                  <>
                    <p style={{ marginBottom: '8px' }}>
                      You are about to delete <strong>{adminToDelete.name}</strong>.
                    </p>
                    <p style={{ marginBottom: 0, fontSize: '0.95rem' }}>
                      This action cannot be undone.
                    </p>
                  </>
                ) : (
                  <p style={{ marginBottom: 0 }}>This action cannot be undone.</p>
                )}
              </div>

              <div
                style={{
                  padding: '14px 22px',
                  borderTop: '1px solid #e5e7eb',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px'
                }}
              >
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={handleDeleteCancel}
                  disabled={actionLoadingId === adminToDelete?.id}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDeleteConfirm}
                  disabled={actionLoadingId === adminToDelete?.id}
                >
                  {actionLoadingId === adminToDelete?.id ? 'Deleting...' : 'Delete Admin'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
