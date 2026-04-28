import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionType, setActionType] = useState('');

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/admin/audit-logs', {
        params: {
          limit: 200,
          actionType: actionType || undefined,
        },
      });
      setLogs(res?.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [actionType]);

  return (
    <>
      <Navbar />
      <Sidebar />
      <div className="content-wrapper" style={{ marginTop: '60px', padding: '30px', backgroundColor: '#fff', minHeight: 'calc(100vh - 60px)' }}>
        <h2 className="text-2xl fw-bold mb-4">Audit Logs</h2>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="card mb-3 shadow-sm">
          <div className="card-body d-flex gap-3 align-items-end flex-wrap">
            <div>
              <label className="form-label">Filter by Action</label>
              <select className="form-select" value={actionType} onChange={(e) => setActionType(e.target.value)}>
                <option value="">All</option>
                <option value="ADMIN_LOGIN">ADMIN_LOGIN</option>
                <option value="ADMIN_LOGOUT">ADMIN_LOGOUT</option>
                <option value="STUDENT_LOGIN">STUDENT_LOGIN</option>
                <option value="STUDENT_LOGOUT">STUDENT_LOGOUT</option>
                <option value="CERTIFICATE_ISSUED">CERTIFICATE_ISSUED</option>
                <option value="CERTIFICATE_REVOKED">CERTIFICATE_REVOKED</option>
                <option value="CERTIFICATE_DELETED">CERTIFICATE_DELETED</option>
              </select>
            </div>
            <button className="btn btn-outline-secondary d-inline-flex align-items-center justify-content-center" onClick={loadLogs} aria-label="Refresh" title="Refresh" style={{ width: '38px', height: '38px', color: '#6c757d', borderColor: '#adb5bd' }}>
              <i className="bi bi-arrow-repeat"></i>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-4 shadow-lg overflow-hidden" style={{ borderRadius: '16px' }}>
          <div className="fw-semibold" style={{ background: '#d9dee5', borderBottom: '2px solid #c3cad4', padding: '0.75rem 1rem' }}>Recent Activity</div>
          <div className="p-0">
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div>
              </div>
            ) : logs.length === 0 ? (
              <div className="p-4 text-muted">No audit logs found</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table table-striped mb-0">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Time</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Action</th>
                      <th>Target</th>
                      <th>IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, index) => (
                      <tr key={log.id}>
                        <td>{index + 1}</td>
                        <td>{log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}</td>
                        <td>{log?.details?.email || log.actor_name || 'Unknown'}</td>
                        <td>{log.actor_role || '-'}</td>
                        <td><span className="badge bg-dark">{log.action_type}</span></td>
                        <td>{log.target_type ? `${log.target_type}${log.target_id ? ` #${log.target_id}` : ''}` : '-'}</td>
                        <td>{log.ip_address || '-'}</td>
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
  );
}
